import Phaser from 'phaser'

import { DEFAULT_LEVEL, LEVEL_BY_ID, nextLevelId, veneraEnemies } from '../data/campaign.js'
import { AdventureState, readSave, writeSave } from '../state/AdventureState.js'

const FLOOR = 480
// Flying Venera robots hover at these heights (the parachute one chases, the others patrol).
const FLYER_HEIGHT = { float: FLOOR - 130, strafe: FLOOR - 150, bomb: 150 }
const labelStyle = {
  fontFamily: 'monospace',
  fontSize: '13px',
  color: '#f3f5e9',
  backgroundColor: '#152137',
  padding: { x: 7, y: 5 },
  align: 'center',
}

export default class PlayScene extends Phaser.Scene {
  constructor() {
    super('PlayScene')
  }

  init(data = {}) {
    this.requestedLevel = data.level
    this.restartRequested = data.restart === true
    this.customLevel = data.custom || null
  }

  create() {
    try {
      this.storage = window.localStorage
    } catch {
      this.storage = null
    }
    const loaded = readSave(this.storage)
    this.state = new AdventureState(loaded.save)
    if (this.customLevel) {
      this.state.customLevel = this.customLevel
      this.state.deaths = 0
    } else
      this.state.selectLevel(
        this.requestedLevel || this.state.currentLevel || DEFAULT_LEVEL,
        this.restartRequested
      )
    this.level = this.state.level
    this.width = this.level.width
    this.saveAvailable = loaded.available
    this.mode = 'menu'
    this.elapsed = 0
    this.facing = 1
    this.shotReady = 0
    this.invulnerableUntil = 0
    this.ragdoll = null
    this.blastReady = 0
    this.slam = false
    this.lastGrounded = false
    this.padPrevious = {}
    this.message = this.level.message
    this.messageUntil = 0
    this.encounterTimers = []
    this.bossHealth = this.level.finalBoss ? this.level.bossMaxHealth : 0
    this.bossMaxHealth = this.bossHealth
    this.bossAttackReady = 0
    this.lastOutcome = null
    this.bananaHint = false
    this.chaseHint = false
    this.shieldHint = false
    this.ambushHint = false
    // These are only (re)assigned by buildLevel() when the current level calls for
    // them. Phaser reuses this same scene instance across scene.restart(), so without
    // clearing them here a level that skips one (e.g. no crumb this time) would keep a
    // stale reference to a destroyed sprite from a previous level and crash on use.
    this.giants = []
    this.ship = null
    this.crumbs = []
    this.fakeFlags = []
    this.giantClock = 0
    this.boss = null

    this.physics.world.gravity.y = this.level.gravity
    this.physics.world.setBounds(0, -400, this.width, 1200)
    this.cameras.main.setBounds(0, 0, this.width, 540)
    this.drawBackground()
    this.platforms = this.physics.add.staticGroup()
    this.legPlatforms = this.physics.add.group({ allowGravity: false, immovable: true })
    this.bridges = this.physics.add.group({ allowGravity: false, immovable: true })
    this.enemies = this.physics.add.group()
    this.bananas = this.physics.add.group()
    this.enemyShots = this.physics.add.group({ allowGravity: false })
    this.hazards = this.physics.add.group({ allowGravity: false })
    this.shots = this.physics.add.group()
    this.bossShots = this.physics.add.group({ allowGravity: false })
    this.blocks = this.physics.add.group({ allowGravity: false, immovable: true })
    this.buildLevel()
    this.spawnPlayer()
    this.registerPhysics()
    this.registerInput()
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12, -100, 0)
    this.actionHandler = (action) => this.handleAction(action)
    this.game.events.on('ui:action', this.actionHandler)
    this.events.once('shutdown', () => this.cleanUp())
    this.persist()
    this.physics.pause()
    this.publish()
  }

  drawBackground() {
    this.cameras.main.setBackgroundColor(this.level.sky)
    const far = this.add.graphics().setScrollFactor(0.08)
    if (this.level.world === 'w5' || this.level.world === 'w6') {
      for (let i = 0; i < Math.ceil(this.width / 240); i++) {
        far
          .fillStyle(0xffffff, 0.75)
          .fillEllipse(100 + i * 240, 90 + (i % 3) * 45, 110, 30)
      }
    } else if (this.level.world === 'w7') {
      // Venus: thick bands of golden sulphuric cloud, no stars.
      for (let i = 0; i < 11; i++)
        far
          .fillStyle(i % 2 ? 0xf3c970 : 0x9c6420, 0.4)
          .fillEllipse(60 + i * 150, 50 + (i % 4) * 78, 300, 52)
    } else {
      for (let i = 0; i < Math.ceil(this.width / 25); i++)
        far
          .fillStyle(i % 4 ? 0xffffff : this.level.accent, 0.65)
          .fillRect((i * 137 + 19) % this.width, (i * 83 + 11) % 390, i % 5 ? 2 : 3, 2)
    }
    far.fillStyle(this.level.sun, 0.15).fillCircle(790, 130, 68)
    far.fillStyle(this.level.sun, 1).fillCircle(790, 130, 45)
    const hills = this.add.graphics().setScrollFactor(0.35)
    for (let i = 0; i < Math.ceil(this.width / 170); i++) {
      hills
        .fillStyle(this.level.soil, 0.55)
        .fillRect(i * 170, 365 - (i % 3) * 25, 185, 180)
      if (this.level.trap === 'swarm')
        hills.fillStyle(this.level.accent, 0.25).fillCircle(i * 170 + 60, 350, 34)
      if (this.level.trap === 'fire')
        hills
          .fillStyle(0xff873d, 0.35)
          .fillTriangle(i * 170, 410, i * 170 + 80, 300, i * 170 + 160, 410)
      else if (this.level.world === 'w7') {
        const peak = 285 + (i % 3) * 22
        hills
          .fillStyle(0x3a2412, 0.9)
          .fillTriangle(i * 170 - 30, 440, i * 170 + 80, peak, i * 170 + 190, 440)
        if (i % 2) hills.fillStyle(0xff7a2f, 0.75).fillCircle(i * 170 + 80, peak + 4, 9)
      }
    }
    // A dense yellow haze over everything.
    if (this.level.world === 'w7')
      this.add.rectangle(480, 270, 960, 540, 0xe8a83a, 0.13).setScrollFactor(0).setDepth(30)
  }

  addGround(x, width, y = FLOOR, height = 100) {
    if (width <= 0) return
    const ground = this.add.rectangle(x, y, width, height, this.level.soil).setOrigin(0)
    this.add.rectangle(x, y, width, 10, this.level.ground).setOrigin(0)
    this.physics.add.existing(ground, true)
    this.platforms.add(ground)
  }

  // The view below the floor is only ~60px tall and the hills/soil are the same colour
  // as the ground in dark worlds, so a pit needs its own black void, a red glow at the
  // bottom and yellow-and-black warning stripes down both rims to stand out everywhere.
  addPit(start, end) {
    const depth = 540 - FLOOR
    this.add.rectangle(start, FLOOR, end - start, depth, 0x04050a).setOrigin(0)
    for (let i = 0; i < 4; i++)
      this.add
        .rectangle(start, 540 - 6 * (i + 1), end - start, 6, 0xff3b3b, 0.5 - i * 0.12)
        .setOrigin(0)
    for (const x of [start - 8, end]) {
      for (let y = FLOOR; y < 540; y += 12)
        this.add
          .rectangle(x, y, 8, 12, (y - FLOOR) % 24 ? 0x1a1a1a : 0xffd23f)
          .setOrigin(0)
          .setDepth(1)
    }
  }

  addPlatform(x, y, width) {
    const platform = this.add.rectangle(x, y, width, 22, this.level.ground)
    platform.setStrokeStyle(4, this.level.accent)
    this.physics.add.existing(platform, true)
    this.platforms.add(platform)
  }

  addLegPlatform(x, y, width) {
    const platform = this.add.rectangle(x, y, width, 22, this.level.ground)
    platform.setStrokeStyle(4, 0xff8fae)
    this.physics.add.existing(platform, false)
    platform.body.setAllowGravity(false).setImmovable(true)
    platform.setData({ homeX: x, homeY: y, triggered: false })
    this.legPlatforms.add(platform)
  }

  sign(x, y, text) {
    this.add.rectangle(x, y + 34, 5, 48, this.level.soil)
    this.add.text(x, y, text, labelStyle).setOrigin(0.5)
  }

  buildLevel() {
    let cursor = 0
    for (const [start, end] of this.level.gaps) {
      this.addGround(cursor, start - cursor)
      this.addPit(start, end)
      cursor = end
    }
    this.addGround(cursor, this.width - cursor)
    this.level.platforms.forEach((p) =>
      p.legs ? this.addLegPlatform(p.x, p.y, p.width) : this.addPlatform(p.x, p.y, p.width)
    )
    this.sign(190, 395, `${this.level.name.toUpperCase()}\n${this.level.short}`)
    if (this.level.signText)
      this.sign(Math.round(this.level.platformWidth * 0.52), 410, this.level.signText)
    if (!this.level.finalBoss && !this.level.custom)
      this.sign(this.level.width - 420, 390, 'SPACESHIP THIS WAY\nProbably.')

    this.checkpointFlags = this.level.checkpoints.slice(1).map((x, index) => {
      const base = this.level.checkpointYs?.[index + 1] ?? FLOOR
      this.add.rectangle(x, base - 38, 4, 76, 0xe6f1e7)
      const flag = this.add.rectangle(x + 20, base - 65, 38, 22, this.level.accent)
      this.add.text(x - 9, base - 98, `CP ${index + 1}`, {
        ...labelStyle,
        fontSize: '11px',
      })
      return { x, base, flag, index: index + 1 }
    })
    this.buildThemeTrap()
    this.buildJoke()
    this.spawnRegularEnemies()
    this.spawnBananas()
    const giantXs = this.level.giants || (this.level.giant ? [this.level.giantX] : [])
    giantXs.forEach((x, index) => this.spawnGiant(x, index))
    if (this.level.finalBoss) this.buildBossArena()
    else {
      const shipX = this.level.shipX ?? this.width - 125
      this.ship = this.add.image(shipX, FLOOR - 38, 'ship').setScale(1.15)
      this.add.text(shipX - 85, 350, 'LEVEL EXIT\nBoard spaceship', labelStyle)
    }
  }

  spawnGiant(x, index) {
    const key = this.level.giantKey || 'giant'
    const giant = this.physics.add
      .sprite(x, FLOOR - 44, key)
      .setTint(this.level.giantTint)
      .setImmovable(true)
    const { width: gw, height: gh } = giant
    giant.homeX = x
    giant.homeY = FLOOR - gh / 2 - 2
    giant.phaseOffset = index * 1.7
    giant.y = giant.homeY
    if (key === 'giant') giant.body.setAllowGravity(false).setSize(115, 74).setOffset(5, 8)
    else
      giant.body
        .setAllowGravity(false)
        .setSize(gw * 0.8, gh * 0.88)
        .setOffset(gw * 0.1, gh * 0.1)
    this.add.text(x - 80, Math.min(330, FLOOR - gh - 28), 'GIGANTIC = ONE HIT', {
      ...labelStyle,
      color: '#ffb6bf',
    })
    this.giants.push(giant)
  }

  buildCustomObjects() {
    for (const x of this.level.bridges) {
      const bridge = this.bridges.create(x, FLOOR + 8, 'bridge')
      bridge.homeX = x
      bridge.homeY = FLOOR + 8
    }
    for (const { type, x, y } of this.level.hazardList) {
      if (type === 'icicle') {
        const ice = this.hazards.create(x, 85, 'icicle')
        ice.setData({ type: 'drop', startY: 85, triggerX: x - 170 })
      }
      if (type === 'fire') {
        const fire = this.hazards.create(x, FLOOR - 16, 'fireball')
        fire.setData({ type: 'fire', homeX: x, phase: (x / 40) % 6 })
      }
      if (type === 'parasite') {
        const bug = this.hazards.create(x, y, this.level.swarmKey || 'parasite')
        bug.setData({
          type: this.level.swarmStyle === 'drift' ? 'drift' : 'swarm',
          homeX: x,
          homeY: y,
          phase: (x / 40) % 6,
          message: this.level.swarmMessage,
        })
      }
      if (type === 'block') {
        const block = this.blocks.create(x, 150, 'block')
        block.setTint(0x9b7653)
        block.setData({ triggerX: x - 150, dropped: false })
      }
    }
  }

  // World-specific floating parasites (e.g. the drifting Venus kind) on top of the trap.
  buildExtraSwarm() {
    const count = this.level.extraSwarm || 0
    const span = this.level.platformWidth - 1300
    for (let i = 0; i < count; i++) {
      const x = 700 + Math.round(((i + 0.5) * span) / count)
      const y = 210 + (i % 3) * 55
      const bug = this.hazards.create(x, y, this.level.swarmKey)
      bug.setData({
        type: this.level.swarmStyle === 'drift' ? 'drift' : 'swarm',
        homeX: x,
        homeY: y,
        phase: i * 1.3,
        message: this.level.swarmMessage,
      })
    }
  }

  buildThemeTrap() {
    if (this.level.custom) {
      this.buildCustomObjects()
      return
    }
    this.buildExtraSwarm()
    const gaps = this.level.gaps
    const span = this.level.platformWidth - 960
    if (this.level.trap === 'bridge') {
      gaps.forEach(([start, end], i) => {
        if (i % 2 !== 0) return
        for (let x = start - 40; x < end + 40; x += 48) {
          const bridge = this.bridges.create(x, FLOOR + 8, 'bridge')
          bridge.homeX = x
          bridge.homeY = FLOOR + 8
        }
      })
    }
    if (this.level.trap === 'icicles') {
      const count = Math.max(3, Math.round(span / 420))
      for (let i = 0; i < count; i++) {
        const x = 460 + Math.round(((i + 1) * span) / (count + 1))
        const ice = this.hazards.create(x, 85, 'icicle')
        ice.setData({ type: 'drop', startY: 85, triggerX: x - 170 })
      }
    }
    if (this.level.trap === 'fire') {
      const count = Math.max(2, Math.round(span / 620))
      for (let i = 0; i < count; i++) {
        const x = 460 + Math.round(((i + 1) * span) / (count + 1))
        const fire = this.hazards.create(x, FLOOR - 16, 'fireball')
        fire.setData({ type: 'fire', homeX: x, phase: i * 1.5 })
      }
    }
    if (this.level.trap === 'swarm') {
      const count = Math.max(6, Math.round(span / 170))
      for (let i = 0; i < count; i++) {
        const x = 460 + i * 170
        if (x > this.level.platformWidth - 500) break
        const bug = this.hazards.create(x, 230 + (i % 3) * 55, 'parasite')
        bug.setData({ type: 'swarm', homeX: bug.x, homeY: bug.y, phase: i * 0.7 })
      }
    }
    if (this.level.trap === 'earthBlock') {
      const count = Math.max(2, Math.round(span / 520))
      for (let i = 0; i < count; i++) {
        const x = 460 + Math.round(((i + 1) * span) / (count + 1))
        const block = this.blocks.create(x, 150, 'block')
        block.setTint(0x9b7653)
        block.setData({ triggerX: x - 150, dropped: false })
      }
    }
  }

  buildJoke() {
    for (const joke of [this.level.joke, ...(this.level.extraJokes || [])]) {
      if (joke.type === 'runaway') {
        const crumb = this.physics.add.sprite(joke.x, FLOOR - 46, 'crumb')
        crumb.body.setAllowGravity(false)
        crumb.homeX = joke.x
        crumb.fled = false
        this.crumbs.push(crumb)
      }
      if (joke.type === 'fakeFlag') {
        this.add.rectangle(joke.x, FLOOR - 24, 5, 48, this.level.soil)
        const flag = this.add.image(joke.x, FLOOR - 60, 'fake-flag')
        this.physics.add.existing(flag, true)
        flag.setData('triggered', false)
        this.fakeFlags.push(flag)
      }
    }
  }

  spawnBananas() {
    for (const [index, { x, min, max }] of (this.level.bananas || []).entries()) {
      const banana = this.bananas.create(x, FLOOR - 30, 'banana').setScale(1.4)
      banana.setBounce(0, 0.55)
      banana.setData({
        homeX: x,
        min,
        max,
        direction: index % 2 ? 1 : -1,
        freeUntil: 0,
        nextHop: 0,
        cooldown: 0,
      })
    }
  }

  spawnRegularEnemies() {
    for (const spec of this.level.enemies) this.spawnEnemy(spec)
  }

  spawnEnemy(spec, y = FLOOR - 28) {
    const { x, min, max } = spec
    const swarm = this.level.trap === 'swarm'
    const hover = FLYER_HEIGHT[spec.behavior]
    const enemy = this.enemies
      .create(
        x,
        hover ?? y,
        spec.key || this.level.enemyKey || (swarm ? 'parasite' : 'ninja')
      )
      .setScale(spec.scale ?? this.level.enemyScale ?? (swarm ? 1.5 : 1.6))
      .setTint(this.level.enemyTint)
    if (hover) enemy.body.setAllowGravity(false)
    enemy.setData({
      min,
      max,
      direction: -1,
      behavior: spec.behavior || 'walk',
      speed: spec.speed ?? 85,
      chaseSpeed: spec.chaseSpeed ?? 0,
      chaseMin: spec.chaseMin ?? min,
      chaseMax: spec.chaseMax ?? max,
      hp: spec.hp ?? 1,
      hop: spec.hop === true,
      splits: spec.splits === true,
      nextHop: 0,
      alertAt: 0,
      phase: 'idle',
      phaseUntil: 0,
      dashDirection: 1,
      shootAt: 0,
      bob: (x / 50) % 6,
      hover: hover ?? 0,
      shield: spec.shield === true,
    })
    enemy.setVelocityX(-(spec.speed ?? 85))
    if (spec.behavior === 'ambush') {
      // Buried: invisible and untouchable, with just a mound and a drill tip showing.
      enemy.setData({ phase: 'buried', mound: this.add.image(x, FLOOR - 9, 'dirt-mound') })
      enemy.disableBody(true, true)
    }
    return enemy
  }

  buildBossArena() {
    this.bossHomeX = this.level.bossX
    this.addPlatform(this.level.platformWidth + 300, 360, 150)
    this.addPlatform(this.level.platformWidth + 650, 300, 130)
    this.addPlatform(this.level.platformWidth + 1000, 360, 150)
    this.sign(
      this.level.platformWidth + 120,
      420,
      `${this.level.bossMaxHealth} KANGAROO HITS\nNo sauce provided`
    )
    this.boss = this.physics.add
      .sprite(this.bossHomeX, FLOOR - 55, 'prawn-boss')
      .setScale(1.55)
      .setImmovable(true)
    this.boss.body.setAllowGravity(false).setSize(125, 85).setOffset(8, 8)
    this.add.text(this.bossHomeX - 130, 285, 'THE JAPANESE EMPIRE\nIN A BIG PRAWN SUIT', {
      ...labelStyle,
      color: '#ffb4a9',
    })
  }

  // The pigeon's outfit depends on the world (tuxedo in Banana World, space suit on Venus).
  pigeonKey(flapping = false) {
    const base = this.level.costume ? `pigeon-${this.level.costume}` : 'pigeon'
    return flapping ? `${base}-flap` : base
  }

  spawnPlayer() {
    this.player = this.physics.add
      .sprite(this.state.checkpointX, (this.state.checkpointY ?? FLOOR) - 28, this.pigeonKey())
      .setScale(1.35)
      .setDepth(8)
    this.player.body.setSize(22, 26).setOffset(5, 5)
    this.player.setMaxVelocity(310, 1000).setDragX(this.level.friction)
  }

  registerPhysics() {
    this.physics.add.collider(this.player, this.platforms)
    this.physics.add.collider(this.player, this.legPlatforms, (_player, plat) =>
      this.spookPlatform(plat)
    )
    this.physics.add.collider(this.player, this.bridges, (_player, bridge) =>
      this.collapseBridge(bridge)
    )
    this.physics.add.collider(this.enemies, this.platforms)
    this.physics.add.collider(this.enemies, this.legPlatforms)
    this.physics.add.collider(this.blocks, this.platforms)
    this.physics.add.collider(this.shots, this.platforms, (shot) => {
      if (shot.body.blocked.left || shot.body.blocked.right) shot.destroy()
    })
    this.physics.add.collider(this.shots, this.legPlatforms, (shot) => {
      if (shot.body.blocked.left || shot.body.blocked.right) shot.destroy()
    })
    this.physics.add.collider(this.shots, this.bridges)
    this.physics.add.overlap(this.player, this.enemies, (_player, enemy) =>
      this.hitEnemy(enemy)
    )
    this.physics.add.overlap(this.player, this.hazards, (_player, hazard) =>
      this.hurt(false, hazard.getData('message') || this.level.hazardMessage)
    )
    this.physics.add.overlap(this.player, this.blocks, () =>
      this.hurt(false, 'The scenery has become interactive.')
    )
    this.physics.add.overlap(this.player, this.bossShots, () =>
      this.hurt(false, 'Prawn-powered projectile. Extremely shellfish.')
    )
    this.physics.add.overlap(this.player, this.enemyShots, (_player, pulse) => {
      const message = pulse.getData('message') || 'Radar pulse: your plumage has been mapped.'
      pulse.destroy()
      this.hurt(false, message)
    })
    this.physics.add.overlap(this.enemyShots, this.platforms, (pulse) => {
      if (pulse.getData('bomb')) pulse.destroy()
    })
    this.physics.add.overlap(this.shots, this.enemies, (shot, enemy) => {
      shot.destroy()
      // A shielded robot (Venera 14) blocks kangaroos that hit it from the front.
      if (enemy.getData('shield') && (shot.x - enemy.x) * (enemy.flipX ? -1 : 1) > 0) {
        this.pop(enemy.x, enemy.y - 10, 'PING!')
        if (!this.shieldHint) {
          this.shieldHint = true
          this.say('Venera 14 has a shield. Go round the back, or slam it.')
        }
        return
      }
      this.damageEnemy(enemy, "ROO'D!")
    })
    this.physics.add.collider(this.bananas, this.platforms)
    this.physics.add.collider(this.bananas, this.legPlatforms)
    this.physics.add.collider(this.bananas, this.bridges)
    this.physics.add.overlap(this.player, this.bananas, (_player, banana) =>
      this.bounceBanana(banana)
    )
    this.physics.add.overlap(this.shots, this.bananas, (shot, banana) =>
      this.launchBanana(shot, banana)
    )
    this.physics.add.overlap(this.bananas, this.enemies, (banana, enemy) =>
      this.bananaHitsEnemy(banana, enemy)
    )
    if (this.giants.length)
      this.physics.add.overlap(this.player, this.giants, () =>
        this.hurt(true, 'Gigantic means gigantic. Ten hearts were not consulted.')
      )
    if (this.boss) {
      this.physics.add.overlap(this.player, this.boss, () =>
        this.hurt(true, 'Direct contact with prawn technology is discouraged.')
      )
      this.physics.add.overlap(this.shots, this.boss, (shot) => this.hitBoss(shot))
    }
    if (this.fakeFlags.length)
      this.physics.add.overlap(this.player, this.fakeFlags, (_player, flag) =>
        this.hitFakeFlag(flag)
      )
  }

  registerInput() {
    this.heldKeys = new Set()
    this.keyEdges = new Set()
    const keyName = (event) =>
      ({
        ' ': 'SPACE',
        ArrowUp: 'UP',
        ArrowDown: 'DOWN',
        ArrowLeft: 'LEFT',
        ArrowRight: 'RIGHT',
        Escape: 'ESC',
      })[event.key] || event.key.toUpperCase()
    this.onKeyDown = (event) => {
      if (document.body.classList.contains('editor-open')) return
      if (event.target?.matches('textarea,input,button')) return
      const name = keyName(event)
      if (
        ![
          'A',
          'D',
          'W',
          'S',
          'SPACE',
          'UP',
          'DOWN',
          'LEFT',
          'RIGHT',
          'X',
          'J',
          'L',
          'ESC',
          'P',
          'R',
        ].includes(name)
      )
        return
      event.preventDefault()
      if (!event.repeat) this.keyEdges.add(name)
      this.heldKeys.add(name)
    }
    this.onKeyUp = (event) => this.heldKeys.delete(keyName(event))
    this.onBlur = () => {
      this.heldKeys.clear()
      this.keyEdges.clear()
    }
    this.onTouch = ({ key, down }) => {
      if (!down) {
        this.heldKeys.delete(key)
        return
      }
      if (this.mode !== 'playing') return
      this.keyEdges.add(key)
      this.heldKeys.add(key)
    }
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('blur', this.onBlur)
    this.game.events.on('ui:touch', this.onTouch)
  }

  handleAction(action) {
    if (typeof action === 'object' && action.type === 'select') {
      this.persist()
      this.scene.restart({ level: action.id, restart: action.restart === true })
      return
    }
    if (typeof action === 'object' && action.type === 'custom') {
      this.scene.restart({ custom: action.level })
      return
    }
    if (action === 'start' || action === 'new') {
      if (action === 'new') {
        if (this.customLevel) this.state.checkpoint = 0
        else this.state.selectLevel(this.level.id, true)
        this.elapsed = 0
        this.persist()
      }
      this.resetRun()
      this.mode = 'playing'
      this.physics.resume()
      this.time.paused = false
      this.say(this.level.message)
    } else if (action === 'pause' && this.mode === 'playing') {
      this.mode = 'paused'
      this.physics.pause()
      this.time.paused = true
    } else if (action === 'resume' && this.mode === 'paused') {
      this.mode = 'playing'
      this.physics.resume()
      this.time.paused = false
    } else if (action === 'retry' && ['playing', 'paused'].includes(this.mode)) {
      this.time.paused = false
      this.mode = 'playing'
      this.physics.resume()
      this.die('Checkpoint delivery complete.')
    }
    this.publish()
  }

  resetRun() {
    this.encounterTimers.forEach((timer) => timer.remove())
    this.encounterTimers = []
    this.shots.clear(true, true)
    this.bossShots.clear(true, true)
    this.enemyShots.clear(true, true)
    this.player
      .enableBody(true, this.state.checkpointX, (this.state.checkpointY ?? FLOOR) - 30, true, true)
      .setVelocity(0, 0)
      .setAngle(0)
    this.state.hearts = 10
    this.state.flaps = 2
    this.invulnerableUntil = this.time.now + 900
    this.ragdoll = null
    this.slam = false
    this.bridges.getChildren().forEach((bridge) => {
      bridge.enableBody(true, bridge.homeX, bridge.homeY, true, true)
      bridge.body.setAllowGravity(false)
      bridge.setVelocity(0).clearTint()
      bridge.triggered = false
    })
    this.legPlatforms.getChildren().forEach((plat) => {
      plat.setPosition(plat.getData('homeX'), plat.getData('homeY'))
      plat.body.reset(plat.getData('homeX'), plat.getData('homeY'))
      plat.body.setAllowGravity(false).setImmovable(true)
      plat.setData('triggered', false)
    })
    this.hazards.getChildren().forEach((hazard) => {
      if (hazard.getData('type') === 'drop') {
        hazard.enableBody(true, hazard.x, hazard.getData('startY'), true, true)
        hazard.body.setAllowGravity(false)
        hazard.setVelocity(0)
        hazard.setData('dropped', false)
      }
    })
    this.blocks.getChildren().forEach((block) => {
      block.enableBody(true, block.x, 150, true, true)
      block.body.setAllowGravity(false)
      block.setVelocity(0)
      block.setData('dropped', false)
    })
    this.bananas.getChildren().forEach((banana) => {
      banana.body.reset(banana.getData('homeX'), FLOOR - 30)
      banana.setData({ freeUntil: 0, nextHop: 0, cooldown: 0 })
    })
    for (const crumb of this.crumbs) {
      crumb.body.reset(crumb.homeX, FLOOR - 46)
      crumb.fled = false
    }
    for (const flag of this.fakeFlags) flag.setData('triggered', false)
    if (this.boss) {
      this.bossHealth = this.bossMaxHealth
      this.boss.setPosition(this.bossHomeX, FLOOR - 55).setAlpha(1)
      this.boss.enableBody(true, this.bossHomeX, FLOOR - 55, true, true)
    }
  }

  readControls() {
    const down = (name) => this.heldKeys.has(name)
    const pressed = (name) => this.keyEdges.has(name)
    const pad = this.input.gamepad?.gamepads.find((candidate) => candidate?.connected)
    const button = (i) => pad?.buttons[i]?.pressed === true
    const current = {
      jump: button(0),
      slam: button(1),
      shoot: button(2),
      pause: button(9),
    }
    const axis = pad?.axes[0]?.getValue() || 0
    const result = {
      move:
        (down('D') ||
        down('RIGHT') ||
        pressed('D') ||
        pressed('RIGHT') ||
        button(15) ||
        axis > 0.25
          ? 1
          : 0) -
        (down('A') ||
        down('LEFT') ||
        pressed('A') ||
        pressed('LEFT') ||
        button(14) ||
        axis < -0.25
          ? 1
          : 0),
      jump:
        pressed('SPACE') ||
        pressed('W') ||
        pressed('UP') ||
        (current.jump && !this.padPrevious.jump),
      slam: pressed('S') || pressed('DOWN') || (current.slam && !this.padPrevious.slam),
      shoot: down('X') || down('J') || pressed('X') || pressed('J') || current.shoot,
      pause: pressed('ESC') || pressed('P') || (current.pause && !this.padPrevious.pause),
      retry: pressed('R'),
      helmet: pressed('L'),
      controller: !!pad,
    }
    this.padPrevious = current
    this.keyEdges.clear()
    return result
  }

  update(_time, delta) {
    if (!this.player || document.activeElement?.matches('textarea,input')) return
    const input = this.readControls()
    this.controller = input.controller
    if (input.pause) {
      this.handleAction(this.mode === 'playing' ? 'pause' : 'resume')
      return
    }
    if (this.mode === 'paused' && input.jump) {
      this.handleAction('resume')
      return
    }
    if (this.mode === 'paused' && input.slam) {
      this.handleAction('retry')
      return
    }
    if (this.mode === 'menu' && input.jump) {
      this.handleAction(this.state.completed ? 'new' : 'start')
      return
    }
    if (this.mode === 'complete' && input.jump) {
      this.handleAction('new')
      return
    }
    if (this.mode !== 'playing') return
    this.elapsed += delta
    if (input.retry) {
      this.die('Voluntary pigeon reboot.')
      return
    }
    if (input.helmet && this.level.world === 'w7') {
      this.removeHelmet()
      return
    }
    const grounded = this.player.body.blocked.down || this.player.body.touching.down
    if (grounded) {
      this.state.land()
      this.slam = false
    }
    if (this.player.x < 12 && !this.ragdoll && this.time.now >= this.blastReady)
      this.blastBack()
    if (this.ragdoll) this.updateRagdoll(delta)
    const blasting = !!this.ragdoll
    // The explosion is stronger than the pigeon's normal top speed and drag.
    this.player.body.maxVelocity.x = blasting ? 900 : 310
    // Low drag in the air so the blast carries it; normal ground friction once it lands.
    this.player.body.setDragX(
      blasting && this.ragdoll.phase === 'fly' && !this.player.body.blocked.down
        ? 200
        : this.level.friction
    )
    if (input.move && !blasting) this.facing = input.move
    const target = input.move * (this.slam ? 100 : 265)
    if (!blasting) {
      if (this.level.friction < 100)
        this.player.setVelocityX(
          Phaser.Math.Linear(this.player.body.velocity.x, target, 0.055)
        )
      else this.player.setVelocityX(target)
    }
    this.player.setFlipX(this.facing < 0)
    if (input.jump && !this.slam && !blasting) {
      if (grounded) this.player.setVelocityY(-430)
      else if (this.state.flap()) this.player.setVelocityY(-380)
    }
    if (input.slam && !grounded && !blasting) {
      this.slam = true
      this.player.setVelocityY(900)
    }
    if (input.shoot && !blasting && this.time.now >= this.shotReady) this.shoot()
    // A blasted pigeon is a limp ragdoll: it tumbles, wings flailing, then lies flat.
    const ragdoll = this.ragdoll
    this.player
      .setTexture(
        ragdoll
          ? this.pigeonKey(ragdoll.phase === 'fly' && Math.floor(this.time.now / 90) % 2 === 0)
          : this.pigeonKey(!grounded && !this.slam)
      )
      .setAngle(ragdoll ? ragdoll.angle : this.slam ? this.facing * 75 : 0)
    this.player.setAlpha(
      this.time.now < this.invulnerableUntil && Math.floor(this.time.now / 90) % 2
        ? 0.4
        : 1
    )
    this.updateEnemies()
    this.updateBananas()
    this.updateTraps(delta)
    this.updateJoke()
    if (this.boss) this.updateBoss()
    this.updateProgress(grounded)
    if (this.player.y > 610) {
      this.die(
        this.level.trap === 'fire'
          ? 'Confirmed: lava is not soup.'
          : 'Gravity remains undefeated.'
      )
      return
    }
    this.publish()
  }

  // Tougher enemies (the Venera 9 lander) take more than one kangaroo.
  damageEnemy(enemy, label) {
    const hp = enemy.getData('hp') ?? 1
    if (hp > 1) {
      enemy.setData('hp', hp - 1)
      enemy.setTintFill(0xffffff)
      this.time.delayedCall(90, () => enemy.active && enemy.clearTint())
      this.pop(enemy.x, enemy.y, 'CLANG!')
      return
    }
    this.destroyEnemy(enemy, label)
  }

  // Removes an enemy. The Venera 10 twin lander splits into two mini robots first.
  destroyEnemy(enemy, label) {
    const { x, y } = enemy
    const bounds = {
      min: enemy.getData('min'),
      max: enemy.getData('max'),
      chaseMin: enemy.getData('chaseMin'),
      chaseMax: enemy.getData('chaseMax'),
    }
    const splits = enemy.getData('splits') === true
    enemy.destroy()
    this.pop(x, y, label)
    if (splits) this.time.delayedCall(1, () => this.spawnMinis(x, y, bounds))
  }

  spawnMinis(x, y, bounds) {
    for (const direction of [-1, 1]) {
      const mini = this.spawnEnemy(
        {
          x: x + direction * 12,
          ...bounds,
          key: 'venera',
          scale: 0.5,
          speed: 140,
          chaseSpeed: 175,
          hp: 1,
          behavior: 'walk',
        },
        y
      )
      mini.setVelocity(direction * 170, -280)
    }
    this.pop(x, y - 30, 'SPLIT!')
  }

  updateEnemies() {
    const now = this.time.now
    this.enemies.getChildren().forEach((enemy) => this.updateEnemy(enemy, now))
    this.enemyShots.getChildren().forEach((pulse) => {
      if (now > pulse.getData('expires')) pulse.destroy()
    })
    this.shots.getChildren().forEach((shot) => {
      if (this.boss?.active && Math.abs(shot.x - this.boss.x) < 180) this.hitBoss(shot)
      else if (this.time.now > shot.expires || shot.y > 650) shot.destroy()
    })
    this.bossShots.getChildren().forEach((shot) => {
      if (shot.x < -50 || shot.x > this.width + 50) shot.destroy()
    })
  }

  updateEnemy(enemy, now) {
    const behavior = enemy.getData('behavior')
    if (behavior === 'ambush' && enemy.getData('phase') === 'buried') {
      const dx = Math.abs(this.player.x - enemy.x)
      const dy = Math.abs(this.player.y - FLOOR)
      if (dx < 230 && dy < 220) this.erupt(enemy)
      return
    }
    if (behavior === 'shoot') this.radarFire(enemy, now)
    if (behavior === 'bomb') this.dropBomb(enemy, now)
    const chaseSpeed = enemy.getData('chaseSpeed')
    if (this.level.enemyChase && chaseSpeed > 0) {
      const dx = this.player.x - enemy.x
      const dy = this.player.y - enemy.y
      if (Math.abs(dx) < 520 && Math.abs(dy) < (behavior === 'float' ? 300 : 220)) {
        this.chaseEnemy(enemy, behavior, chaseSpeed, dx, now)
        if (now >= enemy.getData('alertAt')) this.pop(enemy.x, enemy.y - 24, '!')
        enemy.setData('alertAt', now + 2500)
        if (!this.chaseHint) {
          this.chaseHint = true
          this.say('The Venera robots have spotted you. Run, or shoot them.')
        }
        return
      }
      if (behavior === 'charge' && enemy.getData('phase') !== 'idle') {
        enemy.setData('phase', 'idle')
        enemy.clearTint()
      }
    }
    if (enemy.getData('hover')) {
      const wobble = behavior === 'strafe' ? 12 : behavior === 'bomb' ? 16 : 22
      const height = enemy.getData('hover') + Math.sin(now / 600 + enemy.getData('bob')) * wobble
      enemy.setVelocityY((height - enemy.y) * 2)
    }
    if (enemy.x < enemy.getData('min')) enemy.setData('direction', 1)
    if (enemy.x > enemy.getData('max')) enemy.setData('direction', -1)
    enemy
      .setVelocityX(enemy.getData('direction') * (enemy.getData('speed') || 85))
      .setFlipX(enemy.getData('direction') < 0)
  }

  // How each Venera type goes after the pigeon: plain walkers and hoppers, the parachute
  // floater, the leaper, and the charger that winds up before it dashes.
  chaseEnemy(enemy, behavior, speed, dx, now) {
    const direction = Math.sign(dx) || 1
    const atEdge = (way) =>
      (way < 0 && enemy.x <= enemy.getData('chaseMin')) ||
      (way > 0 && enemy.x >= enemy.getData('chaseMax'))
    const grounded = enemy.body.blocked.down || enemy.body.touching.down
    enemy.setFlipX(direction < 0)
    if (behavior === 'float') {
      const targetY = Phaser.Math.Clamp(this.player.y - 60, 140, FLOOR - 90)
      enemy.setVelocity(direction * speed, Phaser.Math.Clamp((targetY - enemy.y) * 2.2, -120, 120))
      return
    }
    if (behavior === 'leap') {
      if (grounded) {
        enemy.setVelocityX(0)
        if (!atEdge(direction) && now >= enemy.getData('nextHop')) {
          enemy.setVelocity(direction * 210, -520)
          enemy.setData('nextHop', now + 1300)
        }
      }
      return
    }
    if (behavior === 'charge') {
      const phase = enemy.getData('phase')
      if (phase === 'windup') {
        enemy.setVelocityX(0)
        if (now >= enemy.getData('phaseUntil')) {
          enemy.clearTint()
          enemy.setData({ phase: 'dash', phaseUntil: now + 650, dashDirection: direction })
        }
        return
      }
      if (phase === 'dash') {
        const way = enemy.getData('dashDirection')
        const stop = atEdge(way) || now >= enemy.getData('phaseUntil')
        enemy.setVelocityX(stop ? 0 : way * 400).setFlipX(way < 0)
        if (stop) enemy.setData({ phase: 'rest', phaseUntil: now + 1800 })
        return
      }
      if (
        grounded &&
        Math.abs(dx) < 420 &&
        (phase === 'idle' || now >= enemy.getData('phaseUntil'))
      ) {
        enemy.setTint(0xffa060)
        enemy.setVelocityX(0)
        enemy.setData({ phase: 'windup', phaseUntil: now + 450 })
        return
      }
    }
    enemy.setVelocityX(atEdge(direction) ? 0 : direction * speed)
    if (enemy.getData('hop') && grounded && now >= enemy.getData('nextHop')) {
      enemy.setVelocityY(-380)
      enemy.setData('nextHop', now + 900)
    }
  }

  // Venera 12 bursts out of the ground and chases the pigeon.
  erupt(enemy) {
    const x = enemy.x
    enemy.getData('mound')?.destroy()
    enemy.setData({ phase: 'active', speed: 90, min: x - 160, max: x + 160 })
    enemy.enableBody(true, x, FLOOR - 36, true, true)
    enemy.setVelocityY(-430)
    this.cameras.main.shake(160, 0.01)
    this.pop(x, FLOOR - 30, 'CLUNK!')
    for (let i = 0; i < 10; i++) {
      const dirt = this.add.rectangle(x, FLOOR - 4, 6, 6, i % 2 ? 0x6b4a1a : 0x8a6330).setDepth(20)
      const angle = -Math.PI * (0.12 + 0.76 * (i / 9))
      this.tweens.add({
        targets: dirt,
        x: x + Math.cos(angle) * (70 + (i % 3) * 25),
        y: FLOOR - 4 + Math.sin(angle) * (90 + (i % 4) * 20),
        alpha: 0,
        duration: 520,
        ease: 'Quad.easeOut',
        onComplete: () => dirt.destroy(),
      })
    }
    if (!this.ambushHint) {
      this.ambushHint = true
      this.say('Something was buried there. Soviet engineering.')
    }
  }

  // Vega 1 drops an acid bomb when the pigeon is underneath it.
  dropBomb(enemy, now) {
    const dx = this.player.x - enemy.x
    const dy = this.player.y - enemy.y
    if (Math.abs(dx) > 110 || dy < 60 || now < enemy.getData('shootAt')) return
    enemy.setData('shootAt', now + 1400)
    const bomb = this.enemyShots.create(enemy.x, enemy.y + 34, 'venera-bomb')
    bomb.body.setAllowGravity(true)
    bomb.setVelocityY(40)
    bomb.setData({
      bomb: true,
      expires: now + 4000,
      message: 'Vega balloon: one acid drop, delivered.',
    })
  }

  // Venera 15 keeps its distance and fires slow radar pulses at the pigeon.
  radarFire(enemy, now) {
    const dx = this.player.x - enemy.x
    const dy = this.player.y - enemy.y
    if (Math.abs(dx) > 620 || Math.abs(dy) > 150 || now < enemy.getData('shootAt')) return
    enemy.setData('shootAt', now + 1700)
    const direction = Math.sign(dx) || 1
    const pulse = this.enemyShots.create(enemy.x + direction * 30, enemy.y - 8, 'radar-pulse')
    pulse.setVelocityX(direction * 240)
    pulse.setData('expires', now + 2600)
    enemy.setFlipX(direction < 0)
  }

  updateTraps(delta) {
    const t = this.time.now / 1000
    this.hazards.getChildren().forEach((hazard) => {
      const type = hazard.getData('type')
      if (
        type === 'drop' &&
        this.player.x > hazard.getData('triggerX') &&
        !hazard.getData('dropped')
      ) {
        hazard.setData('dropped', true)
        hazard.body.setAllowGravity(true)
        this.say('The icicle was waiting for written permission.')
      }
      if (type === 'fire')
        hazard.body.reset(
          hazard.getData('homeX'),
          FLOOR - 65 - Math.abs(Math.sin(t * 2.3 + hazard.getData('phase'))) * 155
        )
      if (type === 'drift') {
        const phase = hazard.getData('phase')
        hazard.body.reset(
          hazard.getData('homeX') + Math.sin(t * 1.1 + phase) * 150,
          hazard.getData('homeY') + Math.sin(t * 1.9 + phase) * 45
        )
        hazard.setScale(1 + Math.sin(t * 3 + phase) * 0.07)
      }
      if (type === 'swarm')
        hazard.body.reset(
          hazard.getData('homeX') + Math.sin(t * 2 + hazard.getData('phase')) * 85,
          hazard.getData('homeY') + Math.cos(t * 2.5 + hazard.getData('phase')) * 55
        )
    })
    this.blocks.getChildren().forEach((block) => {
      if (this.player.x > block.getData('triggerX') && !block.getData('dropped')) {
        block.setData('dropped', true)
        block.body.setAllowGravity(true)
        this.say('Earth has deployed a house brick.')
      }
    })
    if (this.giants.length) {
      this.giantClock += delta / 800
      for (const giant of this.giants)
        giant.body.reset(
          giant.homeX + Math.sin(this.giantClock + giant.phaseOffset) * 75,
          giant.homeY
        )
    }
  }

  updateJoke() {
    for (const crumb of this.crumbs) {
      const dx = crumb.x - this.player.x
      const near = Math.abs(dx) < 240
      if (near && !crumb.fled) {
        crumb.fled = true
        this.say('Nice try. It saw you coming.')
      }
      if (!near) crumb.fled = false
      const target = Phaser.Math.Clamp(
        near ? crumb.homeX + Math.sign(dx || 1) * 230 : crumb.homeX,
        crumb.homeX - 230,
        crumb.homeX + 230
      )
      crumb.body.reset(Phaser.Math.Linear(crumb.x, target, 0.12), FLOOR - 46)
    }
  }

  updateProgress(grounded) {
    for (const checkpoint of this.checkpointFlags) {
      if (
        Math.abs(this.player.x - checkpoint.x) < 36 &&
        Math.abs(this.player.y - (checkpoint.base - 28)) < 60 &&
        grounded &&
        this.state.activateCheckpoint(checkpoint.index)
      ) {
        this.persist()
        this.say('Checkpoint! Ten hearts refilled. Suspicion unchanged.')
      }
      checkpoint.flag.setFillStyle(
        this.state.checkpointX >= checkpoint.x ? this.level.accent : 0x566475
      )
    }
    if (this.level.exitX && this.player.x > this.level.exitX - 20 && grounded)
      this.complete()
  }

  updateBoss() {
    if (!this.boss?.active) return
    const t = this.time.now / 1000
    this.boss.body.reset(
      this.bossHomeX + Math.sin(t * 0.9) * 230,
      FLOOR - 55 - Math.abs(Math.sin(t * 1.4)) * 55
    )
    if (this.time.now >= this.bossAttackReady) {
      this.bossAttackReady =
        this.time.now + Math.max(430, 1050 - (this.bossMaxHealth - this.bossHealth) * 20)
      const shot = this.bossShots.create(this.boss.x - 80, this.boss.y, 'boss-shot')
      const angle = Phaser.Math.Angle.Between(
        this.boss.x,
        this.boss.y,
        this.player.x,
        this.player.y
      )
      this.physics.velocityFromRotation(
        angle,
        250 + (this.bossMaxHealth - this.bossHealth) * 4,
        shot.body.velocity
      )
    }
  }

  shoot() {
    this.shotReady = this.time.now + 350
    const shot = this.shots.create(this.player.x + this.facing * 27, this.player.y, 'roo')
    shot
      .setVelocity(this.facing * 420, -140)
      .setBounce(0, 0.72)
      .setFlipX(this.facing < 0)
    shot.body.setSize(18, 23).setOffset(4, 3)
    shot.expires = this.time.now + (this.boss ? 6000 : 3500)
  }

  hitEnemy(enemy) {
    if (this.mode !== 'playing') return
    if (this.slam && this.player.body.velocity.y > 0 && this.player.y < enemy.y) {
      this.destroyEnemy(enemy, 'BONK!')
      this.player.setVelocityY(-260)
      this.slam = false
    } else
      this.hurt(
        false,
        this.level.enemyMessage ||
          (this.level.trap === 'swarm'
            ? 'Parasite attempted a hostile subscription.'
            : 'Ninja says: personal space!')
      )
  }

  // Walking off the left edge of the level sets off a big explosion that blows the
  // pigeon back onto the screen as a limp ragdoll. It costs no hearts.
  blastBack() {
    const now = this.time.now
    this.blastReady = now + 900
    this.invulnerableUntil = now + 2800
    this.ragdoll = { phase: 'fly', angle: 0, spin: 760, bounces: 0, minUntil: now + 450, endAt: now + 3500 }
    this.slam = false
    this.facing = 1
    this.state.flaps = 2
    this.player.setVelocity(520, -560)
    const x = Math.max(this.player.x, this.cameras.main.scrollX + 24)
    const y = this.player.y
    this.cameras.main.shake(380, 0.02)
    this.cameras.main.flash(220, 255, 230, 140)
    this.explosionAt(x, y)
    this.say('KABOOM! Please keep the pigeon on the planet.')
  }

  // Venus only: taking the helmet off in that atmosphere is fatal. The pigeon explodes, is
  // sent back to its checkpoint like any other death, and two Venera 4 robots turn up where
  // it went off to see what all the fuss was about.
  removeHelmet() {
    const { x, y } = this.player
    this.cameras.main.shake(380, 0.02)
    this.cameras.main.flash(220, 255, 230, 140)
    this.explosionAt(x, y)
    this.die('The helmet was load-bearing. Two Venera robots are investigating.')
    const spread = [-1, 1].map((direction) => ({
      x: Phaser.Math.Clamp(x + direction * 30, 60, this.width - 60),
      min: Math.max(60, x - 130),
      max: Math.min(this.width - 60, x + 130),
    }))
    veneraEnemies(spread, this.level.gaps, this.width, ['venera']).forEach((spec, index) => {
      const robot = this.spawnEnemy(spec, y - 10)
      robot.setVelocity((index ? 1 : -1) * 140, -260)
    })
    this.pop(x, y - 20, 'KABOOM!')
  }

  // Tumble through the air, bounce twice on landing, lie flat for a moment, then get up.
  updateRagdoll(delta) {
    const ragdoll = this.ragdoll
    const now = this.time.now
    if (ragdoll.phase === 'fly') {
      ragdoll.angle += (ragdoll.spin * delta) / 1000
      if (now >= ragdoll.endAt) {
        this.ragdoll = null
        return
      }
      // Real ground contact only: overlapping a banana or enemy also sets touching.down.
      if (!this.player.body.blocked.down || now < ragdoll.minUntil) return
      if (ragdoll.bounces < 2) {
        ragdoll.bounces += 1
        ragdoll.spin *= 0.55
        this.player.setVelocity(
          this.player.body.velocity.x * 0.55,
          ragdoll.bounces === 1 ? -280 : -150
        )
        this.cameras.main.shake(140, 0.008)
        this.pop(this.player.x, this.player.y - 10, 'THUD!')
        return
      }
      ragdoll.phase = 'lying'
      ragdoll.angle = 90
      ragdoll.getUpAt = now + 500
      this.player.setVelocityX(0)
      this.pop(this.player.x, this.player.y - 10, 'OOF!')
      return
    }
    if (now >= ragdoll.getUpAt) {
      this.ragdoll = null
      this.invulnerableUntil = now + 600
    }
  }

  explosionAt(x, y) {
    for (const [color, delay, scale] of [
      [0xffffff, 0, 6],
      [0xffc04d, 40, 9],
      [0xff6a2f, 90, 11],
      [0xb5251a, 150, 8],
    ]) {
      const ring = this.add.circle(x, y, 18, color, 0.9).setDepth(20).setScale(0.2)
      this.tweens.add({
        targets: ring,
        scale,
        alpha: 0,
        delay,
        duration: 480,
        ease: 'Cubic.easeOut',
        onComplete: () => ring.destroy(),
      })
    }
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2
      const distance = 110 + ((i * 53) % 150)
      const spark = this.add.image(x, y, 'fireball').setDepth(21).setScale(1.2)
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        scale: 0.2,
        alpha: 0,
        duration: 650,
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy(),
      })
    }
    this.pop(x + 70, y - 30, 'KABOOM!')
  }

  // Bananas are friendly: they bounce off the pigeon without costing any hearts.
  bounceBanana(banana) {
    if (this.mode !== 'playing' || this.time.now < banana.getData('cooldown')) return
    const direction = banana.x >= this.player.x ? 1 : -1
    banana.setData({
      cooldown: this.time.now + 300,
      freeUntil: this.time.now + 450,
      direction,
    })
    banana.setVelocity(direction * 300, -480)
    if (!this.bananaHint) {
      this.bananaHint = true
      this.say('A friendly Australian banana. Shoot it and watch it fly.')
    }
  }

  // A kangaroo shot sends a banana high into the air.
  launchBanana(shot, banana) {
    const push = Math.sign(shot.body.velocity.x) * 140
    shot.destroy()
    banana.setData({ freeUntil: this.time.now + 600, cooldown: this.time.now + 150 })
    banana.setVelocity(push, -980)
    this.pop(banana.x, banana.y, 'BOING!')
  }

  bananaHitsEnemy(banana, enemy) {
    if (!enemy.active) return
    this.destroyEnemy(enemy, 'BANANA!')
    this.say('Bananas work as well.')
  }

  updateBananas() {
    const now = this.time.now
    this.bananas.getChildren().forEach((banana) => {
      if (!banana.active) return
      if (banana.y > 600) {
        banana.body.reset(banana.getData('homeX'), FLOOR - 30)
        return
      }
      if (banana.x < banana.getData('min')) banana.setData('direction', 1)
      if (banana.x > banana.getData('max')) banana.setData('direction', -1)
      const grounded = banana.body.blocked.down || banana.body.touching.down
      if (now >= banana.getData('freeUntil')) {
        banana.setVelocityX(banana.getData('direction') * 90)
        if (grounded && now >= banana.getData('nextHop')) {
          banana.setVelocityY(-300)
          banana.setData('nextHop', now + 650 + (banana.getData('homeX') % 400))
        }
      }
      banana.setAngle(banana.body.velocity.x * 0.08)
      banana.setFlipX(banana.getData('direction') < 0)
    })
  }

  hitFakeFlag(flag) {
    if (flag.getData('triggered')) return
    flag.setData('triggered', true)
    this.pop(flag.x, flag.y - 20, 'FAKE FINISH!')
    this.say('Nice knees. The real ship is further on.')
  }

  hitBoss(shot) {
    shot.destroy()
    if (!this.boss.active) return
    this.bossHealth -= 1
    this.boss.setTintFill(0xffffff)
    this.time.delayedCall(70, () => this.boss?.active && this.boss.clearTint())
    this.pop(
      this.boss.x,
      this.boss.y,
      this.bossHealth ? `${this.bossHealth} PRAWN HP` : 'DE-PRAWNED!'
    )
    if (this.bossHealth <= 0) {
      this.boss.disableBody(true, true)
      this.bossShots.clear(true, true)
      this.time.delayedCall(500, () => this.complete())
    }
  }

  spookPlatform(plat) {
    if (plat.getData('triggered') || !this.player.body.touching.down) return
    plat.setData('triggered', true)
    this.say('The platform has grown legs and left.')
    const dir = this.player.x < plat.x ? 1 : -1
    this.encounterTimers.push(
      this.time.delayedCall(500, () => {
        if (!plat.active) return
        plat.body.setVelocityX(dir * 230)
      }),
      this.time.delayedCall(1350, () => plat.active && plat.body.setVelocityX(0))
    )
  }

  collapseBridge(bridge) {
    if (bridge.triggered || !this.player.body.touching.down) return
    bridge.triggered = true
    bridge.setTint(0xff876f)
    this.say('The bridge has entered early retirement.')
    this.encounterTimers.push(
      this.time.delayedCall(220, () => {
        if (!bridge.active) return
        bridge.body.setAllowGravity(true)
        bridge.setVelocityY(100)
        this.time.delayedCall(650, () => bridge.disableBody(true, true))
      })
    )
  }

  hurt(gigantic, message) {
    if (this.mode !== 'playing' || (!gigantic && this.time.now < this.invulnerableUntil))
      return
    if (this.state.hurt(gigantic)) {
      this.die(message)
      return
    }
    this.invulnerableUntil = this.time.now + 1050
    this.player.setVelocityY(-190)
    this.say(message)
  }

  die(message) {
    if (this.mode !== 'playing') return
    this.state.respawn()
    this.persist()
    this.resetRun()
    this.say(message)
  }

  complete() {
    this.state.completeCurrent()
    this.lastOutcome = this.customLevel
      ? 'custom'
      : this.level.finalBoss
        ? 'campaign'
        : this.level.isWorldFinale
          ? 'world'
          : 'level'
    this.persist()
    this.mode = 'complete'
    this.physics.pause()
    this.publish()
  }
  persist() {
    if (this.customLevel) return
    this.saveAvailable = writeSave(this.storage, this.state.snapshot())
  }
  say(message) {
    this.message = message
    this.messageUntil = this.time.now + 4700
  }
  pop(x, y, message) {
    const text = this.add
      .text(x, y - 35, message, { ...labelStyle, color: '#ffd477' })
      .setOrigin(0.5)
      .setDepth(12)
    this.tweens.add({
      targets: text,
      y: y - 75,
      alpha: 0,
      duration: 650,
      onComplete: () => text.destroy(),
    })
  }

  publish() {
    this.game.events.emit('ui:state', {
      mode: this.mode,
      id: this.level.id,
      name: this.level.name,
      number: this.level.number,
      worldName: this.level.worldName,
      intro: this.level.intro,
      hearts: this.state.hearts,
      flaps: this.state.flaps,
      deaths: this.state.deaths,
      checkpoint: this.state.checkpoint,
      checkpointMax: this.level.checkpoints.length - 1,
      completed: this.state.completed,
      completedLevels: this.state.completedLevels,
      unlockedLevels: this.state.unlockedLevels,
      outcome: this.lastOutcome,
      custom: !!this.customLevel,
      venus: this.level.world === 'w7',
      campaignLevel: this.state.currentLevel,
      nextLevelId: nextLevelId(this.level.id),
      seconds: Math.floor(this.elapsed / 1000),
      progress: this.level.finalBoss
        ? Math.round((1 - this.bossHealth / this.bossMaxHealth) * 100)
        : Math.min(100, Math.round((this.player.x / (this.level.exitX || this.width)) * 100)),
      bossHealth: this.bossHealth,
      bossMaxHealth: this.bossMaxHealth,
      message: this.time.now < this.messageUntil ? this.message : this.level.message,
      saveAvailable: this.saveAvailable,
      controller: this.controller,
    })
  }

  cleanUp() {
    this.game.events.off('ui:action', this.actionHandler)
    this.game.events.off('ui:touch', this.onTouch)
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('blur', this.onBlur)
    this.encounterTimers.forEach((timer) => timer.remove())
  }
}
