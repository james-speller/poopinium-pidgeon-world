import Phaser from 'phaser'

import { DEFAULT_DEMO, LEVEL_BY_ID } from '../data/demoLevels.js'
import {
  AdventureState,
  CHECKPOINTS,
  readSave,
  writeSave,
} from '../state/AdventureState.js'

const FLOOR = 480
const LEVEL_WIDTH = 2800
const BOSS_WIDTH = 1900
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
    this.requestedDemo = data.demo
    this.restartRequested = data.restart === true
  }

  create() {
    try {
      this.storage = window.localStorage
    } catch {
      this.storage = null
    }
    const loaded = readSave(this.storage)
    this.state = new AdventureState(loaded.save)
    this.state.selectDemo(
      this.requestedDemo || this.state.selectedDemo || DEFAULT_DEMO,
      this.restartRequested
    )
    this.level = LEVEL_BY_ID[this.state.selectedDemo]
    this.width = this.level.boss ? BOSS_WIDTH : LEVEL_WIDTH
    this.saveAvailable = loaded.available
    this.mode = 'menu'
    this.elapsed = 0
    this.facing = 1
    this.shotReady = 0
    this.invulnerableUntil = 0
    this.slam = false
    this.lastGrounded = false
    this.padPrevious = {}
    this.message = this.level.message
    this.messageUntil = 0
    this.encounterTimers = []
    this.bossHealth = this.level.boss ? 12 : 0
    this.bossMaxHealth = this.bossHealth
    this.bossAttackReady = 0

    this.physics.world.gravity.y = this.level.gravity
    this.physics.world.setBounds(0, -400, this.width, 1200)
    this.cameras.main.setBounds(0, 0, this.width, 540)
    this.drawBackground()
    this.platforms = this.physics.add.staticGroup()
    this.bridges = this.physics.add.group({ allowGravity: false, immovable: true })
    this.enemies = this.physics.add.group()
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
    if (this.level.id === 'actually-earth') {
      for (let i = 0; i < 8; i++) {
        far
          .fillStyle(0xffffff, 0.75)
          .fillEllipse(100 + i * 240, 90 + (i % 3) * 45, 110, 30)
      }
    } else {
      for (let i = 0; i < 100; i++)
        far
          .fillStyle(i % 4 ? 0xffffff : this.level.accent, 0.65)
          .fillRect((i * 137 + 19) % 1450, (i * 83 + 11) % 390, i % 5 ? 2 : 3, 2)
    }
    far.fillStyle(this.level.sun, 0.15).fillCircle(790, 130, 68)
    far.fillStyle(this.level.sun, 1).fillCircle(790, 130, 45)
    const hills = this.add.graphics().setScrollFactor(0.35)
    for (let i = 0; i < 14; i++) {
      hills
        .fillStyle(this.level.soil, 0.8)
        .fillRect(i * 170, 365 - (i % 3) * 25, 185, 180)
      if (this.level.trap === 'swarm')
        hills.fillStyle(this.level.accent, 0.25).fillCircle(i * 170 + 60, 350, 34)
      if (this.level.trap === 'fire')
        hills
          .fillStyle(0xff873d, 0.35)
          .fillTriangle(i * 170, 410, i * 170 + 80, 300, i * 170 + 160, 410)
    }
  }

  addGround(x, width, y = FLOOR, height = 100) {
    const ground = this.add.rectangle(x, y, width, height, this.level.soil).setOrigin(0)
    this.add.rectangle(x, y, width, 10, this.level.ground).setOrigin(0)
    this.physics.add.existing(ground, true)
    this.platforms.add(ground)
  }

  addPlatform(x, y, width) {
    const platform = this.add.rectangle(x, y, width, 22, this.level.ground)
    platform.setStrokeStyle(4, this.level.accent)
    this.physics.add.existing(platform, true)
    this.platforms.add(platform)
  }

  sign(x, y, text) {
    this.add.rectangle(x, y + 34, 5, 48, this.level.soil)
    this.add.text(x, y, text, labelStyle).setOrigin(0.5)
  }

  buildLevel() {
    if (this.level.boss) {
      this.buildBossArena()
      return
    }
    let cursor = 0
    for (const [start, end] of this.level.gaps) {
      this.addGround(cursor, start - cursor)
      cursor = end
    }
    this.addGround(cursor, this.width - cursor)
    this.addPlatform(430, 385, 150)
    this.addPlatform(620, 315, 120)
    this.addPlatform(1320, 365, 150)
    this.addPlatform(1470, 290, 110)
    this.addPlatform(2170, 355, 170)
    this.sign(190, 395, `${this.level.name.toUpperCase()}\n${this.level.short}`)
    this.sign(1380, 410, this.trapSign())
    this.sign(2380, 390, 'SPACESHIP THIS WAY\nProbably.')

    this.checkpointFlags = CHECKPOINTS.slice(1).map((x, index) => {
      this.add.rectangle(x, FLOOR - 38, 4, 76, 0xe6f1e7)
      const flag = this.add.rectangle(x + 20, FLOOR - 65, 38, 22, this.level.accent)
      this.add.text(x - 9, FLOOR - 98, `CP ${index + 1}`, {
        ...labelStyle,
        fontSize: '11px',
      })
      return { x, flag }
    })
    this.buildThemeTrap()
    this.spawnRegularEnemies()
    if (this.level.giant) {
      this.giant = this.physics.add
        .sprite(2240, FLOOR - 44, 'giant')
        .setTint(this.level.giantTint)
        .setImmovable(true)
      this.giant.body.setAllowGravity(false).setSize(115, 74).setOffset(5, 8)
      this.add.text(2160, 330, 'GIGANTIC = ONE HIT', { ...labelStyle, color: '#ffb6bf' })
    }
    this.ship = this.add.image(this.width - 125, FLOOR - 38, 'ship').setScale(1.15)
    this.add.text(this.width - 210, 350, 'DEMO EXIT\nBoard spaceship', labelStyle)
  }

  trapSign() {
    return {
      bridge: 'ABSOLUTELY SAFE BRIDGE',
      icicles: 'ICICLE-FREE ZONE',
      fire: 'LAVA: LOCALLY SOURCED',
      swarm: 'PARASITE QUIET AREA',
      earth: 'NORMAL EARTH LAWN',
    }[this.level.trap]
  }

  buildThemeTrap() {
    if (this.level.trap === 'bridge') {
      for (let x = 760; x < 1050; x += 48) {
        const bridge = this.bridges.create(x, FLOOR + 8, 'bridge')
        bridge.homeX = x
        bridge.homeY = FLOOR + 8
      }
    }
    if (this.level.trap === 'icicles') {
      for (const x of [700, 1320, 1480, 1700, 2300]) {
        const ice = this.hazards.create(x, 85, 'icicle')
        ice.setData({ type: 'drop', startY: 85, triggerX: x - 170 })
      }
    }
    if (this.level.trap === 'fire') {
      for (const [x, phase] of [
        [820, 0],
        [1680, 1.5],
        [2320, 3],
      ]) {
        const fire = this.hazards.create(x, FLOOR - 16, 'fireball')
        fire.setData({ type: 'fire', homeX: x, phase })
      }
    }
    if (this.level.trap === 'swarm') {
      for (let i = 0; i < 11; i++) {
        const bug = this.hazards.create(620 + i * 170, 230 + (i % 3) * 55, 'parasite')
        bug.setData({ type: 'swarm', homeX: bug.x, homeY: bug.y, phase: i * 0.7 })
      }
    }
    if (this.level.trap === 'earth') {
      for (const x of [700, 1420, 1680, 2320]) {
        const block = this.blocks.create(x, 150, 'block')
        block.setTint(0x9b7653)
        block.setData({ triggerX: x - 150, dropped: false })
      }
    }
  }

  spawnRegularEnemies() {
    for (const [x, min, max] of [
      [520, 350, 680],
      [1250, 1170, 1450],
      [2040, 1980, 2150],
      [2470, 2410, 2580],
    ]) {
      if (this.level.gaps.some(([a, b]) => x > a && x < b)) continue
      const enemy = this.enemies
        .create(x, FLOOR - 20, this.level.trap === 'swarm' ? 'parasite' : 'ninja')
        .setScale(this.level.trap === 'swarm' ? 1.5 : 1.6)
        .setTint(this.level.enemyTint)
      enemy.setData({ min, max, direction: -1 }).setVelocityX(-85)
    }
  }

  buildBossArena() {
    this.addGround(0, this.width)
    this.addPlatform(430, 360, 160)
    this.addPlatform(720, 290, 130)
    this.addPlatform(1040, 360, 160)
    this.sign(220, 390, 'FINAL DEMO\nPRAWN SUIT DIPLOMACY')
    this.sign(780, 420, '12 KANGAROO HITS\nNo sauce provided')
    this.boss = this.physics.add
      .sprite(1450, FLOOR - 55, 'prawn-boss')
      .setScale(1.55)
      .setImmovable(true)
    this.boss.body.setAllowGravity(false).setSize(125, 85).setOffset(8, 8)
    this.add.text(1320, 285, 'THE JAPANESE EMPIRE\nIN A BIG PRAWN SUIT', {
      ...labelStyle,
      color: '#ffb4a9',
    })
    this.checkpointFlags = []
  }

  spawnPlayer() {
    this.player = this.physics.add
      .sprite(this.level.boss ? 120 : this.state.checkpoint, FLOOR - 28, 'pigeon')
      .setScale(1.35)
      .setDepth(8)
    this.player.body.setSize(22, 26).setOffset(5, 5)
    this.player.setMaxVelocity(310, 1000).setDragX(this.level.friction)
  }

  registerPhysics() {
    this.physics.add.collider(this.player, this.platforms)
    this.physics.add.collider(this.player, this.bridges, (_player, bridge) =>
      this.collapseBridge(bridge)
    )
    this.physics.add.collider(this.enemies, this.platforms)
    this.physics.add.collider(this.blocks, this.platforms)
    this.physics.add.collider(this.shots, this.platforms, (shot) => {
      if (shot.body.blocked.left || shot.body.blocked.right) shot.destroy()
    })
    this.physics.add.collider(this.shots, this.bridges)
    this.physics.add.overlap(this.player, this.enemies, (_player, enemy) =>
      this.hitEnemy(enemy)
    )
    this.physics.add.overlap(this.player, this.hazards, () =>
      this.hurt(false, this.hazardMessage())
    )
    this.physics.add.overlap(this.player, this.blocks, () =>
      this.hurt(false, 'The scenery has become interactive.')
    )
    this.physics.add.overlap(this.player, this.bossShots, () =>
      this.hurt(false, 'Prawn-powered projectile. Extremely shellfish.')
    )
    this.physics.add.overlap(this.shots, this.enemies, (shot, enemy) => {
      shot.destroy()
      enemy.destroy()
      this.pop(enemy.x, enemy.y, "ROO'D!")
    })
    if (this.giant)
      this.physics.add.overlap(this.player, this.giant, () =>
        this.hurt(true, 'Gigantic means gigantic. Ten hearts were not consulted.')
      )
    if (this.boss) {
      this.physics.add.overlap(this.player, this.boss, () =>
        this.hurt(true, 'Direct contact with prawn technology is discouraged.')
      )
      this.physics.add.overlap(this.shots, this.boss, (shot) => this.hitBoss(shot))
    }
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
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('blur', this.onBlur)
  }

  handleAction(action) {
    if (typeof action === 'object' && action.type === 'select') {
      this.persist()
      this.scene.restart({ demo: action.id, restart: action.restart === true })
      return
    }
    if (action === 'start' || action === 'new') {
      if (action === 'new') {
        this.state.selectDemo(this.level.id, true)
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
    this.player
      .enableBody(
        true,
        this.level.boss ? 120 : this.state.checkpoint,
        FLOOR - 30,
        true,
        true
      )
      .setVelocity(0, 0)
      .setAngle(0)
    this.state.hearts = 10
    this.state.flaps = 2
    this.invulnerableUntil = this.time.now + 900
    this.slam = false
    this.bridges.getChildren().forEach((bridge) => {
      bridge.enableBody(true, bridge.homeX, bridge.homeY, true, true)
      bridge.body.setAllowGravity(false)
      bridge.setVelocity(0).clearTint()
      bridge.triggered = false
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
    if (this.level.boss) {
      this.bossHealth = this.bossMaxHealth
      this.boss.setPosition(1450, FLOOR - 55).setAlpha(1)
      this.boss.enableBody(true, 1450, FLOOR - 55, true, true)
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
    const grounded = this.player.body.blocked.down || this.player.body.touching.down
    if (grounded) {
      this.state.land()
      this.slam = false
    }
    if (input.move) this.facing = input.move
    const target = input.move * (this.slam ? 100 : 265)
    if (this.level.friction < 100)
      this.player.setVelocityX(
        Phaser.Math.Linear(this.player.body.velocity.x, target, 0.055)
      )
    else this.player.setVelocityX(target)
    this.player.setFlipX(this.facing < 0)
    if (input.jump && !this.slam) {
      if (grounded) this.player.setVelocityY(-430)
      else if (this.state.flap()) this.player.setVelocityY(-380)
    }
    if (input.slam && !grounded) {
      this.slam = true
      this.player.setVelocityY(900)
    }
    if (input.shoot && this.time.now >= this.shotReady) this.shoot()
    this.player
      .setTexture(!grounded && !this.slam ? 'pigeon-flap' : 'pigeon')
      .setAngle(this.slam ? this.facing * 75 : 0)
    this.player.setAlpha(
      this.time.now < this.invulnerableUntil && Math.floor(this.time.now / 90) % 2
        ? 0.4
        : 1
    )
    this.updateEnemies()
    this.updateTraps(delta)
    if (this.level.boss) this.updateBoss(delta)
    else this.updateProgress(grounded)
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

  updateEnemies() {
    this.enemies.getChildren().forEach((enemy) => {
      if (enemy.x < enemy.getData('min')) enemy.setData('direction', 1)
      if (enemy.x > enemy.getData('max')) enemy.setData('direction', -1)
      enemy
        .setVelocityX(enemy.getData('direction') * 85)
        .setFlipX(enemy.getData('direction') < 0)
    })
    this.shots.getChildren().forEach((shot) => {
      if (this.boss?.active && Math.abs(shot.x - this.boss.x) < 180) this.hitBoss(shot)
      else if (this.time.now > shot.expires || shot.y > 650) shot.destroy()
    })
    this.bossShots.getChildren().forEach((shot) => {
      if (shot.x < -50 || shot.x > this.width + 50) shot.destroy()
    })
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
    if (this.giant) {
      this.giantPhase = (this.giantPhase || 0) + delta / 800
      this.giant.body.reset(2240 + Math.sin(this.giantPhase) * 75, FLOOR - 44)
    }
  }

  updateProgress(grounded) {
    for (const checkpoint of this.checkpointFlags) {
      if (
        Math.abs(this.player.x - checkpoint.x) < 36 &&
        grounded &&
        this.state.activateCheckpoint(checkpoint.x)
      ) {
        this.persist()
        this.say('Checkpoint! Ten hearts refilled. Suspicion unchanged.')
      }
      checkpoint.flag.setFillStyle(
        this.state.checkpoint >= checkpoint.x ? this.level.accent : 0x566475
      )
    }
    if (this.player.x > this.width - 210 && grounded) this.complete()
  }

  updateBoss() {
    if (!this.boss?.active) return
    const t = this.time.now / 1000
    this.boss.body.reset(
      1430 + Math.sin(t * 0.9) * 230,
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
    shot.expires = this.time.now + (this.level.boss ? 6000 : 3500)
  }

  hitEnemy(enemy) {
    if (this.mode !== 'playing') return
    if (this.slam && this.player.body.velocity.y > 0 && this.player.y < enemy.y) {
      enemy.destroy()
      this.player.setVelocityY(-260)
      this.slam = false
      this.pop(enemy.x, enemy.y, 'BONK!')
    } else
      this.hurt(
        false,
        this.level.trap === 'swarm'
          ? 'Parasite attempted a hostile subscription.'
          : 'Ninja says: personal space!'
      )
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

  hazardMessage() {
    return (
      {
        icicles: 'Cold, sharp, and surprisingly punctual.',
        fire: 'Literal fire monster. Metaphors unavailable.',
        swarm: 'The swarm has voted to bite.',
        earth: 'Earth remains deceptively Earth-like.',
      }[this.level.trap] || 'A hazard happened.'
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
    this.state.completed = true
    this.persist()
    this.mode = 'complete'
    this.physics.pause()
    this.publish()
  }
  persist() {
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
      demo: this.level.id,
      name: this.level.name,
      number: this.level.number,
      intro: this.level.intro,
      hearts: this.state.hearts,
      flaps: this.state.flaps,
      deaths: this.state.deaths,
      checkpoint: this.level.boss ? 0 : CHECKPOINTS.indexOf(this.state.checkpoint),
      checkpointMax: this.level.boss ? 0 : 2,
      completed: this.state.completed,
      completedDemos: this.state.completedDemos,
      seconds: Math.floor(this.elapsed / 1000),
      progress: this.level.boss
        ? Math.round((1 - this.bossHealth / this.bossMaxHealth) * 100)
        : Math.min(100, Math.round((this.player.x / (this.width - 200)) * 100)),
      bossHealth: this.bossHealth,
      bossMaxHealth: this.bossMaxHealth,
      message: this.time.now < this.messageUntil ? this.message : this.level.message,
      saveAvailable: this.saveAvailable,
      controller: this.controller,
    })
  }

  cleanUp() {
    this.game.events.off('ui:action', this.actionHandler)
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('blur', this.onBlur)
    this.encounterTimers.forEach((timer) => timer.remove())
  }
}
