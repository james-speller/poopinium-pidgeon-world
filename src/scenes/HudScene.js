import Phaser from 'phaser'

import { COLORS, GAME_WIDTH } from '../constants/gameConstants.js'

export default class HudScene extends Phaser.Scene {
  constructor() {
    super('HudScene')
  }

  init(data) {
    this.snapshot = data?.snapshot
  }

  create() {
    this.cameras.main.setBackgroundColor(0x000000, 0)

    this.panel = this.add.rectangle(0, 0, GAME_WIDTH, 90, COLORS.hud, 0.65)
    this.panel.setOrigin(0)

    this.levelText = this.add.text(20, 20, '', {
      fontSize: '22px',
      color: '#f8fafc'
    })
    this.scoreText = this.add.text(GAME_WIDTH / 2 - 40, 20, '', {
      fontSize: '22px',
      color: '#f8fafc'
    })
    this.tipText = this.add.text(20, 52, '', {
      fontSize: '18px',
      color: '#fef3c7'
    })
    this.targetText = this.add.text(GAME_WIDTH - 20, 20, '', {
      fontSize: '28px',
      color: '#fcd34d'
    })
    this.targetText.setOrigin(1, 0)

    this.game.events.on('state:update', this.updateHud, this)

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('state:update', this.updateHud, this)
    })

    if (this.snapshot) {
      this.updateHud(this.snapshot)
    }
  }

  updateHud = (snapshot = {}) => {
    this.levelText.setText(`Lesson ${snapshot.level || 1}: ${snapshot.label || ''}`)
    this.scoreText.setText(`Score ${snapshot.score || 0}  •  Lives ${snapshot.lives || 0}`)
    this.tipText.setText(snapshot.tip || 'Stay focused on the target numbers!')
    this.targetText.setText(`Target ${snapshot.target ?? '?'}`)
  }
}
