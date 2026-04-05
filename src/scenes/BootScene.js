import Phaser from 'phaser'

import { COLORS } from '../constants/gameConstants.js'

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }

  preload() {
    this.createTexture('pigeon', 48, 32, (graphics) => {
      graphics.fillStyle(COLORS.pigeon, 1)
      graphics.fillRoundedRect(4, 8, 40, 18, { tl: 10, tr: 16, bl: 12, br: 8 })
      graphics.fillStyle(0xffffff)
      graphics.fillCircle(36, 14, 4)
      graphics.fillStyle(0x000000)
      graphics.fillCircle(37, 14, 1.5)
      graphics.fillStyle(0xffc857)
      graphics.fillTriangle(42, 16, 48, 14, 42, 12)
      graphics.fillStyle(0x2f3e46)
      graphics.fillRect(8, 20, 6, 8)
    })

    this.createTexture('seed', 24, 24, (graphics) => {
      graphics.fillStyle(COLORS.seed, 1)
      graphics.fillEllipse(12, 12, 18, 12)
      graphics.lineStyle(2, 0x925025)
      graphics.beginPath()
      graphics.arc(12, 12, 8, -1, 1, false)
      graphics.strokePath()
    })

    this.createTexture('hawk', 64, 32, (graphics) => {
      graphics.fillStyle(COLORS.hawk, 1)
      graphics.fillTriangle(0, 16, 32, 0, 32, 32)
      graphics.fillTriangle(64, 16, 32, 0, 32, 32)
      graphics.fillStyle(0xfde047)
      graphics.fillTriangle(32, 14, 40, 16, 32, 18)
    })

    this.createTexture('spark', 16, 16, (graphics) => {
      graphics.fillStyle(0xffffff, 1)
      graphics.fillCircle(8, 8, 6)
    })
  }

  createTexture(key, width, height, drawer) {
    if (this.textures.exists(key)) return
    const gfx = this.make.graphics({ x: 0, y: 0, add: false })
    drawer(gfx)
    gfx.generateTexture(key, width, height)
    gfx.destroy()
  }

  create() {
    this.scene.start('MenuScene')
  }
}
