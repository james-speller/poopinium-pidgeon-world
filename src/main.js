import './style.css'
import { LEVEL_BY_ID, WORLD_LIST } from './data/campaign.js'
import { createGame } from './game/createGame.js'

const { game, dispose } = createGame({ parentId: 'game-container' })
const get = (id) => document.getElementById(id)
const setText = (id, text) => {
  if (get(id).textContent !== text) get(id).textContent = text
}
const overlay = get('game-overlay')
const play = get('play-button')
const restart = get('restart-button')
const selector = get('demo-selector')
let currentMode = 'menu'
let overlayKey = ''
let mapKey = ''
let latestState = null

const action = (name) => game.events.emit('ui:action', name)
const focusGame = () => get('game-container').focus({ preventScroll: true })
const select = (id, restartLevel = false) => {
  action({ type: 'select', id, restart: restartLevel })
  focusGame()
}

play.addEventListener('click', () => {
  if (currentMode === 'paused') action('resume')
  else if (currentMode === 'complete' && latestState?.nextLevelId) select(latestState.nextLevelId)
  else if (currentMode === 'complete') action('new')
  else action('start')
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
window.addEventListener('blur', () => action('pause'))
document.addEventListener('visibilitychange', () => {
  if (document.hidden) action('pause')
})

function renderWorldMap(state) {
  selector.innerHTML = ''
  WORLD_LIST.forEach((world, worldIndex) => {
    const group = document.createElement('div')
    group.className = 'world-group'
    const heading = document.createElement('p')
    heading.className = 'world-heading'
    heading.innerHTML = `<span>${String(worldIndex + 1).padStart(2, '0')}</span> ${world.name}`
    group.appendChild(heading)
    const row = document.createElement('div')
    row.className = 'level-row'
    world.levels.forEach((level) => {
      const button = document.createElement('button')
      const unlocked = state.unlockedLevels.includes(level.id)
      const done = state.completedLevels.includes(level.id)
      button.type = 'button'
      button.className = 'level-pip'
      if (level.finalBoss) button.classList.add('boss')
      if (level.id === state.id) button.classList.add('active')
      if (done) button.classList.add('done')
      if (!unlocked) {
        button.classList.add('locked')
        button.disabled = true
        button.textContent = '🔒'
        button.setAttribute('aria-label', `${level.name} — locked`)
      } else {
        button.textContent = level.finalBoss ? 'B' : String(level.levelIndex + 1)
        button.setAttribute('aria-label', level.name)
        button.addEventListener('click', () => select(level.id))
      }
      row.appendChild(button)
    })
    group.appendChild(row)
    selector.appendChild(group)
  })
}

game.events.on('ui:state', (state) => {
  latestState = state
  document.title = `PidgeonWorld · ${state.name}`
  currentMode = state.mode
  setText('world-name', state.worldName.toUpperCase())
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
      ? `Autosave · ${state.completedLevels.length}/20 levels completed · This browser only`
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
  const nextMapKey = `${state.id}-${state.unlockedLevels.length}-${state.completedLevels.length}`
  if (nextMapKey !== mapKey) {
    mapKey = nextMapKey
    renderWorldMap(state)
  }
  overlay.hidden = state.mode === 'playing'
  const nextKey = `${state.mode}-${state.id}-${state.completed}-${state.completedLevels.length}`
  if (nextKey === overlayKey) return
  overlayKey = nextKey
  if (state.mode === 'paused') {
    setText('overlay-eyebrow', `${state.name.toUpperCase()} / PAUSED`)
    setText('overlay-title', 'Chaos can wait.')
    setText(
      'overlay-copy',
      'Resume this level or retry from its latest checkpoint with all ten hearts.'
    )
    play.textContent = 'Resume →'
    restart.textContent = 'Retry checkpoint'
    restart.hidden = false
    setText('overlay-note', 'Esc / Start / A: resume · B: retry checkpoint')
  } else if (state.mode === 'complete') {
    const next = state.nextLevelId ? LEVEL_BY_ID[state.nextLevelId] : null
    setText(
      'overlay-eyebrow',
      `${state.name.toUpperCase()} ${state.number} / ${
        state.outcome === 'campaign' ? 'RESCUE COMPLETE' : 'SURVIVED'
      }`
    )
    if (state.outcome === 'campaign') {
      setText('overlay-title', 'Another Australian Pigeon is free.')
      setText(
        'overlay-copy',
        `The prawn suit is de-shelled and your mate is rescued. Full campaign completed in ${state.completedLevels.length}/20 levels. Replay any world from the mission panel, or start the finale again.`
      )
      play.textContent = 'Replay the finale →'
    } else if (state.outcome === 'world') {
      setText('overlay-title', `${state.worldName} is cleared.`)
      setText(
        'overlay-copy',
        next
          ? `World complete. Board the spaceship for ${next.worldName}, or replay any unlocked level from the mission panel.`
          : 'World complete.'
      )
      play.textContent = next ? `Fly to ${next.worldName} →` : 'Replay this level →'
    } else {
      setText('overlay-title', 'One small flap for pigeonkind.')
      setText(
        'overlay-copy',
        next
          ? `Level completed in ${Math.floor(state.seconds / 60)}m ${state.seconds % 60}s. Continue to ${next.name}, or replay any unlocked level from the mission panel.`
          : `Level completed in ${Math.floor(state.seconds / 60)}m ${state.seconds % 60}s.`
      )
      play.textContent = next ? `Continue to ${next.name} →` : 'Replay this level →'
    }
    restart.textContent = 'Replay this level'
    restart.hidden = false
    setText(
      'overlay-note',
      `${state.completedLevels.length}/20 levels completed · Progress saved`
    )
  } else {
    setText('overlay-eyebrow', `${state.worldName.toUpperCase()} / LEVEL ${state.number}`)
    setText('overlay-title', state.name)
    setText('overlay-copy', state.intro)
    play.textContent = state.checkpoint > 0 ? 'Continue level →' : 'Launch level →'
    restart.textContent = 'Start level over'
    restart.hidden = state.checkpoint === 0
    setText('overlay-note', 'Choose any unlocked level on the right · One player · No easy mode')
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
      `PidgeonWorld campaign feedback (${latestState?.completedLevels.length || 0}/20 levels)\n${feedback.value}`
    )
    setText('feedback-status', 'Copied! Paste into our conversation.')
  } catch {
    feedback.focus()
    feedback.select()
    setText('feedback-status', 'Press Ctrl+C to copy the selected notes.')
  }
})

if (import.meta.hot) import.meta.hot.dispose(dispose)
