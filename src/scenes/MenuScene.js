import Phaser from 'phaser'

import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../constants/gameConstants.js'

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene')
  }

  init(data) {
    this.summary = data?.summary
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.sky)

    const title = this.add.text(GAME_WIDTH / 2, 140, 'PidgeonWorld', {
      fontSize: '58px',
      fontFamily: 'Space Grotesk, sans-serif',
      color: '#1e1b2e'
    })
    title.setOrigin(0.5)

    this.add.text(GAME_WIDTH / 2, 210, 'Collect the highlighted seeds. Dodge the hawks.', {
      fontSize: '24px',
      color: '#1f2933'
    }).setOrigin(0.5)

    if (this.summary) {
      this.add.text(GAME_WIDTH / 2, 260, this.summary, {
        fontSize: '20px',
        color: '#0f766e'
      }).setOrigin(0.5)
    }

    const button = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 140, 220, 64, 0xffc857, 1)
    button.setStrokeStyle(4, 0x1f2933)
    button.setInteractive({ useHandCursor: true })

    this.add.text(button.x, button.y, 'Start Lesson', {
      fontSize: '24px',
      color: '#1e1b2e'
    }).setOrigin(0.5)

    button.on('pointerup', () => {
      this.scene.start('PlayScene')
    })
  }
}
