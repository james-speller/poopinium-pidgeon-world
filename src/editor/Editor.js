import { VENERA_TYPES, WORLD_THEMES } from '../data/campaign.js'
import {
  COLUMN,
  FLOOR_Y,
  LIMITS,
  createBlankLevel,
  decodeShareCode,
  duplicateLevel,
  encodeShareCode,
  isPitAt,
  loadCustomLevels,
  normalizeCustomLevel,
  platformUnder,
  saveCustomLevels,
  toRuntimeLevel,
  validateForPlay,
} from '../data/customLevels.js'

const WORLD_HEIGHT = 540
const VIEW_MIN_WIDTH = 960
const UNDO_LIMIT = 60

const TOOLS = [
  { id: 'hand', icon: '✋', label: 'Move view', help: 'Drag the level left and right.' },
  {
    id: 'erase',
    icon: '🧽',
    label: 'Erase',
    help: 'Tap something to remove it. Drag across pits and bridges to fill them in.',
  },
  {
    id: 'pit',
    icon: '🕳️',
    label: 'Pit',
    help: 'Tap or drag along the ground to dig a pit. Start on a pit to fill it in again.',
  },
  {
    id: 'bridge',
    icon: '🌉',
    label: 'Bridge',
    help: 'Paint a wobbly bridge across a pit. Each plank falls when stepped on.',
  },
  {
    id: 'platform',
    icon: '▬',
    label: 'Platform',
    help: 'Tap to place a platform. Tap higher or lower to choose its height.',
  },
  {
    id: 'longplatform',
    icon: '▬▬',
    label: 'Long platform',
    help: 'A wider platform. Tap higher or lower to choose its height.',
  },
  {
    id: 'legs',
    icon: '🦵',
    label: 'Leg platform',
    help: 'Grows legs and wanders off when you stand on it. Very rude.',
  },
  {
    id: 'ninja',
    icon: '🥷',
    label: 'Ninja',
    help: 'Tap the ground to place a ninja that patrols back and forth.',
  },
  {
    id: 'banana',
    icon: '🍌',
    label: 'Banana',
    help: 'A roaming Australian banana. Shoot it to send it flying. It flattens ninjas.',
  },
  { id: 'icicle', icon: '🧊', label: 'Icicle', help: 'Hangs up high and drops when you get near.' },
  { id: 'fire', icon: '🔥', label: 'Fire', help: 'A fireball that leaps up and down.' },
  {
    id: 'parasite',
    icon: '🦠',
    label: 'Parasite',
    help: 'A floating parasite. Tap at the height you want it.',
  },
  { id: 'block', icon: '🧱', label: 'Block', help: 'A heavy block that falls when you walk under it.' },
  {
    id: 'giant',
    icon: '👹',
    label: 'Giant',
    help: 'Touch it and it is instant game over. Only one per level.',
  },
  {
    id: 'checkpoint',
    icon: '🚩',
    label: 'Checkpoint',
    help: 'Checkpoints refill your hearts. Tap the ground, or tap just above a platform to put one on it. Tap one again to remove it.',
  },
  { id: 'start', icon: '🐦', label: 'Start', help: 'Where the bird begins.' },
  { id: 'exit', icon: '🚀', label: 'Exit', help: 'The rocket. Reach it to win.' },
  {
    id: 'fakeflag',
    icon: '🏴',
    label: 'Fake flag',
    help: 'A cheeky fake finish flag. One per level.',
  },
  { id: 'crumb', icon: '🍞', label: 'Crumb', help: 'A breadcrumb that runs away. One per level.' },
]
const TOOL_BY_ID = Object.fromEntries(TOOLS.map((tool) => [tool.id, tool]))
const PAINT_TOOLS = new Set(['pit', 'bridge', 'erase'])

const hex = (value) => `#${value.toString(16).padStart(6, '0')}`
const clamp = (value, low, high) => Math.min(high, Math.max(low, value))

export class Editor {
  constructor({ root, game, storage, onPlay }) {
    this.root = root
    this.game = game
    this.storage = storage
    this.onPlay = onPlay
    const loaded = loadCustomLevels(storage)
    this.levels = loaded.levels
    this.storageAvailable = loaded.available
    this.level = null
    this.tool = 'platform'
    this.scrollX = 0
    this.scale = 1
    this.viewW = VIEW_MIN_WIDTH
    this.offsetY = 0
    this.undoStack = []
    this.hitBoxes = []
    this.recording = true
    this.stroke = null
    this.hover = null
    this.toastTimer = null
    this.build()
  }

  get isOpen() {
    return !this.root.hidden
  }

  // ---------- building the interface ----------

