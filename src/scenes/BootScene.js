import Phaser from 'phaser'

import { SOUNDS } from '../game/sounds.js'
import { createSprites } from '../game/sprites.js'

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }
  preload() {
    for (const [key, url] of Object.entries(SOUNDS)) this.load.audio(key, url)
  }
  create() {
    createSprites(this)
    this.scene.start('PlayScene')
  }
}
