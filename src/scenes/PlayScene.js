import Phaser from 'phaser'

import { COLORS, GAME_HEIGHT, GAME_RULES, GAME_WIDTH } from '../constants/gameConstants.js'
import { GameState } from '../state/GameState.js'
import { chance, pickOne, randomInt } from '../utils/random.js'

export default class PlayScene extends Phaser.Scene {
  constructor() {
    super('PlayScene')
  }

  init() {
    this.state = new GameState()
    this.seedLabels = []
    this.dashReadyAt = 0
    this.musicEnabled = true
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.sky)
    this.drawBackdrop()
    this.createGroups()
    this.spawnPlayer()
    this.registerInput()
    this.registerColliders()
    this.startSpawners()

    if (this.scene.isActive('HudScene')) {
      this.scene.stop('HudScene')
    }
    this.scene.run('HudScene', { snapshot: this.state.snapshot() })
    this.broadcast()

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanUp, this)
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanUp, this)
  }

  update(_, delta) {
    if (!this.player) return

    const input = new Phaser.Math.Vector2(0, 0)
    if (this.cursors.left.isDown) input.x = -1
    if (this.cursors.right.isDown) input.x += 1
    if (this.cursors.up.isDown) input.y = -1
    if (this.cursors.down.isDown) input.y += 1

    if (input.length() > 0) {
      input.normalize()
      this.lastDirection = input.clone()
    }

    const speed = GAME_RULES.playerSpeed
    this.player.setVelocity(input.x * speed, input.y * speed)

    if (Phaser.Input.Keyboard.JustDown(this.dashKey)) {
      this.tryDash()
    }

    this.seedLabels = this.seedLabels.filter(({ sprite, text }) => {
      if (!sprite.active) {
        text.destroy()
        return false
      }
      text.setPosition(sprite.x - text.width / 2, sprite.y - 10)
      return true
    })
  }

  drawBackdrop() {
    const background = this.add.graphics()
    background.fillStyle(COLORS.sky, 1)
    background.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    background.fillStyle(COLORS.canopy, 0.8)
    background.fillRoundedRect(40, 60, GAME_WIDTH - 80, 140, 32)
    background.fillStyle(COLORS.ground, 1)
    background.fillRoundedRect(0, GAME_HEIGHT - 80, GAME_WIDTH, 140, {
      tl: 60,
      tr: 60,
      bl: 0,
      br: 0
    })
  }

  createGroups() {
    this.seedGroup = this.physics.add.group()
    this.hawkGroup = this.physics.add.group()
  }

  spawnPlayer() {
    this.player = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT - 120, 'pigeon')
    this.player.setCollideWorldBounds(true)
    this.lastDirection = new Phaser.Math.Vector2(0, -1)
  }

  registerInput() {
    this.cursors = this.input.keyboard.createCursorKeys()
    this.dashKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.musicKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M)

    this.musicKey.on('down', () => {
      this.musicEnabled = !this.musicEnabled
      this.broadcast({ message: this.musicEnabled ? 'Music cues on' : 'Music cues off' })
    })
  }

  registerColliders() {
    this.physics.add.overlap(this.player, this.seedGroup, this.handleSeedPickup, undefined, this)
    this.physics.add.overlap(this.player, this.hawkGroup, this.handleHawkHit, undefined, this)
  }

  startSpawners() {
    const lesson = this.state.lesson
    this.seedTimer = this.time.addEvent({
      delay: lesson.spawnDelay,
      callback: this.spawnSeed,
      callbackScope: this,
      loop: true
    })

    this.hawkTimer = this.time.addEvent({
      delay: lesson.hawkDelay,
      callback: this.spawnHawk,
      callbackScope: this,
      loop: true
    })
  }

  spawnSeed() {
    const lesson = this.state.lesson
    const x = randomInt(60, GAME_WIDTH - 60)
    const sprite = this.seedGroup.create(x, -20, 'seed')
    const fallingSpeed = randomInt(lesson.fallSpeed.min, lesson.fallSpeed.max)
    sprite.setVelocity(0, fallingSpeed)

    const isTarget = chance(0.6)
    const value = isTarget ? this.state.targetValue : pickOne(lesson.distractors)
    sprite.setData('value', value)
    sprite.setTint(isTarget ? 0xffffff : 0xf97316)

    const label = this.add.text(sprite.x, sprite.y, value, {
      fontSize: '18px',
      color: '#1f2933',
      fontStyle: isTarget ? 'bold' : 'normal'
    })
    sprite.on('destroy', () => label.destroy())
    this.seedLabels.push({ sprite, text: label })
  }

  spawnHawk() {
    const fromLeft = chance(0.5)
    const y = randomInt(120, GAME_HEIGHT - 200)
    const speed = randomInt(140, 210)
    const sprite = this.hawkGroup.create(fromLeft ? -40 : GAME_WIDTH + 40, y, 'hawk')
    sprite.setVelocity(fromLeft ? speed : -speed, randomInt(-20, 20))
  }

  handleSeedPickup = (_, seed) => {
    const value = seed.getData('value')
    const { x, y } = seed
    seed.destroy()

    const isTarget = value === this.state.targetValue
    const completed = isTarget && this.state.recordCorrect()
    let gameOver = false

    if (!isTarget) {
      gameOver = this.state.recordIncorrect()
    }

    this.makeSpark(x, y, value === this.state.targetValue)
    this.broadcast()

    if (!isTarget) {
      this.flashRed()
      if (gameOver) {
        this.endRound(false)
        return
      }
    }

    if (completed) {
      this.time.delayedCall(600, () => this.advanceLesson())
    }
  }

  handleHawkHit = (_, hawk) => {
    hawk.destroy()
    const gameOver = this.state.recordIncorrect()
    this.flashRed()
    this.broadcast({ message: 'Hawk collision!' })
    if (gameOver) {
      this.endRound(false)
    }
  }

  advanceLesson() {
    this.state.advanceLevel()
    this.restartSpawners()
    this.broadcast({ message: 'Lesson leveled up!' })
  }

  restartSpawners() {
    if (this.seedTimer) this.seedTimer.remove()
    if (this.hawkTimer) this.hawkTimer.remove()
    this.seedGroup.clear(true, true)
    this.hawkGroup.clear(true, true)
    this.seedLabels = []
    this.startSpawners()
  }

  flashRed() {
    this.cameras.main.flash(200, 200, 50, 50)
  }

  makeSpark(x, y, positive) {
    const spark = this.add.sprite(x, y, 'spark')
    spark.setTint(positive ? 0x84cc16 : 0xef4444)
    this.tweens.add({
      targets: spark,
      alpha: 0,
      scale: 1.6,
      duration: 350,
      onComplete: () => spark.destroy()
    })
  }

  tryDash() {
    if (this.time.now < this.dashReadyAt) return
    const direction = this.lastDirection || new Phaser.Math.Vector2(0, -1)
    const dashVelocity = direction.clone().normalize().scale(GAME_RULES.dashSpeed)
    this.player.setVelocity(dashVelocity.x, dashVelocity.y)
    this.dashReadyAt = this.time.now + GAME_RULES.dashCooldown
    this.broadcast({ message: 'Dash!' })
  }

  broadcast(extra) {
    this.game.events.emit('state:update', this.state.snapshot(extra))
  }

  endRound(won) {
    this.cleanUp()
    const message = won
      ? `Great flying! Score ${this.state.score}`
      : `Pixel needs a rest. Score ${this.state.score}`
    this.scene.stop('HudScene')
    this.scene.start('MenuScene', { summary: message })
  }

  cleanUp() {
    this.seedGroup.clear(true, true)
    this.hawkGroup.clear(true, true)
    this.seedLabels.forEach(({ text }) => text.destroy())
    this.seedLabels = []
    if (this.seedTimer) this.seedTimer.remove()
    if (this.hawkTimer) this.hawkTimer.remove()
  }

  shutdown() {
    this.cleanUp()
  }
}