  build() {
    this.root.className = 'editor'
    this.root.innerHTML = `
      <section class="ed-hub" data-view="hub">
        <header class="ed-hub-head">
          <h2>My levels</h2>
          <div class="ed-hub-actions">
            <button type="button" class="primary" data-act="new">+ New level</button>
            <button type="button" class="secondary" data-act="import">Import code</button>
            <button type="button" class="secondary" data-act="close">Close</button>
          </div>
        </header>
        <p class="ed-hub-empty">Nothing here yet. Tap "New level" to build your first level!</p>
        <ul class="ed-hub-list"></ul>
        <div class="ed-box" data-box="import" hidden>
          <p>Paste a level code someone shared with you:</p>
          <textarea rows="4" spellcheck="false"></textarea>
          <div class="ed-box-actions">
            <button type="button" class="primary" data-act="do-import">Add level</button>
            <button type="button" class="secondary" data-act="cancel-import">Cancel</button>
          </div>
        </div>
        <p class="ed-hub-note"></p>
      </section>
      <section class="ed-main" data-view="editor" hidden>
        <div class="ed-bar">
          <button type="button" class="ed-btn" data-act="menu">☰ My levels</button>
          <input class="ed-name" type="text" maxlength="24" aria-label="Level name" />
          <select class="ed-theme" aria-label="World look"></select>
          <span class="ed-width">
            <button type="button" class="ed-btn" data-act="narrower" aria-label="Shorter level">−</button>
            <span class="ed-width-label"></span>
            <button type="button" class="ed-btn" data-act="wider" aria-label="Longer level">+</button>
          </span>
          <button type="button" class="ed-btn" data-act="undo">↶ Undo</button>
          <button type="button" class="ed-btn" data-act="share">⇪ Share</button>
          <button type="button" class="ed-btn ed-test" data-act="test">▶ Test</button>
        </div>
        <div class="ed-stage"><canvas class="ed-canvas"></canvas><div class="ed-toast" hidden></div></div>
        <div class="ed-scroll">
          <button type="button" class="ed-btn" data-act="scroll-left" aria-label="Scroll left">‹</button>
          <input type="range" class="ed-slider" min="0" max="0" step="20" value="0" aria-label="Scroll the level" />
          <button type="button" class="ed-btn" data-act="scroll-right" aria-label="Scroll right">›</button>
        </div>
        <p class="ed-hint"></p>
        <div class="ed-palette"></div>
        <div class="ed-box ed-share" data-box="share" hidden>
          <p>Send this code to another device or person. They can paste it into "Import code".</p>
          <textarea rows="4" readonly spellcheck="false"></textarea>
          <div class="ed-box-actions">
            <button type="button" class="primary" data-act="copy">Copy code</button>
            <button type="button" class="secondary" data-act="close-share">Done</button>
          </div>
        </div>
      </section>`
    this.$ = (selector) => this.root.querySelector(selector)
    this.hub = this.$('[data-view="hub"]')
    this.main = this.$('[data-view="editor"]')
    this.canvas = this.$('.ed-canvas')
    this.ctx = this.canvas.getContext('2d')
    this.stage = this.$('.ed-stage')
    this.slider = this.$('.ed-slider')
    this.nameInput = this.$('.ed-name')
    this.themeSelect = this.$('.ed-theme')
    this.toastEl = this.$('.ed-toast')

    for (const world of WORLD_THEMES) {
      const option = document.createElement('option')
      option.value = world.id
      option.textContent = world.name
      this.themeSelect.appendChild(option)
    }
    const palette = this.$('.ed-palette')
    for (const tool of TOOLS) {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'ed-tool'
      button.dataset.tool = tool.id
      button.innerHTML = `<span class="ed-tool-icon">${tool.icon}</span><span>${tool.label}</span>`
      palette.appendChild(button)
    }

    this.root.addEventListener('click', (event) => this.onClick(event))
    palette.addEventListener('click', (event) => {
      const button = event.target.closest('[data-tool]')
      if (button) this.selectTool(button.dataset.tool)
    })
    this.slider.addEventListener('input', () => {
      this.scrollX = Number(this.slider.value)
      this.draw()
    })
    this.nameInput.addEventListener('input', () => {
      this.level.name = this.nameInput.value
    })
    this.nameInput.addEventListener('change', () => this.persist())
    this.themeSelect.addEventListener('change', () => {
      this.level.world = this.themeSelect.value
      this.persist()
      this.draw()
    })
    this.canvas.addEventListener('pointerdown', (event) => this.onPointerDown(event))
    this.canvas.addEventListener('pointermove', (event) => this.onPointerMove(event))
    this.canvas.addEventListener('pointerleave', () => {
      this.hover = null
      this.draw()
    })
    for (const type of ['pointerup', 'pointercancel']) {
      this.canvas.addEventListener(type, (event) => this.onPointerUp(event))
    }
    this.canvas.addEventListener(
      'wheel',
      (event) => {
        event.preventDefault()
        this.scrollTo(this.scrollX + (event.deltaX || event.deltaY))
      },
      { passive: false }
    )
    this.canvas.addEventListener('contextmenu', (event) => event.preventDefault())
    if (typeof ResizeObserver !== 'undefined')
      new ResizeObserver(() => this.layout()).observe(this.stage)
    window.addEventListener('resize', () => this.layout())
    this.selectTool(this.tool)
  }

  // ---------- opening and closing ----------

  open() {
    this.root.hidden = false
    document.body.classList.add('editor-open')
  }

  close() {
    this.root.hidden = true
    document.body.classList.remove('editor-open')
  }

  openHub() {
    this.open()
    this.hub.hidden = false
    this.main.hidden = true
    this.$('[data-box="import"]').hidden = true
    this.renderHub()
  }

  openEditor(level) {
    this.open()
    this.level = normalizeCustomLevel(JSON.parse(JSON.stringify(level)))
    this.undoStack = []
    this.scrollX = 0
    this.hub.hidden = true
    this.main.hidden = false
    this.$('[data-box="share"]').hidden = true
    this.nameInput.value = this.level.name
    this.themeSelect.value = this.level.world
    this.layout()
    this.refreshWidthLabel()
    this.toast('Pick a tool below, then tap the level to build.')
  }

  // Called when a level is being played and the player wants to get back to editing.
  openForRuntimeId(runtimeId) {
    const found = this.levels.find((level) => `custom-${level.id}` === runtimeId)
    if (found) this.openEditor(found)
    else this.openHub()
  }

