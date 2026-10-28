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
  assert.equal(level.width, LIMITS.defaultWidth)
  assert.equal(LIMITS.defaultWidth, 6400)
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
    enemies: new Array(400).fill(500),
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
  assert.deepEqual(level.checkpoints, [300, 600, 900])
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
  level.giants = [2400, 3200]
  level.crumbs = [900]
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
  assert.deepEqual(runtime.giants, [2400, 3200])
  assert.deepEqual(runtime.extraJokes, [{ type: 'runaway', x: 900 }])
  assert.ok(runtime.id.startsWith('custom-'))
  assert.equal(runtime.finalBoss, false)
})

test('custom levels can hold bananas that roam on solid ground', () => {
  const level = createBlankLevel()
  level.bananas = [600, 640, 1500]
  level.pits = [20, 21, 22, 23]
  assert.deepEqual(normalizeCustomLevel({ ...level, bananas: new Array(300).fill(500) }).bananas.length, LIMITS.bananas)
  assert.deepEqual(normalizeCustomLevel({ ...level, bananas: undefined }).bananas, [])
  const runtime = toRuntimeLevel(level)
  assert.equal(runtime.bananas.length, 3)
  for (const banana of runtime.bananas) {
    assert.ok(banana.min <= banana.x && banana.x <= banana.max)
    assert.equal(
      runtime.gaps.some(([start, end]) => end > banana.min && start < banana.max),
      false
    )
  }
  level.bananas = [850]
  assert.ok(validateForPlay(level).some((issue) => /over a pit/.test(issue)))
  const decoded = decodeShareCode(encodeShareCode(level))
  assert.deepEqual(decoded.bananas, [850])
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

test('levels can be twice as long and hold ten times as many objects', () => {
  assert.equal(LIMITS.maxWidth, 16000)
  assert.deepEqual(
    [LIMITS.platforms, LIMITS.enemies, LIMITS.bananas, LIMITS.hazards, LIMITS.checkpoints],
    [600, 300, 120, 800, 20]
  )
  assert.deepEqual([LIMITS.giants, LIMITS.fakeFlags, LIMITS.crumbs], [10, 10, 10])
  const big = {
    width: 16000,
    platforms: Array.from({ length: 600 }, (_, i) => ({ x: 100 + i * 20, y: 300, w: 160 })),
    enemies: Array.from({ length: 300 }, (_, i) => 100 + i * 50),
    bananas: Array.from({ length: 120 }, (_, i) => 100 + i * 100),
    hazards: Array.from({ length: 800 }, (_, i) => ({ type: 'icicle', x: 100 + i * 20 })),
    checkpoints: Array.from({ length: 20 }, (_, i) => 500 + i * 700),
    giants: Array.from({ length: 10 }, (_, i) => 600 + i * 900),
    fakeFlags: Array.from({ length: 10 }, (_, i) => 700 + i * 900),
    crumbs: Array.from({ length: 10 }, (_, i) => 800 + i * 900),
  }
  const level = normalizeCustomLevel(big)
  assert.equal(level.width, 16000)
  assert.equal(level.platforms.length, 600)
  assert.equal(level.enemies.length, 300)
  assert.equal(level.bananas.length, 120)
  assert.equal(level.hazards.length, 800)
  assert.equal(level.checkpoints.length, 20)
  assert.deepEqual([level.giants.length, level.fakeFlags.length, level.crumbs.length], [10, 10, 10])
  const runtime = toRuntimeLevel(level)
  assert.equal(runtime.checkpoints.length, 21)
  assert.equal(runtime.extraJokes.length, 20)
  assert.equal(validateForPlay(level).length, 0)
  const decoded = decodeShareCode(encodeShareCode(level))
  assert.equal(decoded.hazards.length, 800)
  assert.equal(decoded.giants.length, 10)
  // one more than the limit is dropped
  assert.equal(normalizeCustomLevel({ giants: new Array(11).fill(500) }).giants.length, 10)
})

test('levels saved with the old single giant, fake flag and crumb still load', () => {
  const level = normalizeCustomLevel({ width: 3200, giant: 1500, fakeFlag: 1800, crumb: 900 })
  assert.deepEqual([level.giants, level.fakeFlags, level.crumbs], [[1500], [1800], [900]])
  assert.equal(level.width, 3200)
  assert.equal(normalizeCustomLevel({ giant: null }).giants.length, 0)
})

test('a custom level can use more than two checkpoints', () => {
  const state = new AdventureState()
  const level = createBlankLevel()
  level.checkpoints = [800, 1600, 2400, 3200, 4000]
  state.customLevel = toRuntimeLevel(level)
  for (const index of [1, 2, 3, 4, 5]) assert.equal(state.activateCheckpoint(index), true)
  assert.equal(state.activateCheckpoint(6), false)
  assert.equal(state.checkpointX, 4000)
})

test('checkpoints can stand on solid platforms and are ordered along the level', () => {
  const level = normalizeCustomLevel({
    platforms: [
      { x: 1000, y: 340, w: 160 },
      { x: 2000, y: 300, w: 160, legs: true },
    ],
    checkpoints: [1600],
    ledgeCheckpoints: [
      { x: 1040, y: 340 },
      { x: 1040, y: 340 },
      { x: 1400, y: 340 },
      { x: 2000, y: 300 },
      { x: 1000, y: 200 },
    ],
  })
  // Duplicates, spots off the platform and spots on legged platforms are dropped.
  assert.deepEqual(level.ledgeCheckpoints, [{ x: 1040, y: 340 }])
  const runtime = toRuntimeLevel(level)
  assert.deepEqual(runtime.checkpoints, [level.start, 1040, 1600])
  assert.deepEqual(runtime.checkpointYs, [480, 329, 480])
  const state = new AdventureState()
  state.customLevel = runtime
  assert.equal(state.checkpointY, 480)
  state.activateCheckpoint(1)
  assert.equal(state.checkpointY, 329)
  assert.equal(state.checkpointX, 1040)
})

test('platform checkpoints share the checkpoint cap and vanish with their platform', () => {
  const full = normalizeCustomLevel({
    platforms: [{ x: 1000, y: 340, w: 160 }],
    checkpoints: Array.from({ length: LIMITS.checkpoints }, (_, i) => 500 + i * 100),
    ledgeCheckpoints: [{ x: 1000, y: 340 }],
  })
  assert.equal(full.ledgeCheckpoints.length, 0)
  const orphaned = normalizeCustomLevel({
    platforms: [],
    ledgeCheckpoints: [{ x: 1000, y: 340 }],
  })
  assert.deepEqual(orphaned.ledgeCheckpoints, [])
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
