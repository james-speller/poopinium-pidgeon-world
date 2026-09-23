import { DEFAULT_LEVEL, LEVEL_BY_ID, nextLevelId } from '../data/campaign.js'

export const SAVE_KEY = 'pidgeonworld-campaign-v3'

export function normalizeSave(value = {}) {
  const currentLevel = LEVEL_BY_ID[value.currentLevel] ? value.currentLevel : DEFAULT_LEVEL
  const completedLevels = Array.isArray(value.completedLevels)
    ? [...new Set(value.completedLevels.filter((id) => LEVEL_BY_ID[id]))]
    : []
  const unlockedSource = Array.isArray(value.unlockedLevels) ? value.unlockedLevels : []
  const unlockedLevels = [
    ...new Set([DEFAULT_LEVEL, ...unlockedSource.filter((id) => LEVEL_BY_ID[id]), ...completedLevels]),
  ]
  const levelCheckpoints = {}
  for (const id of Object.keys(LEVEL_BY_ID)) {
    const stored = value.levelCheckpoints?.[id]
    levelCheckpoints[id] = Number.isInteger(stored) && stored >= 0 && stored <= 2 ? stored : 0
  }
  return {
    version: 3,
    currentLevel,
    unlockedLevels,
    completedLevels,
    levelCheckpoints,
    deaths:
      Number.isInteger(value.deaths) && value.deaths >= 0
        ? Math.min(value.deaths, 999999)
        : 0,
  }
}

export function readSave(storage) {
  try {
    const raw = storage.getItem(SAVE_KEY)
    if (!raw) return { save: normalizeSave(), available: true, exists: false }
    const value = JSON.parse(raw)
    if (value?.version !== 3)
      return { save: normalizeSave(), available: true, exists: false }
    return { save: normalizeSave(value), available: true, exists: true }
  } catch {
    return { save: normalizeSave(), available: false, exists: false }
  }
}

export function writeSave(storage, value) {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(normalizeSave(value)))
    return true
  } catch {
    return false
  }
}

export class AdventureState {
  constructor(save) {
    Object.assign(this, normalizeSave(save))
    this.hearts = 10
    this.flaps = 2
  }
  get level() {
    return LEVEL_BY_ID[this.currentLevel]
  }
  get checkpoint() {
    return this.levelCheckpoints[this.currentLevel]
  }
  set checkpoint(value) {
    this.levelCheckpoints[this.currentLevel] = value
  }
  get checkpointX() {
    return this.level.checkpoints[this.checkpoint]
  }
  get completed() {
    return this.completedLevels.includes(this.currentLevel)
  }
  get unlocked() {
    return this.unlockedLevels.includes(this.currentLevel)
  }
  isLevelUnlocked(id) {
    return this.unlockedLevels.includes(id)
  }
  isLevelCompleted(id) {
    return this.completedLevels.includes(id)
  }
  selectLevel(id, restart = false) {
    if (!LEVEL_BY_ID[id] || !this.isLevelUnlocked(id)) return false
    this.currentLevel = id
    if (restart) this.checkpoint = 0
    this.hearts = 10
    this.flaps = 2
    return true
  }
  flap() {
    if (this.flaps <= 0) return false
    this.flaps -= 1
    return true
  }
  land() {
    this.flaps = 2
  }
  hurt(gigantic = false) {
    this.hearts = gigantic ? 0 : Math.max(0, this.hearts - 1)
    return this.hearts === 0
  }
  activateCheckpoint(index) {
    if (!Number.isInteger(index) || index < 1 || index > 2 || index <= this.checkpoint)
      return false
    this.checkpoint = index
    this.hearts = 10
    return true
  }
  respawn() {
    this.deaths += 1
    this.hearts = 10
    this.flaps = 2
  }
  completeCurrent() {
    const id = this.currentLevel
    if (!this.completedLevels.includes(id)) this.completedLevels.push(id)
    const next = nextLevelId(id)
    if (next && !this.unlockedLevels.includes(next)) this.unlockedLevels.push(next)
  }
  snapshot() {
    return normalizeSave(this)
  }
}