  // ---------- the "My levels" list ----------

  renderHub() {
    const list = this.$('.ed-hub-list')
    list.innerHTML = ''
    this.$('.ed-hub-empty').hidden = this.levels.length > 0
    this.$('.ed-hub-note').textContent = this.storageAvailable
      ? 'Levels are saved in this browser only. Use Share to move a level to another device.'
      : 'Saving is blocked in this browser, so levels will be lost when you leave. Use Share to keep a copy.'
    const sorted = [...this.levels].sort((a, b) => b.updatedAt - a.updatedAt)
    for (const level of sorted) {
      const item = document.createElement('li')
      item.className = 'ed-card'
      item.dataset.id = level.id
      const theme = WORLD_THEMES.find((world) => world.id === level.world)
      const info = document.createElement('div')
      const title = document.createElement('strong')
      title.textContent = level.name
      const meta = document.createElement('small')
      const things =
        level.enemies.length +
        level.bananas.length +
        level.hazards.length +
        level.platforms.length +
        level.giants.length +
        level.crumbs.length +
        level.fakeFlags.length +
        level.checkpoints.length +
        level.ledgeCheckpoints.length
      meta.textContent = `${theme.name} · ${level.width}px long · ${things} things`
      info.append(title, meta)
      const actions = document.createElement('div')
      actions.className = 'ed-card-actions'
      for (const [act, label, cls] of [
        ['play', '▶ Play', 'primary'],
        ['edit', '✎ Edit', 'secondary'],
        ['duplicate', 'Copy', 'secondary'],
        ['delete', 'Delete', 'secondary'],
      ]) {
        const button = document.createElement('button')
        button.type = 'button'
        button.className = cls
        button.dataset.act = act
        button.textContent = label
        actions.appendChild(button)
      }
      item.append(info, actions)
      list.appendChild(item)
    }
  }

  onClick(event) {
    const button = event.target.closest('[data-act]')
    if (!button) return
    const act = button.dataset.act
    const card = button.closest('.ed-card')
    const cardLevel = card && this.levels.find((level) => level.id === card.dataset.id)
    switch (act) {
      case 'close':
        this.close()
        break
      case 'new': {
        const level = createBlankLevel(`My level ${this.levels.length + 1}`)
        this.levels.push(level)
        this.openEditor(level)
        this.persist()
        break
      }
      case 'import':
        this.$('[data-box="import"]').hidden = false
        this.$('[data-box="import"] textarea').value = ''
        break
      case 'cancel-import':
        this.$('[data-box="import"]').hidden = true
        break
      case 'do-import':
        this.importCode()
        break
      case 'play':
        if (cardLevel) this.play(cardLevel)
        break
      case 'edit':
        if (cardLevel) this.openEditor(cardLevel)
        break
      case 'duplicate':
        if (cardLevel && this.levels.length < LIMITS.maxLevels) {
          this.levels.push(duplicateLevel(cardLevel))
          this.save()
          this.renderHub()
        }
        break
      case 'delete':
        if (cardLevel && window.confirm(`Delete "${cardLevel.name}"? This cannot be undone.`)) {
          this.levels = this.levels.filter((level) => level.id !== cardLevel.id)
          this.save()
          this.renderHub()
        }
        break
      case 'menu':
        this.persist()
        this.openHub()
        break
      case 'narrower':
        this.setWidth(this.level.width - 800)
        break
      case 'wider':
        this.setWidth(this.level.width + 800)
        break
      case 'undo':
        this.undo()
        break
      case 'share':
        this.showShare()
        break
      case 'copy':
        this.copyShare()
        break
      case 'close-share':
        this.$('[data-box="share"]').hidden = true
        break
      case 'test':
        this.play(this.level)
        break
      case 'scroll-left':
        this.scrollTo(this.scrollX - this.viewW * 0.6)
        break
      case 'scroll-right':
        this.scrollTo(this.scrollX + this.viewW * 0.6)
        break
      default:
    }
  }

  importCode() {
    const textarea = this.$('[data-box="import"] textarea')
    const level = decodeShareCode(textarea.value)
    if (!level) {
      this.$('.ed-hub-note').textContent =
        'That code did not work. Make sure you copied all of it, starting with PWL1.'
      return
    }
    if (this.levels.length >= LIMITS.maxLevels) {
      this.$('.ed-hub-note').textContent = 'You have too many levels. Delete one first.'
      return
    }
    level.updatedAt = Date.now()
    this.levels.push(level)
    this.save()
    this.$('[data-box="import"]').hidden = true
    this.renderHub()
  }

  play(level) {
    const clean = normalizeCustomLevel(level)
    const issues = validateForPlay(clean)
    if (issues.length) {
      if (this.main.hidden) {
        this.openEditor(clean)
      }
      this.toast(issues[0], 4000)
      return
    }
    if (!this.main.hidden) this.persist()
    this.onPlay(toRuntimeLevel(clean))
  }

  showShare() {
    const box = this.$('[data-box="share"]')
    box.hidden = false
    const area = box.querySelector('textarea')
    area.value = encodeShareCode(normalizeCustomLevel(this.level))
    area.select()
  }

  async copyShare() {
    const area = this.$('[data-box="share"] textarea')
    try {
      await navigator.clipboard.writeText(area.value)
      this.toast('Code copied!')
    } catch {
      area.focus()
      area.select()
      this.toast('Press and hold the code to copy it.')
    }
  }

  // ---------- saving ----------

