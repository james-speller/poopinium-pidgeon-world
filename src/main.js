import './style.css'
import { createGame } from './game/createGame.js'

const { dispose } = createGame({ parentId: 'game-container' })

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    dispose()
  })
}
