import Phaser from 'phaser'

import { GAME_BACKGROUND_COLOR, GAME_HEIGHT, GAME_WIDTH } from '../constants/gameConstants.js'
import BootScene from '../scenes/BootScene.js'
import HudScene from '../scenes/HudScene.js'
import MenuScene from '../scenes/MenuScene.js'
import PlayScene from '../scenes/PlayScene.js'

export const getGameConfig = (parent) => ({
  type: Phaser.AUTO,
  parent,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: GAME_BACKGROUND_COLOR,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  banner: false,
  scene: [BootScene, MenuScene, PlayScene, HudScene]
})
