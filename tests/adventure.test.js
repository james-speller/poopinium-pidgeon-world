import assert from 'node:assert/strict'
import test from 'node:test'

import { DEMO_LEVELS } from '../src/data/demoLevels.js'
import {
  AdventureState,
  CHECKPOINTS,
  normalizeSave,
  readSave,
  writeSave,
} from '../src/state/AdventureState.js'

test('only two flaps are available until landing', () => {
  const state = new AdventureState()
  assert.equal(state.flap(), true)
  assert.equal(state.flap(), true)
  assert.equal(state.flap(), false)
  state.land()
  assert.equal(state.flaps, 2)
})

test('every regular demo places checkpoints and its exit on solid ground', () => {
  for (const level of DEMO_LEVELS.filter((candidate) => !candidate.boss)) {
    for (const checkpoint of CHECKPOINTS) {
      assert.equal(
        level.gaps.some(([start, end]) => checkpoint >= start && checkpoint <= end),
        false,
        `${level.name} checkpoint ${checkpoint} must not be in a gap`
      )
    }
    assert.equal(
      level.gaps.some(([start, end]) => 2590 >= start && 2590 <= end),
      false,
      `${level.name} exit must be on solid ground`
    )
  }
})

test('ordinary damage takes ten hits; gigantic contact ignores remaining hearts', () => {
  const state = new AdventureState()
  for (let hit = 0; hit < 9; hit++) assert.equal(state.hurt(), false)
  assert.equal(state.hearts, 1)
  assert.equal(state.hurt(), true)
  state.respawn()
  assert.equal(state.hearts, 10)
  assert.equal(state.hurt(true), true)
  assert.equal(state.hearts, 0)
})

test('checkpoints advance monotonically, refill health, and survive repeated deaths', () => {
  const state = new AdventureState()
  state.hurt()
  assert.equal(state.activateCheckpoint(CHECKPOINTS[2]), true)
  assert.equal(state.hearts, 10)
  assert.equal(state.activateCheckpoint(CHECKPOINTS[1]), false)
  assert.equal(state.activateCheckpoint(12345), false)
  for (let i = 0; i < 100; i++) state.respawn()
  assert.equal(state.deaths, 100)
  assert.equal(state.checkpoint, CHECKPOINTS[2])
  assert.equal(state.hearts, 10)
})

test('save roundtrip resumes checkpoint and completion with restored health', () => {
  let stored
  const storage = {
    getItem: () => stored,
    setItem: (_key, value) => {
      stored = value
    },
  }
  const state = new AdventureState()
  state.selectDemo('pe72b')
  state.activateCheckpoint(CHECKPOINTS[2])
  state.respawn()
  state.completed = true
  state.hurt()
  assert.equal(writeSave(storage, state.snapshot()), true)
  const loaded = readSave(storage)
  const resumed = new AdventureState(loaded.save)
  assert.equal(loaded.exists, true)
  assert.equal(resumed.selectedDemo, 'pe72b')
  assert.equal(resumed.checkpoint, CHECKPOINTS[2])
  assert.equal(resumed.deaths, 1)
  assert.equal(resumed.completed, true)
  assert.equal(resumed.hearts, 10)
})

test('corrupt, obsolete, and unavailable storage do not prevent playing', () => {
  assert.equal(readSave({ getItem: () => '{bad' }).exists, false)
  assert.equal(readSave({ getItem: () => '{"version":99}' }).exists, false)
  assert.equal(
    readSave({
      getItem: () => {
        throw new Error('denied')
      },
    }).available,
    false
  )
  assert.equal(
    writeSave(
      {
        setItem: () => {
          throw new Error('full')
        },
      },
      {}
    ),
    false
  )
  const clean = normalizeSave({ checkpoint: 999, deaths: -1, completed: 'yes' })
  assert.equal(clean.version, 2)
  assert.equal(clean.selectedDemo, 'outer-america')
  assert.equal(clean.checkpoints['outer-america'], CHECKPOINTS[0])
  assert.equal(clean.deaths, 0)
  assert.deepEqual(clean.completedDemos, [])
})

test('each demo keeps its own checkpoint and completion record', () => {
  const state = new AdventureState()
  state.activateCheckpoint(CHECKPOINTS[1])
  state.completed = true
  state.selectDemo('xpe72a')
  assert.equal(state.checkpoint, CHECKPOINTS[0])
  assert.equal(state.completed, false)
  state.activateCheckpoint(CHECKPOINTS[2])
  state.selectDemo('outer-america')
  assert.equal(state.checkpoint, CHECKPOINTS[1])
  assert.equal(state.completed, true)
})
