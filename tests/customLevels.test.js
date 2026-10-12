import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CUSTOM_STORAGE_KEY,
  LIMITS,
  createBlankLevel,
  decodeShareCode,
  duplicateLevel,
  encodeShareCode,
  isPitAt,
  loadCustomLevels,
  normalizeCustomLevel,
  saveCustomLevels,
  toRuntimeLevel,
  validateForPlay,
} from '../src/data/customLevels.js'
import { AdventureState } from '../src/state/AdventureState.js'

test('a blank level is valid, playable, and has the exit right of the start', () => {
  const level = createBlankLevel()
  assert.equal(level.width, 3200)
  assert.deepEqual(validateForPlay(level), [])
  assert.ok(level.exit > level.start + 200)
})

test('normalising clamps junk input and drops invalid entries', () => {
  const level = normalizeCustomLevel({
    width: 999999,
    name: '   ',
    world: 'nope',
    pits: [3, 3, -5, 1e9, 'x', 7],
    bridges: [3, 99],
    platforms: [{ x: -10, y: 5, w: 9999 }, null],
    hazards: [{ type: 'laser', x: 100 }, { type: 'icicle', x: 5000 }],
    enemies: new Array(100).fill(500),
    checkpoints: [900, 300, 600],
  })
  assert.equal(level.width, LIMITS.maxWidth)
  assert.equal(level.name, 'My level')
  assert.equal(level.world, 'w1')
  assert.deepEqual(level.pits, [3, 7])
  assert.deepEqual(level.bridges, [3])
  assert.equal(level.platforms.length, 2)
  assert.ok(level.platforms.every((p) => p.x >= 40 && p.y >= 140 && p.w <= 480))
  assert.deepEqual(level.hazards.map((h) => h.type), ['icicle'])
  assert.equal(level.enemies.length, LIMITS.enemies)
  assert.deepEqual(level.checkpoints, [300, 900])
  assert.equal(normalizeCustomLevel(null), null)
  assert.equal(normalizeCustomLevel('hello'), null)
})

test('pit detection and play validation catch unplayable layouts', () => {
  const level = createBlankLevel()
  level.pits = [3, 4, 5]
  assert.equal(isPitAt(level, 140), true)
  assert.equal(isPitAt(level, 400), false)
  level.start = 140
  assert.match(validateForPlay(level)[0], /start is over a pit/)
  level.start = 400
  level.exit = 450
  assert.ok(validateForPlay(level).some((issue) => /right of the start/.test(issue)))
})

test('the runtime level merges adjacent pits into gaps and keeps the start first', () => {
  const level = createBlankLevel('Test', 'w3')
  level.pits = [10, 11, 12, 20]
  level.checkpoints = [1200, 2000]
  level.giant = 2400
  level.crumb = 900
  level.hazards = [{ type: 'parasite', x: 700, y: 260 }]
  const runtime = toRuntimeLevel(level)
  assert.deepEqual(runtime.gaps, [
    [400, 520],
    [800, 840],
  ])
  assert.deepEqual(runtime.checkpoints, [level.start, 1200, 2000])
  assert.equal(runtime.exitX, level.exit)
  assert.equal(runtime.trap, 'fire')
  assert.equal(runtime.giant, true)
  assert.equal(runtime.giantX, 2400)
  assert.deepEqual(runtime.extraJokes, [{ type: 'runaway', x: 900 }])
  assert.ok(runtime.id.startsWith('custom-'))
  assert.equal(runtime.finalBoss, false)
})

test('share codes round-trip, including unicode names, and reject garbage', () => {
  const level = createBlankLevel('Bird café 🐦')
  level.pits = [5, 6]
  level.platforms = [{ x: 300, y: 340, w: 160, legs: true }]
  const decoded = decodeShareCode(encodeShareCode(level))
  assert.equal(decoded.name, level.name)
  assert.deepEqual(decoded.pits, [5, 6])
  assert.equal(decoded.platforms[0].legs, true)
  assert.notEqual(decoded.id, level.id)
  assert.equal(decodeShareCode('hello'), null)
  assert.equal(decodeShareCode('PWL1.@@@not-base64'), null)
  assert.equal(decodeShareCode(''), null)
})

test('custom levels save, load, dedupe, and survive broken storage', () => {
  let stored
  const storage = {
    getItem: () => stored,
    setItem: (_key, value) => {
      stored = value
    },
  }
  const a = createBlankLevel('A')
  assert.equal(saveCustomLevels(storage, [a, a, createBlankLevel('B')]), true)
  const loaded = loadCustomLevels(storage)
  assert.equal(loaded.available, true)
  assert.equal(loaded.levels.length, 2)
  assert.equal(CUSTOM_STORAGE_KEY, 'pidgeonworld-custom-levels-v1')
  assert.deepEqual(loadCustomLevels({ getItem: () => '{bad' }), { levels: [], available: false })
  assert.equal(loadCustomLevels({ getItem: () => '{"version":9}' }).levels.length, 0)
  assert.equal(loadCustomLevels(null).available, false)
  assert.equal(
    saveCustomLevels(
      {
        setItem: () => {
          throw new Error('full')
        },
      },
      []
    ),
    false
  )
  assert.notEqual(duplicateLevel(a).id, a.id)
})

test('playing a custom level never touches campaign progress', () => {
  const state = new AdventureState()
  const before = JSON.stringify(state.snapshot())
  state.customLevel = toRuntimeLevel(createBlankLevel())
  assert.equal(state.level.custom, true)
  assert.equal(state.checkpoint, 0)
  assert.equal(state.activateCheckpoint(1), true)
  assert.equal(state.checkpoint, 1)
  state.completeCurrent()
  assert.equal(state.completed, true)
  assert.equal(JSON.stringify(state.snapshot()), before)
})
