import Phaser from 'phaser'

import { getGameConfig } from './gameConfig.js'

let currentGame

export const createGame = ({ parentId = 'game-container' } = {}) => {
  if (currentGame) {
    return { game: currentGame, dispose: () => currentGame.destroy(true) }
  }

  currentGame = new Phaser.Game(getGameConfig(parentId))

  const dispose = () => {
    if (currentGame) {
      currentGame.destroy(true)
      currentGame = null
    }
  }

  return { game: currentGame, dispose }
}