  save() {
    if (!saveCustomLevels(this.storage, this.levels)) {
      this.storageAvailable = false
      this.toast('Could not save in this browser. Use Share to keep a copy.', 4000)
    }
  }

  persist() {
    if (!this.level) return
    this.level.updatedAt = Date.now()
    const clean = normalizeCustomLevel(this.level)
    const index = this.levels.findIndex((level) => level.id === clean.id)
    if (index === -1) this.levels.push(clean)
    else this.levels[index] = clean
    this.save()
  }

  // ---------- tools ----------

  selectTool(id) {
    this.tool = id
    for (const button of this.root.querySelectorAll('.ed-tool'))
      button.classList.toggle('active', button.dataset.tool === id)
    this.$('.ed-hint').textContent = TOOL_BY_ID[id].help
    this.canvas.style.cursor = id === 'hand' ? 'grab' : 'crosshair'
    this.draw()
  }

  toast(message, ms = 2400) {
    this.toastEl.textContent = message
    this.toastEl.hidden = false
    clearTimeout(this.toastTimer)
    this.toastTimer = setTimeout(() => {
      this.toastEl.hidden = true
    }, ms)
  }

  undo() {
    const previous = this.undoStack.pop()
    if (!previous) {
      this.toast('Nothing to undo.')
      return
    }
    this.level = normalizeCustomLevel(JSON.parse(previous))
    this.nameInput.value = this.level.name
    this.themeSelect.value = this.level.world
    this.refreshWidthLabel()
    this.layout()
    this.persist()
  }

  // Called by every edit so it can be undone as one step.
  touch() {
    if (!this.stroke || this.stroke.changed) return
    this.stroke.changed = true
    this.undoStack.push(this.stroke.before)
    if (this.undoStack.length > UNDO_LIMIT) this.undoStack.shift()
  }

  setWidth(requested) {
    const width = clamp(requested, LIMITS.minWidth, LIMITS.maxWidth)
    if (width === this.level.width) {
      this.toast(width === LIMITS.minWidth ? 'That is the shortest level.' : 'That is the longest level.')
      return
    }
    this.undoStack.push(JSON.stringify(this.level))
    const level = this.level
    const limit = width - 40
    const columns = width / COLUMN
    this.level = normalizeCustomLevel({
      ...level,
      width,
      pits: level.pits.filter((column) => column < columns),
      platforms: level.platforms.filter((platform) => platform.x <= limit),
      enemies: level.enemies.filter((x) => x <= limit),
      bananas: level.bananas.filter((x) => x <= limit),
      hazards: level.hazards.filter((hazard) => hazard.x <= limit),
      checkpoints: level.checkpoints.filter((x) => x <= limit),
      ledgeCheckpoints: level.ledgeCheckpoints.filter((spot) => spot.x <= limit),
      giants: level.giants.filter((x) => x <= limit),
      fakeFlags: level.fakeFlags.filter((x) => x <= limit),
      crumbs: level.crumbs.filter((x) => x <= limit),
      start: Math.min(level.start, limit),
      exit: Math.min(level.exit, width - 190),
    })
    this.refreshWidthLabel()
    this.layout()
    this.persist()
  }

  refreshWidthLabel() {
    this.$('.ed-width-label').textContent = `${this.level.width}px`
  }

  // ---------- geometry ----------

  layout() {
    if (!this.level || this.root.hidden || this.main.hidden) return
    const rect = this.stage.getBoundingClientRect()
    if (rect.width < 10 || rect.height < 10) return
    const dpr = window.devicePixelRatio || 1
    this.canvas.width = Math.round(rect.width * dpr)
    this.canvas.height = Math.round(rect.height * dpr)
    this.canvas.style.width = `${rect.width}px`
    this.canvas.style.height = `${rect.height}px`
    this.dpr = dpr
    this.scale = Math.min(rect.width / VIEW_MIN_WIDTH, rect.height / WORLD_HEIGHT)
    this.viewW = rect.width / this.scale
    this.offsetY = (rect.height - WORLD_HEIGHT * this.scale) / 2
    this.scrollTo(this.scrollX)
  }

  scrollTo(value) {
    const max = Math.max(0, this.level.width - this.viewW)
    this.scrollX = clamp(Math.round(value / 20) * 20, 0, Math.ceil(max / 20) * 20)
    this.slider.max = String(Math.ceil(max / 20) * 20)
    this.slider.value = String(this.scrollX)
    this.draw()
  }

  toWorld(event) {
    const rect = this.canvas.getBoundingClientRect()
    return {
      x: (event.clientX - rect.left) / this.scale + this.scrollX,
      y: (event.clientY - rect.top - this.offsetY) / this.scale,
    }
  }

  // ---------- pointer handling ----------

  onPointerDown(event) {
    if (this.stroke) return
    event.preventDefault()
    try {
      this.canvas.setPointerCapture(event.pointerId)
    } catch {
      /* Capture is a convenience only. */
    }
    this.stroke = {
      id: event.pointerId,
      tool: this.tool,
      before: JSON.stringify(this.level),
      changed: false,
      mode: null,
      lastColumn: null,
      startClientX: event.clientX,
      startScroll: this.scrollX,
    }
    if (this.tool === 'hand') {
      this.canvas.style.cursor = 'grabbing'
      return
    }
    this.apply(this.toWorld(event), true)
  }

