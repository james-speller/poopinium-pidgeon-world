import './style.css'
import { createGame } from './game/createGame.js'

const { game, dispose } = createGame({ parentId: 'game-container' })
const get = (id) => document.getElementById(id)
const setText = (id, text) => {
  if (get(id).textContent !== text) get(id).textContent = text
}
const overlay = get('game-overlay')
const play = get('play-button')
const restart = get('restart-button')
let currentMode = 'menu'
let finished = false
let overlayKey = ''
let latestState = null

const action = (name) => game.events.emit('ui:action', name)
const focusGame = () => get('game-container').focus({ preventScroll: true })
play.addEventListener('click', () => {
  action(
    currentMode === 'paused'
      ? 'resume'
      : currentMode === 'complete' || finished
        ? 'new'
        : 'start'
  )
  focusGame()
})
restart.addEventListener('click', () => {
  action(currentMode === 'paused' ? 'retry' : 'new')
  focusGame()
})
get('pause-button').addEventListener('click', () => {
  action(currentMode === 'playing' ? 'pause' : 'resume')
  focusGame()
})
document
  .querySelectorAll('[data-demo]')
  .forEach((button) =>
    button.addEventListener('click', () =>
      action({ type: 'select', id: button.dataset.demo })
    )
  )
window.addEventListener('blur', () => action('pause'))
document.addEventListener('visibilitychange', () => {
  if (document.hidden) action('pause')
})

game.events.on('ui:state', (state) => {
  latestState = state
  document.title = `PidgeonWorld · ${state.name}`
  currentMode = state.mode
  finished = state.completed
  setText('world-name', state.name.toUpperCase())
  setText('world-number', state.number)
  setText('health', '♥ '.repeat(state.hearts) + '♡ '.repeat(10 - state.hearts))
  get('health').setAttribute('aria-label', `${state.hearts} of 10 hearts`)
  setText('flaps', `FLAPS ${state.flaps}/2`)
  setText('deaths', `RETRIES ${state.deaths}`)
  setText(
    'checkpoint',
    state.bossMaxHealth
      ? `PRAWN HP ${state.bossHealth}/${state.bossMaxHealth}`
      : `CP ${state.checkpoint}/${state.checkpointMax}`
  )
  get('progress-fill').style.width = `${state.progress}%`
  setText('message', state.message)
  setText(
    'save-status',
    state.saveAvailable
      ? `Autosave · ${state.completedDemos.length}/6 demos completed · This browser only`
      : 'Saving unavailable. You can still play.'
  )
  setText(
    'controller-status',
    state.controller
      ? 'Controller connected · Start = pause'
      : 'Controller: press a button to connect'
  )
  get('pause-button').disabled = !['playing', 'paused'].includes(state.mode)
  setText('pause-button', state.mode === 'paused' ? 'Resume (Esc)' : 'Pause (Esc)')
  document.querySelectorAll('[data-demo]').forEach((button) => {
    button.classList.toggle('active', button.dataset.demo === state.demo)
    button.classList.toggle('done', state.completedDemos.includes(button.dataset.demo))
  })
  overlay.hidden = state.mode === 'playing'
  const nextKey = `${state.mode}-${state.demo}-${state.completed}-${state.completedDemos.length}`
  if (nextKey === overlayKey) return
  overlayKey = nextKey
  if (state.mode === 'paused') {
    setText('overlay-eyebrow', `${state.name.toUpperCase()} / PAUSED`)
    setText('overlay-title', 'Chaos can wait.')
    setText(
      'overlay-copy',
      'Resume this demo or retry from its latest checkpoint with all ten hearts.'
    )
    play.textContent = 'Resume →'
    restart.textContent = 'Retry checkpoint'
    restart.hidden = false
    setText('overlay-note', 'Esc / Start / A: resume · B: retry checkpoint')
  } else if (state.mode === 'complete') {
    setText('overlay-eyebrow', `${state.name.toUpperCase()} ${state.number} / SURVIVED`)
    setText(
      'overlay-title',
      state.demo === 'prawn-boss'
        ? 'The prawn has been de-shelled.'
        : 'One small flap for pigeonkind.'
    )
    setText(
      'overlay-copy',
      `Demo completed in ${Math.floor(state.seconds / 60)}m ${state.seconds % 60}s. Choose another world from the mission panel, or replay this one.`
    )
    play.textContent = 'Replay this demo →'
    restart.hidden = true
    setText(
      'overlay-note',
      `${state.completedDemos.length}/6 demos completed · Progress saved`
    )
  } else {
    setText('overlay-eyebrow', `${state.name.toUpperCase()} / DEMO ${state.number}`)
    setText('overlay-title', state.name)
    setText('overlay-copy', state.intro)
    play.textContent = finished
      ? 'Replay this demo →'
      : state.checkpoint > 0
        ? 'Continue demo →'
        : 'Launch demo →'
    restart.textContent = 'Start demo over'
    restart.hidden = state.checkpoint === 0 || finished
    setText('overlay-note', 'Choose any world on the right · One player · No easy mode')
  }
})

const feedback = get('feedback')
try {
  feedback.value = localStorage.getItem('pidgeonworld-feedback-v2') || ''
} catch {
  /* Optional local notes. */
}
feedback.addEventListener('focus', () => action('pause'))
feedback.addEventListener('input', () => {
  try {
    localStorage.setItem('pidgeonworld-feedback-v2', feedback.value)
    setText('feedback-status', 'Saved here. Nothing sent online.')
  } catch {
    setText('feedback-status', 'Storage unavailable—copy your notes before leaving.')
  }
})
get('copy-feedback').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(
      `PidgeonWorld six-demo feedback (${latestState?.completedDemos.length || 0}/6 complete)\n${feedback.value}`
    )
    setText('feedback-status', 'Copied! Paste into our conversation.')
  } catch {
    feedback.focus()
    feedback.select()
    setText('feedback-status', 'Press Ctrl+C to copy the selected notes.')
  }
})

if (import.meta.hot) import.meta.hot.dispose(dispose)
