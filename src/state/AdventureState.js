import { DEFAULT_DEMO, LEVEL_BY_ID } from '../data/demoLevels.js'

export const CHECKPOINTS = [120, 560, 1380]
export const SAVE_KEY = 'pidgeonworld-adventure-v2'

export function normalizeSave(value = {}) {
  const selectedDemo = LEVEL_BY_ID[value.selectedDemo] ? value.selectedDemo : DEFAULT_DEMO
  const checkpoints = {}
  for (const id of Object.keys(LEVEL_BY_ID)) {
    checkpoints[id] = CHECKPOINTS.includes(value.checkpoints?.[id])
      ? value.checkpoints[id]
      : CHECKPOINTS[0]
  }
  return {
    version: 2,
    selectedDemo,
    checkpoints,
    deaths:
      Number.isInteger(value.deaths) && value.deaths >= 0
        ? Math.min(value.deaths, 999999)
        : 0,
    completedDemos: Array.isArray(value.completedDemos)
      ? [...new Set(value.completedDemos.filter((id) => LEVEL_BY_ID[id]))]
      : [],
  }
}

export function readSave(storage) {
  try {
    const raw = storage.getItem(SAVE_KEY)
    if (!raw) return { save: normalizeSave(), available: true, exists: false }
    const value = JSON.parse(raw)
    if (value?.version !== 2)
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
  get checkpoint() {
    return this.checkpoints[this.selectedDemo]
  }
  set checkpoint(value) {
    this.checkpoints[this.selectedDemo] = value
  }
  get completed() {
    return this.completedDemos.includes(this.selectedDemo)
  }
  set completed(value) {
    if (value && !this.completed) this.completedDemos.push(this.selectedDemo)
    if (!value)
      this.completedDemos = this.completedDemos.filter((id) => id !== this.selectedDemo)
  }
  selectDemo(id, restart = false) {
    if (!LEVEL_BY_ID[id]) return false
    this.selectedDemo = id
    if (restart) {
      this.checkpoint = CHECKPOINTS[0]
      this.completed = false
    }
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
  activateCheckpoint(x) {
    if (!CHECKPOINTS.includes(x) || x <= this.checkpoint) return false
    this.checkpoint = x
    this.hearts = 10
    return true
  }
  respawn() {
    this.deaths += 1
    this.hearts = 10
    this.flaps = 2
  }
  snapshot() {
    return normalizeSave(this)
  }
}