  onPointerMove(event) {
    const point = this.toWorld(event)
    this.hover = event.pointerType === 'mouse' ? point : null
    if (!this.stroke || event.pointerId !== this.stroke.id) {
      this.draw()
      return
    }
    if (this.stroke.tool === 'hand') {
      this.scrollTo(
        this.stroke.startScroll - (event.clientX - this.stroke.startClientX) / this.scale
      )
      return
    }
    if (PAINT_TOOLS.has(this.stroke.tool)) this.apply(point, false)
  }

  onPointerUp(event) {
    if (!this.stroke || event.pointerId !== this.stroke.id) return
    const changed = this.stroke.changed
    this.stroke = null
    if (this.tool === 'hand') this.canvas.style.cursor = 'grab'
    if (changed) this.persist()
    this.draw()
  }

  snapX(x) {
    return clamp(Math.round(x / 20) * 20, 40, this.level.width - 40)
  }

  snapY(y, low, high) {
    return clamp(Math.round(y / 20) * 20, low, high)
  }

  // The solid platform a checkpoint tap is aiming at: on the platform or in the air just
  // above it. Legged platforms are skipped because they wander off.
  platformTarget(point) {
    const hits = this.level.platforms.filter(
      (p) =>
        !p.legs &&
        point.x >= p.x - p.w / 2 - 10 &&
        point.x <= p.x + p.w / 2 + 10 &&
        point.y >= p.y - 70 &&
        point.y <= p.y + 20
    )
    hits.sort((a, b) => Math.abs(a.y - point.y) - Math.abs(b.y - point.y))
    return hits[0] || null
  }

  // Where a checkpoint tapped at `point` would land: on a platform if one is targeted.
  checkpointSpot(point) {
    const x = this.snapX(point.x)
    const platform = this.platformTarget(point)
    if (!platform) return { x, y: null }
    const half = platform.w / 2
    return { x: clamp(x, platform.x - half + 10, platform.x + half - 10), y: platform.y }
  }

  groundObjects() {
    const level = this.level
    return [
      { x: level.start, label: 'start' },
      { x: level.exit, label: 'exit' },
      ...level.checkpoints.map((x) => ({ x, label: 'checkpoint' })),
      ...level.enemies.map((x) => ({ x, label: 'ninja' })),
      ...level.bananas.map((x) => ({ x, label: 'banana' })),
      ...level.giants.map((x) => ({ x, label: 'giant' })),
      ...level.fakeFlags.map((x) => ({ x, label: 'fake flag' })),
      ...level.crumbs.map((x) => ({ x, label: 'crumb' })),
    ]
  }

  apply(point, first) {
    const level = this.level
    const columns = level.width / COLUMN
    const column = clamp(Math.floor(point.x / COLUMN), 0, columns - 1)
    const stroke = this.stroke
    const tool = stroke.tool

    if (tool === 'pit' || tool === 'bridge') {
      if (first) {
        const set = tool === 'pit' ? level.pits : level.bridges
        stroke.mode = set.includes(column) ? 'remove' : 'add'
      }
      const from = stroke.lastColumn ?? column
      const step = column >= from ? 1 : -1
      for (let c = from; c !== column + step; c += step) this.paintColumn(tool, c, stroke.mode)
      stroke.lastColumn = column
      this.draw()
      return
    }
    if (tool === 'erase') {
      this.eraseAt(point, column)
      this.draw()
      return
    }
    if (!first) return

    const x = this.snapX(point.x)
    const ledge = tool === 'checkpoint' ? this.checkpointSpot(point) : null
    const groundOnly = [
      'ninja',
      'banana',
      'giant',
      ...(ledge?.y == null ? ['checkpoint'] : []),
      'start',
      'exit',
      'fakeflag',
      'crumb',
    ]
    if (groundOnly.includes(tool) && isPitAt(level, x)) {
      this.toast('That spot is a pit. Put it on the ground.')
      return
    }
    switch (tool) {
      case 'platform':
      case 'longplatform':
      case 'legs': {
        const y = this.snapY(point.y, 140, 440)
        const w = tool === 'longplatform' ? 320 : 160
        if (level.platforms.some((p) => Math.abs(p.x - x) < 20 && Math.abs(p.y - y) < 20)) return
        if (level.platforms.length >= LIMITS.platforms) return this.toast('That is enough platforms!')
        this.touch()
        level.platforms.push({ x, y, w, legs: tool === 'legs' })
        break
      }
      case 'ninja':
        if (level.enemies.some((ex) => Math.abs(ex - x) < 40)) return
        if (level.enemies.length >= LIMITS.enemies) return this.toast('That is enough ninjas!')
        this.touch()
        level.enemies.push(x)
        break
      case 'banana':
        if (level.bananas.some((bx) => Math.abs(bx - x) < 40)) return
        if (level.bananas.length >= LIMITS.bananas) return this.toast('That is enough bananas!')
        this.touch()
        level.bananas.push(x)
        break
      case 'icicle':
      case 'fire':
      case 'block':
      case 'parasite': {
        const y = tool === 'parasite' ? this.snapY(point.y, 100, 430) : 0
        if (level.hazards.some((h) => h.type === tool && Math.abs(h.x - x) < 30 && Math.abs(h.y - y) < 30))
          return
        if (level.hazards.length >= LIMITS.hazards) return this.toast('That is enough hazards!')
        this.touch()
        level.hazards.push({ type: tool, x, y })
        break
      }
      case 'giant':
        return this.addSpot(level.giants, x, 120, LIMITS.giants, 'giants')
      case 'fakeflag':
        return this.addSpot(level.fakeFlags, x, 60, LIMITS.fakeFlags, 'fake flags')
      case 'crumb':
        return this.addSpot(level.crumbs, x, 60, LIMITS.crumbs, 'crumbs')
      case 'start':
        this.touch()
        level.start = x
        break
      case 'exit':
        this.touch()
        level.exit = x
        break
      case 'checkpoint': {
        const onPlatform = ledge.y != null
        const list = onPlatform ? level.ledgeCheckpoints : level.checkpoints
        const existing = onPlatform
          ? list.findIndex((spot) => spot.y === ledge.y && Math.abs(spot.x - ledge.x) < 40)
          : list.findIndex((cx) => Math.abs(cx - x) < 40)
        if (existing !== -1) {
          this.touch()
          list.splice(existing, 1)
        } else if (level.checkpoints.length + level.ledgeCheckpoints.length >= LIMITS.checkpoints) {
          return this.toast(`Only ${LIMITS.checkpoints} checkpoints. Tap one to remove it.`)
        } else if (onPlatform) {
          this.touch()
          list.push({ x: ledge.x, y: ledge.y })
          list.sort((a, b) => a.x - b.x || a.y - b.y)
        } else {
          this.touch()
          list.push(x)
          list.sort((a, b) => a - b)
        }
        break
      }
      default:
    }
    this.draw()
  }

