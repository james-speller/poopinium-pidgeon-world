import Phaser from 'phaser'

import BootScene from '../scenes/BootScene.js'
import PlayScene from '../scenes/PlayScene.js'

export const getGameConfig = (parent) => ({
  type: Phaser.AUTO,
  parent,
  width: 960,
  height: 540,
  backgroundColor: '#080e20',
  pixelArt: true,
  roundPixels: true,
  input: { gamepad: true },
  physics: { default: 'arcade', arcade: { gravity: { y: 1100 }, debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  banner: false,
  scene: [BootScene, PlayScene],
})
