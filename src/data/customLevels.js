import { WORLD_THEMES } from './campaign.js'

export const CUSTOM_STORAGE_KEY = 'pidgeonworld-custom-levels-v1'
export const COLUMN = 40
export const FLOOR_Y = 480
export const LIMITS = {
  minWidth: 2000,
  maxWidth: 8000,
  maxLevels: 30,
  platforms: 60,
  enemies: 30,
  hazards: 80,
  checkpoints: 2,
}
export const HAZARD_TYPES = ['icicle', 'fire', 'parasite', 'block']

const WORLD_IDS = WORLD_THEMES.map((world) => world.id)
const SHARE_PREFIX = 'PWL1.'

const clamp = (value, low, high) => Math.min(high, Math.max(low, value))
const whole = (value, fallback) => (Number.isFinite(value) ? Math.round(value) : fallback)
const asList = (value) => (Array.isArray(value) ? value : [])

function newId() {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function normalizeCustomLevel(raw) {
  if (!raw || typeof raw !== 'object') return null
  const width = clamp(
    Math.round(whole(raw.width, 3200) / COLUMN) * COLUMN,
    LIMITS.minWidth,
    LIMITS.maxWidth
  )
  const columns = width / COLUMN
  const place = (value, fallback) => clamp(whole(value, fallback), 40, width - 40)
  const single = (value) => (value == null ? null : place(value, 400))
  const sortedUnique = (values) => [...new Set(values)].sort((a, b) => a - b)

  const pits = sortedUnique(
    asList(raw.pits)
      .map((column) => whole(column, -1))
      .filter((column) => column >= 0 && column < columns)
  )
  const bridges = sortedUnique(
    asList(raw.bridges)
      .map((column) => whole(column, -1))
      .filter((column) => pits.includes(column))
  )
  return {
    version: 1,
    id: typeof raw.id === 'string' && /^[\w-]{1,40}$/.test(raw.id) ? raw.id : newId(),
    name: (typeof raw.name === 'string' ? raw.name.trim().slice(0, 24) : '') || 'My level',
    world: WORLD_IDS.includes(raw.world) ? raw.world : 'w1',
    width,
    pits,
    bridges,
    platforms: asList(raw.platforms)
      .slice(0, LIMITS.platforms)
      .map((platform) => ({
        x: place(platform?.x, 200),
        y: clamp(whole(platform?.y, 360), 140, 440),
        w: clamp(whole(platform?.w, 160), 80, 480),
        legs: platform?.legs === true,
      })),
    enemies: asList(raw.enemies)
      .slice(0, LIMITS.enemies)
      .map((x) => place(x, 400)),
    hazards: asList(raw.hazards)
      .slice(0, LIMITS.hazards)
      .filter((hazard) => HAZARD_TYPES.includes(hazard?.type))
      .map((hazard) => ({
        type: hazard.type,
        x: place(hazard.x, 400),
        y: hazard.type === 'parasite' ? clamp(whole(hazard.y, 280), 100, 430) : 0,
      })),
    giant: single(raw.giant),
    checkpoints: sortedUnique(
      asList(raw.checkpoints)
        .slice(0, LIMITS.checkpoints)
        .map((x) => place(x, 600))
    ),
    start: place(raw.start, 150),
    exit: place(raw.exit, width - 190),
    fakeFlag: single(raw.fakeFlag),
    crumb: single(raw.crumb),
    updatedAt: whole(raw.updatedAt, 0),
  }
}

export function createBlankLevel(name = 'My level', world = 'w1') {
  return normalizeCustomLevel({ id: newId(), name, world, width: 3200 })
}

export function duplicateLevel(level) {
  return normalizeCustomLevel({
    ...JSON.parse(JSON.stringify(level)),
    id: newId(),
    name: `${level.name} copy`,
  })
}

export function isPitAt(level, x, half = 30) {
  const first = Math.floor((x - half) / COLUMN)
  const last = Math.floor((x + half - 1) / COLUMN)
  for (let column = first; column <= last; column++)
    if (level.pits.includes(column)) return true
  return false
}

export function validateForPlay(level) {
  const issues = []
  if (isPitAt(level, level.start)) issues.push('The start is over a pit. Move it onto the ground.')
  if (isPitAt(level, level.exit)) issues.push('The exit is over a pit. Move it onto the ground.')
  if (level.exit < level.start + 200)
    issues.push('Put the exit (rocket) to the right of the start (bird).')
  if (level.checkpoints.some((x) => isPitAt(level, x)))
    issues.push('A checkpoint is over a pit.')
  const grounded = [
    ...level.enemies,
    ...[level.giant, level.fakeFlag, level.crumb].filter((x) => x != null),
  ]
  if (grounded.some((x) => isPitAt(level, x)))
    issues.push('Something that stands on the ground is over a pit.')
  return issues
}

export function toRuntimeLevel(level) {
  const theme = WORLD_THEMES.find((world) => world.id === level.world) || WORLD_THEMES[0]
  const gaps = []
  for (const column of level.pits) {
    const last = gaps[gaps.length - 1]
    if (last && last[1] === column * COLUMN) last[1] += COLUMN
    else gaps.push([column * COLUMN, (column + 1) * COLUMN])
  }
  const extraJokes = []
  if (level.crumb != null) extraJokes.push({ type: 'runaway', x: level.crumb })
  if (level.fakeFlag != null) extraJokes.push({ type: 'fakeFlag', x: level.fakeFlag })
  return {
    id: `custom-${level.id}`,
    custom: true,
    number: 'MY',
    world: theme.id,
    worldName: 'My levels',
    worldIndex: -1,
    levelIndex: 0,
    isWorldFinale: false,
    name: level.name,
    short: 'MADE BY YOU',
    intro: 'A level you built yourself. Good luck!',
    message: 'Reach the rocket. You built this, so you only have yourself to blame.',
    sky: theme.sky,
    ground: theme.ground,
    soil: theme.soil,
    accent: theme.accent,
    sun: theme.sun,
    gravity: theme.gravity,
    friction: theme.friction,
    enemyTint: theme.enemyTint,
    giantTint: theme.giantTint,
    width: level.width,
    platformWidth: level.width,
    gaps,
    checkpoints: [level.start, ...level.checkpoints],
    exitX: level.exit,
    shipX: level.exit + 65,
    platforms: level.platforms.map((platform) => ({
      x: platform.x,
      y: platform.y,
      width: platform.w,
      legs: platform.legs,
    })),
    enemies: level.enemies.map((x) => ({ x, min: x - 130, max: x + 130 })),
    trap: { w3: 'fire', w4: 'swarm' }[theme.id] || 'custom',
    signText: '',
    hazardMessage: 'Ouch!',
    giant: level.giant != null,
    giantX: level.giant,
    finalBoss: false,
    joke: { type: 'none' },
    extraJokes,
    bossX: null,
    bossMaxHealth: 0,
    bridges: level.bridges.map((column) => column * COLUMN + COLUMN / 2),
    hazardList: level.hazards.map((hazard) => ({ ...hazard })),
  }
}

export function loadCustomLevels(storage) {
  try {
    const raw = storage.getItem(CUSTOM_STORAGE_KEY)
    if (!raw) return { levels: [], available: true }
    const parsed = JSON.parse(raw)
    if (parsed?.version !== 1 || !Array.isArray(parsed.levels))
      return { levels: [], available: true }
    const seen = new Set()
    const levels = parsed.levels
      .slice(0, LIMITS.maxLevels)
      .map(normalizeCustomLevel)
      .filter((level) => level && !seen.has(level.id) && seen.add(level.id))
    return { levels, available: true }
  } catch {
    return { levels: [], available: false }
  }
}

export function saveCustomLevels(storage, levels) {
  try {
    storage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify({ version: 1, levels }))
    return true
  } catch {
    return false
  }
}

export function encodeShareCode(level) {
  const rest = { ...level }
  delete rest.id
  delete rest.updatedAt
  const bytes = new TextEncoder().encode(JSON.stringify(rest))
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
  return SHARE_PREFIX + btoa(binary)
}

export function decodeShareCode(code) {
  try {
    const text = String(code).trim()
    if (!text.startsWith(SHARE_PREFIX) || text.length > 60000) return null
    const binary = atob(text.slice(SHARE_PREFIX.length))
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    const raw = JSON.parse(new TextDecoder().decode(bytes))
    delete raw.id
    return normalizeCustomLevel(raw)
  } catch {
    return null
  }
}