  // Adds one more of a ground object (giant, fake flag, crumb) unless one is already there.
  addSpot(list, x, gap, limit, noun) {
    if (list.some((other) => Math.abs(other - x) < gap)) return
    if (list.length >= limit) return this.toast(`That is enough ${noun}!`)
    this.touch()
    list.push(x)
    this.draw()
  }

  paintColumn(tool, column, mode) {
    const level = this.level
    if (column < 0 || column >= level.width / COLUMN) return
    if (tool === 'bridge') {
      if (mode === 'add' && level.pits.includes(column) && !level.bridges.includes(column)) {
        this.touch()
        level.bridges.push(column)
        level.bridges.sort((a, b) => a - b)
      } else if (mode === 'remove' && level.bridges.includes(column)) {
        this.touch()
        level.bridges = level.bridges.filter((c) => c !== column)
      }
      return
    }
    if (mode === 'add' && !level.pits.includes(column)) {
      const blocker = this.groundObjects().find(
        (item) => item.x + 30 > column * COLUMN && item.x - 30 < (column + 1) * COLUMN
      )
      if (blocker) {
        this.toast(`Move the ${blocker.label} first, it is standing there.`)
        return
      }
      this.touch()
      level.pits.push(column)
      level.pits.sort((a, b) => a - b)
    } else if (mode === 'remove' && level.pits.includes(column)) {
      this.touch()
      level.pits = level.pits.filter((c) => c !== column)
      level.bridges = level.bridges.filter((c) => c !== column)
    }
  }

  eraseAt(point, column) {
    const level = this.level
    const reach = 8
    const box = [...this.hitBoxes]
      .reverse()
      .find(
        (b) =>
          point.x >= b.l - reach &&
          point.x <= b.r + reach &&
          point.y >= b.t - reach &&
          point.y <= b.b + reach
      )
    if (box) {
      if (box.kind === 'start' || box.kind === 'exit') {
        this.toast(`You cannot erase the ${box.kind}. Use the ${box.kind} tool to move it.`)
        return
      }
      this.touch()
      if (box.kind === 'platform') {
        level.platforms.splice(box.index, 1)
        // Checkpoints standing on it go with it.
        level.ledgeCheckpoints = level.ledgeCheckpoints.filter((spot) =>
          platformUnder(level.platforms, spot.x, spot.y)
        )
      } else if (box.kind === 'ledgecp') level.ledgeCheckpoints.splice(box.index, 1)
      else if (box.kind === 'ninja') level.enemies.splice(box.index, 1)
      else if (box.kind === 'banana') level.bananas.splice(box.index, 1)
      else if (box.kind === 'hazard') level.hazards.splice(box.index, 1)
      else if (box.kind === 'checkpoint') level.checkpoints.splice(box.index, 1)
      else if (box.kind === 'giant') level.giants.splice(box.index, 1)
      else if (box.kind === 'fakeflag') level.fakeFlags.splice(box.index, 1)
      else if (box.kind === 'crumb') level.crumbs.splice(box.index, 1)
      this.draw()
      return
    }
    if (level.bridges.includes(column)) {
      this.touch()
      level.bridges = level.bridges.filter((c) => c !== column)
    } else if (level.pits.includes(column)) {
      this.touch()
      level.pits = level.pits.filter((c) => c !== column)
    }
  }

  // ---------- drawing ----------

