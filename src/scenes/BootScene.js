import Phaser from 'phaser'

import { createSprites } from '../game/sprites.js'

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }
  create() {
    createSprites(this)
    this.scene.start('PlayScene')
  }
}
