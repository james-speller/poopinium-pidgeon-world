import { WORLD_THEMES, veneraEnemies } from './campaign.js'
import { patrolRange } from './layout.js'

export const CUSTOM_STORAGE_KEY = 'pidgeonworld-custom-levels-v1'
export const COLUMN = 40
export const FLOOR_Y = 480
// Levels can be up to 16000px long (twice the old 8000) and hold ten times as many of each
// kind of object as they used to. Levels saved before the change keep their size.
export const LIMITS = {
  minWidth: 2000,
  maxWidth: 16000,
  defaultWidth: 6400,
  maxLevels: 30,
  platforms: 600,
  enemies: 300,
  bananas: 120,
  hazards: 800,
  checkpoints: 20,
  giants: 10,
  fakeFlags: 10,
  crumbs: 10,
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

// The solid platform a ledge checkpoint at (x, y) stands on, if any. Legged platforms
// wander off when triggered, so a checkpoint cannot stand on one.
export function platformUnder(platforms, x, y) {
  return platforms.find((p) => !p.legs && p.y === y && Math.abs(p.x - x) <= p.w / 2)
}

export function normalizeCustomLevel(raw) {
  if (!raw || typeof raw !== 'object') return null
  const width = clamp(
    Math.round(whole(raw.width, LIMITS.defaultWidth) / COLUMN) * COLUMN,
    LIMITS.minWidth,
    LIMITS.maxWidth
  )
  const columns = width / COLUMN
  const place = (value, fallback) => clamp(whole(value, fallback), 40, width - 40)
  const sortedUnique = (values) => [...new Set(values)].sort((a, b) => a - b)
  // Giants, fake flags and crumbs used to be one-per-level fields; accept those too.
  const positions = (list, legacy, limit) =>
    (Array.isArray(list) ? list : legacy != null ? [legacy] : [])
      .slice(0, limit)
      .map((x) => place(x, 400))

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
  const platforms = asList(raw.platforms)
    .slice(0, LIMITS.platforms)
    .map((platform) => ({
      x: place(platform?.x, 200),
      y: clamp(whole(platform?.y, 360), 140, 440),
      w: clamp(whole(platform?.w, 160), 80, 480),
      legs: platform?.legs === true,
    }))
  const checkpoints = sortedUnique(
    asList(raw.checkpoints)
      .slice(0, LIMITS.checkpoints)
      .map((x) => place(x, 600))
  )
  // Checkpoints on platforms are {x, y} where y is the platform's y. One that no longer
  // has a solid (non-legged) platform under it is dropped. They share the checkpoint cap.
  const ledgeCheckpoints = asList(raw.ledgeCheckpoints)
    .map((spot) => ({ x: place(spot?.x, 600), y: clamp(whole(spot?.y, 360), 140, 440) }))
    .filter((spot, index, all) => {
      if (!platformUnder(platforms, spot.x, spot.y)) return false
      return all.findIndex((other) => other.x === spot.x && other.y === spot.y) === index
    })
    .sort((a, b) => a.x - b.x || a.y - b.y)
    .slice(0, LIMITS.checkpoints - checkpoints.length)
  return {
    version: 1,
    id: typeof raw.id === 'string' && /^[\w-]{1,40}$/.test(raw.id) ? raw.id : newId(),
    name: (typeof raw.name === 'string' ? raw.name.trim().slice(0, 24) : '') || 'My level',
    world: WORLD_IDS.includes(raw.world) ? raw.world : 'w1',
    width,
    pits,
    bridges,
    platforms,
    enemies: asList(raw.enemies)
      .slice(0, LIMITS.enemies)
      .map((x) => place(x, 400)),
    bananas: asList(raw.bananas)
      .slice(0, LIMITS.bananas)
      .map((x) => place(x, 400)),
    hazards: asList(raw.hazards)
      .slice(0, LIMITS.hazards)
      .filter((hazard) => HAZARD_TYPES.includes(hazard?.type))
      .map((hazard) => ({
        type: hazard.type,
        x: place(hazard.x, 400),
        y: hazard.type === 'parasite' ? clamp(whole(hazard.y, 280), 100, 430) : 0,
      })),
    giants: positions(raw.giants, raw.giant, LIMITS.giants),
    checkpoints,
    ledgeCheckpoints,
    start: place(raw.start, 150),
    exit: place(raw.exit, width - 190),
    fakeFlags: positions(raw.fakeFlags, raw.fakeFlag, LIMITS.fakeFlags),
    crumbs: positions(raw.crumbs, raw.crumb, LIMITS.crumbs),
    updatedAt: whole(raw.updatedAt, 0),
  }
}

export function createBlankLevel(name = 'My level', world = 'w1') {
  return normalizeCustomLevel({ id: newId(), name, world, width: LIMITS.defaultWidth })
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
    ...level.bananas,
    ...level.giants,
    ...level.fakeFlags,
    ...level.crumbs,
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
  const extraJokes = [
    ...level.crumbs.map((x) => ({ type: 'runaway', x })),
    ...level.fakeFlags.map((x) => ({ type: 'fakeFlag', x })),
  ]
  // The start comes first; the rest are in order along the level. `surface` is the y of
  // the walkable top: the floor, or the top of the platform the flag stands on.
  const checkpointSpots = [
    { x: level.start, surface: FLOOR_Y },
    ...[
      ...level.checkpoints.map((x) => ({ x, surface: FLOOR_Y })),
      ...(level.ledgeCheckpoints || []).map((spot) => ({ x: spot.x, surface: spot.y - 11 })),
    ].sort((a, b) => a.x - b.x),
  ]
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
    costume: theme.costume,
    enemyKey: theme.enemyKey,
    enemyChase: theme.enemyChase === true,
    enemyScale: theme.enemyScale,
    enemyMessage: theme.enemyMessage,
    giantKey: theme.giantKey,
    swarmKey: theme.swarmKey,
    swarmStyle: theme.swarmStyle,
    swarmMessage: theme.swarmMessage,
    width: level.width,
    platformWidth: level.width,
    gaps,
    checkpoints: checkpointSpots.map((spot) => spot.x),
    checkpointYs: checkpointSpots.map((spot) => spot.surface),
    exitX: level.exit,
    shipX: level.exit + 65,
    platforms: level.platforms.map((platform) => ({
      x: platform.x,
      y: platform.y,
      width: platform.w,
      legs: platform.legs,
    })),
    enemies: theme.enemyChase
      ? veneraEnemies(
          level.enemies.map((x) => ({ x, min: x - 130, max: x + 130 })),
          gaps,
          level.width
        )
      : level.enemies.map((x) => ({ x, min: x - 130, max: x + 130 })),
    bananas: level.bananas.map((x) => {
      const [min, max] = patrolRange(gaps, x, 220, level.width)
      return { x, min, max }
    }),
    trap: { w3: 'fire', w4: 'swarm' }[theme.id] || 'custom',
    signText: '',
    hazardMessage: 'Ouch!',
    giant: level.giants.length > 0,
    giantX: level.giants[0] ?? null,
    giants: [...level.giants],
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
    if (!text.startsWith(SHARE_PREFIX) || text.length > 800000) return null
    const binary = atob(text.slice(SHARE_PREFIX.length))
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    const raw = JSON.parse(new TextDecoder().decode(bytes))
    delete raw.id
    return normalizeCustomLevel(raw)
  } catch {
    return null
  }
}