  sprite(key, x, y, scale, anchor, fallbackSize, icon) {
    const ctx = this.ctx
    let image = null
    try {
      if (this.game?.textures?.exists(key)) image = this.game.textures.get(key).getSourceImage()
    } catch {
      image = null
    }
    const w = (image?.width ?? fallbackSize[0]) * scale
    const h = (image?.height ?? fallbackSize[1]) * scale
    const top = anchor === 'ground' ? y - h : y - h / 2
    if (image) ctx.drawImage(image, x - w / 2, top, w, h)
    else {
      ctx.fillStyle = '#ffffff33'
      ctx.fillRect(x - w / 2, top, w, h)
      ctx.font = `${Math.min(w, h) * 0.8}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#fff'
      ctx.fillText(icon, x, top + h / 2)
    }
    return { l: x - w / 2, t: top, r: x + w / 2, b: top + h }
  }

  // Enemies and the giant look different on worlds with their own (e.g. Venera robots).
  enemySprite(x, index = 0) {
    // On Venus the robots take their types in order, exactly as they do in the game.
    const type = this.theme.enemyChase ? VENERA_TYPES[index % VENERA_TYPES.length] : null
    const key = type?.key || this.theme.enemyKey || 'ninja'
    const size = { ninja: [24, 24], venera1: [50, 46], venera7: [40, 48], venera9: [64, 44] }
    return this.sprite(
      key,
      x,
      FLOOR_Y,
      type?.scale ?? this.theme.enemyScale ?? 1.6,
      'ground',
      size[key] || [48, 52],
      '🥷'
    )
  }

  pigeonKey() {
    return this.theme.costume ? `pigeon-${this.theme.costume}` : 'pigeon'
  }

  giantSprite(x) {
    const key = this.theme.giantKey || 'giant'
    return this.sprite(key, x, FLOOR_Y, 1, 'ground', key === 'giant' ? [126, 84] : [139, 151], '👹')
  }

  record(kind, index, box) {
    if (this.recording) this.hitBoxes.push({ kind, index, ...box })
  }

  drawGhost() {
    const point = this.hover
    if (!point || this.tool === 'hand' || PAINT_TOOLS.has(this.tool)) return
    const x = this.snapX(point.x)
    const y = this.snapY(point.y, 140, 440)
    this.ctx.globalAlpha = 0.5
    this.recording = false
    switch (this.tool) {
      case 'platform':
      case 'longplatform':
      case 'legs':
        this.drawPlatform(x, y, this.tool === 'longplatform' ? 320 : 160, this.tool === 'legs')
        break
      case 'parasite':
        this.drawHazard('parasite', x, this.snapY(point.y, 100, 430))
        break
      case 'icicle':
      case 'fire':
      case 'block':
        this.drawHazard(this.tool, x, 0)
        break
      case 'ninja':
        this.enemySprite(x, this.level.enemies.length)
        break
      case 'banana':
        this.sprite('banana', x, FLOOR_Y, 1.4, 'ground', [32, 16], '🍌')
        break
      case 'giant':
        this.giantSprite(x)
        break
      case 'start':
        this.sprite(this.pigeonKey(), x, FLOOR_Y, 1.35, 'ground', [32, 32], '🐦')
        break
      case 'exit':
        this.sprite('ship', x, FLOOR_Y, 1.15, 'ground', [88, 56], '🚀')
        break
      case 'checkpoint': {
        const spot = this.checkpointSpot(point)
        this.drawFlag(spot.x, 0, false, spot.y == null ? FLOOR_Y : spot.y - 11)
        break
      }
      case 'fakeflag':
        this.sprite('fake-flag', x, FLOOR_Y - 60, 1, 'center', [40, 48], '🏴')
        break
      case 'crumb':
        this.sprite('crumb', x, FLOOR_Y - 46, 1, 'center', [18, 18], '🍞')
        break
      default:
    }
    this.recording = true
    this.ctx.globalAlpha = 1
  }

  drawPlatform(x, y, w, legs, record = null) {
    const ctx = this.ctx
    const theme = this.theme
    ctx.fillStyle = hex(theme.ground)
    ctx.fillRect(x - w / 2, y - 11, w, 22)
    ctx.lineWidth = 4
    ctx.strokeStyle = legs ? '#ff8fae' : hex(theme.accent)
    ctx.strokeRect(x - w / 2 + 2, y - 9, w - 4, 18)
    if (legs) {
      ctx.fillStyle = '#ff8fae'
      ctx.fillRect(x - w / 2 + 14, y + 11, 6, 12)
      ctx.fillRect(x + w / 2 - 20, y + 11, 6, 12)
    }
    const box = { l: x - w / 2, t: y - 11, r: x + w / 2, b: y + 11 }
    if (record !== null) this.record('platform', record, box)
  }

  drawHazard(type, x, y, record = null) {
    let box
    if (type === 'icicle') box = this.sprite('icicle', x, 85, 1, 'center', [28, 38], '🧊')
    else if (type === 'block') box = this.sprite('block', x, 150, 1, 'center', [56, 44], '🧱')
    else if (type === 'fire')
      box = this.sprite('fireball', x, FLOOR_Y - 16, 1, 'center', [32, 32], '🔥')
    else
      box = this.sprite(this.theme.swarmKey || 'parasite', x, y, 1, 'center', [32, 32], '🦠')
    if (record !== null) this.record('hazard', record, box)
  }

  // `base` is the y the flagpole stands on: the floor, or the top of a platform.
  drawFlag(x, label, record, base = FLOOR_Y, kind = 'checkpoint') {
    const ctx = this.ctx
    ctx.fillStyle = '#e6f1e7'
    ctx.fillRect(x - 2, base - 76, 4, 76)
    ctx.fillStyle = hex(this.theme.accent)
    ctx.fillRect(x + 2, base - 76, 38, 22)
    if (label) {
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 12px monospace'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
      ctx.fillText(`CP ${label}`, x + 6, base - 82)
    }
    if (record !== false && record !== null)
      this.record(kind, record, { l: x - 10, t: base - 76, r: x + 40, b: base })
  }

  label(text, x) {
    const ctx = this.ctx
    ctx.font = 'bold 14px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = '#fff'
    ctx.fillText(text, x, FLOOR_Y - 84)
  }

  draw() {
    if (!this.level || this.main.hidden || !this.dpr) return
    const ctx = this.ctx
    const level = this.level
    const theme = WORLD_THEMES.find((world) => world.id === level.world) || WORLD_THEMES[0]
    this.theme = theme
    this.hitBoxes = []
    this.recording = true
    const k = this.dpr * this.scale

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalAlpha = 1
    ctx.fillStyle = hex(theme.sky)
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    ctx.setTransform(k, 0, 0, k, -this.scrollX * k, this.offsetY * this.dpr)
    ctx.imageSmoothingEnabled = false

    const left = this.scrollX
    const right = this.scrollX + this.viewW
    // With levels this big, only draw (and hit-test) what is on screen.
    const inView = (x, pad = 140) => x > left - pad && x < right + pad
    ctx.fillStyle = hex(theme.sun)
    ctx.globalAlpha = 0.9
    ctx.beginPath()
    ctx.arc(left + this.viewW * 0.84, 120, 38, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1

    const columns = level.width / COLUMN
    const first = Math.max(0, Math.floor(left / COLUMN))
    const last = Math.min(columns - 1, Math.floor(right / COLUMN))
    for (let column = first; column <= last; column++) {
      const x = column * COLUMN
      if (level.pits.includes(column)) {
        ctx.fillStyle = '#04070d'
        ctx.fillRect(x, FLOOR_Y, COLUMN, WORLD_HEIGHT - FLOOR_Y)
        ctx.fillStyle = '#ff3b3b88'
        ctx.fillRect(x, WORLD_HEIGHT - 16, COLUMN, 16)
        ctx.fillStyle = '#ffd23f'
        if (!level.pits.includes(column - 1)) ctx.fillRect(x, FLOOR_Y, 4, WORLD_HEIGHT - FLOOR_Y)
        if (!level.pits.includes(column + 1))
          ctx.fillRect(x + COLUMN - 4, FLOOR_Y, 4, WORLD_HEIGHT - FLOOR_Y)
      } else {
        ctx.fillStyle = hex(theme.soil)
        ctx.fillRect(x, FLOOR_Y, COLUMN, WORLD_HEIGHT - FLOOR_Y)
        ctx.fillStyle = hex(theme.ground)
        ctx.fillRect(x, FLOOR_Y, COLUMN, 10)
      }
    }
    ctx.lineWidth = 1
    for (let column = first; column <= last + 1; column++) {
      ctx.strokeStyle = column % 5 === 0 ? '#ffffff22' : '#ffffff0d'
      ctx.beginPath()
      ctx.moveTo(column * COLUMN, 0)
      ctx.lineTo(column * COLUMN, WORLD_HEIGHT)
      ctx.stroke()
    }
    for (const column of level.bridges) {
      if (column < first - 1 || column > last + 1) continue
      this.sprite('bridge', column * COLUMN + COLUMN / 2, FLOOR_Y + 8, 1, 'center', [48, 20], '▬')
    }
    level.platforms.forEach((platform, index) => {
      if (inView(platform.x, platform.w))
        this.drawPlatform(platform.x, platform.y, platform.w, platform.legs, index)
    })
    level.hazards.forEach((hazard, index) => {
      if (inView(hazard.x)) this.drawHazard(hazard.type, hazard.x, hazard.y, index)
    })
    level.enemies.forEach((x, index) => {
      if (inView(x)) this.record('ninja', index, this.enemySprite(x, index))
    })
    level.bananas.forEach((x, index) => {
      if (inView(x))
        this.record(
          'banana',
          index,
          this.sprite('banana', x, FLOOR_Y, 1.4, 'ground', [32, 16], '🍌')
        )
    })
    level.giants.forEach((x, index) => {
      if (inView(x, 260)) this.record('giant', index, this.giantSprite(x))
    })
    level.crumbs.forEach((x, index) => {
      if (inView(x))
        this.record(
          'crumb',
          index,
          this.sprite('crumb', x, FLOOR_Y - 46, 1, 'center', [18, 18], '🍞')
        )
    })
    level.fakeFlags.forEach((x, index) => {
      if (inView(x))
        this.record(
          'fakeflag',
          index,
          this.sprite('fake-flag', x, FLOOR_Y - 60, 1, 'center', [40, 48], '🏴')
        )
    })
    // Flags are numbered in the order the pigeon meets them, as in the game.
    const flags = [
      ...level.checkpoints.map((x, index) => ({ x, index, kind: 'checkpoint', base: FLOOR_Y })),
      ...level.ledgeCheckpoints.map((spot, index) => ({
        x: spot.x,
        index,
        kind: 'ledgecp',
        base: spot.y - 11,
      })),
    ].sort((a, b) => a.x - b.x)
    flags.forEach((flag, order) => {
      if (inView(flag.x)) this.drawFlag(flag.x, order + 1, flag.index, flag.base, flag.kind)
    })
    this.record(
      'start',
      0,
      this.sprite(this.pigeonKey(), level.start, FLOOR_Y, 1.35, 'ground', [32, 32], '🐦')
    )
    this.label('START', level.start)
    this.record('exit', 0, this.sprite('ship', level.exit, FLOOR_Y, 1.15, 'ground', [88, 56], '🚀'))
    this.label('EXIT', level.exit)

    ctx.fillStyle = '#000000aa'
    ctx.fillRect(-4000, -200, 4000, WORLD_HEIGHT + 400)
    ctx.fillRect(level.width, -200, 4000, WORLD_HEIGHT + 400)
    ctx.strokeStyle = '#ff8e79'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(0, WORLD_HEIGHT)
    ctx.moveTo(level.width, 0)
    ctx.lineTo(level.width, WORLD_HEIGHT)
    ctx.stroke()

    this.drawGhost()
  }
}
