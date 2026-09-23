import assert from 'node:assert/strict'
import test from 'node:test'

import { CAMPAIGN_LEVELS, DEFAULT_LEVEL, LEVEL_ORDER, nextLevelId } from '../src/data/campaign.js'
import { isSolid } from '../src/data/layout.js'
import {
  AdventureState,
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

test('every level places its checkpoints, exit, enemies, and platforms on solid ground', () => {
  for (const level of CAMPAIGN_LEVELS) {
    for (const checkpoint of level.checkpoints) {
      assert.equal(
        isSolid(level.gaps, checkpoint),
        true,
        `${level.id} checkpoint ${checkpoint} must not be in a gap`
      )
    }
    if (level.exitX != null)
      assert.equal(isSolid(level.gaps, level.exitX), true, `${level.id} exit must be solid`)
    for (const enemy of level.enemies)
      assert.equal(isSolid(level.gaps, enemy.x), true, `${level.id} enemy ${enemy.x} on solid ground`)
    for (const platform of level.platforms)
      assert.ok(platform.x > 0 && platform.x < level.platformWidth)
  }
})

test('the campaign has 20 levels, five worlds of four, boss only on the last', () => {
  assert.equal(CAMPAIGN_LEVELS.length, 20)
  assert.equal(LEVEL_ORDER[0], '1-1')
  assert.equal(LEVEL_ORDER[19], '5-4')
  assert.equal(CAMPAIGN_LEVELS.filter((level) => level.finalBoss).length, 1)
  assert.equal(CAMPAIGN_LEVELS.find((level) => level.finalBoss).id, '5-4')
  assert.equal(nextLevelId('1-1'), '1-2')
  assert.equal(nextLevelId('1-4'), '2-1')
  assert.equal(nextLevelId('5-4'), null)
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
  assert.equal(state.activateCheckpoint(2), true)
  assert.equal(state.hearts, 10)
  assert.equal(state.activateCheckpoint(1), false)
  assert.equal(state.activateCheckpoint(0), false)
  assert.equal(state.activateCheckpoint(5), false)
  for (let i = 0; i < 100; i++) state.respawn()
  assert.equal(state.deaths, 100)
  assert.equal(state.checkpoint, 2)
  assert.equal(state.hearts, 10)
})

test('completing a level unlocks the next one; locked levels cannot be selected', () => {
  const state = new AdventureState()
  assert.deepEqual(state.unlockedLevels, [DEFAULT_LEVEL])
  assert.equal(state.selectLevel('1-3'), false)
  assert.equal(state.currentLevel, DEFAULT_LEVEL)
  state.completeCurrent()
  assert.deepEqual(state.completedLevels, ['1-1'])
  assert.ok(state.unlockedLevels.includes('1-2'))
  assert.equal(state.selectLevel('1-2'), true)
  assert.equal(state.currentLevel, '1-2')
})

test('save roundtrip resumes level, checkpoint, and completion', () => {
  let stored
  const storage = {
    getItem: () => stored,
    setItem: (_key, value) => {
      stored = value
    },
  }
  const state = new AdventureState()
  state.completeCurrent()
  state.selectLevel('1-2')
  state.activateCheckpoint(2)
  state.respawn()
  state.hurt()
  assert.equal(writeSave(storage, state.snapshot()), true)
  const loaded = readSave(storage)
  const resumed = new AdventureState(loaded.save)
  assert.equal(loaded.exists, true)
  assert.equal(resumed.currentLevel, '1-2')
  assert.equal(resumed.checkpoint, 2)
  assert.equal(resumed.deaths, 1)
  assert.equal(resumed.isLevelCompleted('1-1'), true)
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
  assert.equal(clean.version, 3)
  assert.equal(clean.currentLevel, DEFAULT_LEVEL)
  assert.deepEqual(clean.completedLevels, [])
  assert.equal(clean.deaths, 0)
})

test('an old six-demo (v2) save resets gracefully to a fresh v3 campaign', () => {
  const oldSave = {
    version: 2,
    selectedDemo: 'pe72b',
    checkpoints: { 'pe72b': 560 },
    deaths: 12,
    completedDemos: ['outer-america'],
  }
  const loaded = readSave({ getItem: () => JSON.stringify(oldSave) })
  assert.equal(loaded.exists, false)
  const state = new AdventureState(loaded.save)
  assert.equal(state.currentLevel, DEFAULT_LEVEL)
  assert.equal(state.checkpoint, 0)
  assert.deepEqual(state.completedLevels, [])
  assert.deepEqual(state.unlockedLevels, [DEFAULT_LEVEL])
})

test('each unlocked level keeps its own checkpoint independently', () => {
  const state = new AdventureState()
  state.activateCheckpoint(1)
  state.completeCurrent()
  assert.equal(state.selectLevel('1-2'), true)
  assert.equal(state.checkpoint, 0)
  state.activateCheckpoint(2)
  assert.equal(state.selectLevel('1-1'), true)
  assert.equal(state.checkpoint, 1)
})
