import assert from 'node:assert/strict'
import test from 'node:test'

import {
  BONUS_LEVEL_IDS,
  CAMPAIGN_LEVELS,
  DEFAULT_LEVEL,
  LEVEL_ORDER,
  VENERA_TYPES,
  nextLevelId,
} from '../src/data/campaign.js'
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
    for (const banana of level.bananas) {
      assert.equal(isSolid(level.gaps, banana.x), true, `${level.id} banana ${banana.x} on solid ground`)
      assert.ok(banana.min <= banana.x && banana.x <= banana.max)
      assert.equal(
        level.gaps.some(([start, end]) => end > banana.min && start < banana.max),
        false,
        `${level.id} banana patrol must not cross a pit`
      )
    }
  }
})

test('the campaign has 28 levels, seven worlds of four, boss only on 5-4', () => {
  assert.equal(CAMPAIGN_LEVELS.length, 28)
  assert.equal(LEVEL_ORDER[0], '1-1')
  assert.equal(LEVEL_ORDER[19], '5-4')
  assert.equal(LEVEL_ORDER[23], '6-4')
  assert.equal(LEVEL_ORDER[27], '7-4')
  assert.equal(CAMPAIGN_LEVELS.filter((level) => level.finalBoss).length, 1)
  assert.equal(CAMPAIGN_LEVELS.find((level) => level.finalBoss).id, '5-4')
  assert.equal(nextLevelId('1-1'), '1-2')
  assert.equal(nextLevelId('1-4'), '2-1')
  assert.equal(nextLevelId('5-4'), null)
  assert.equal(nextLevelId('6-1'), '6-2')
  assert.equal(nextLevelId('6-4'), '7-1')
  assert.equal(nextLevelId('7-4'), null)
})

test('the pigeon wears a tuxedo in Banana World and a space suit on Venus only', () => {
  for (const level of CAMPAIGN_LEVELS)
    assert.equal(
      level.costume,
      { w6: 'tux', w7: 'space' }[level.world],
      `${level.id} costume`
    )
})

test('Venus has four levels, Venera robots instead of normal enemies, and is open from the start', () => {
  const venus = CAMPAIGN_LEVELS.filter((level) => level.world === 'w7')
  assert.deepEqual(
    venus.map((level) => level.id),
    ['7-1', '7-2', '7-3', '7-4']
  )
  assert.equal(venus[0].worldName, 'Venus')
  assert.ok(venus.every((level) => level.enemyKey === 'venera' && level.enemies.length > 0))
  assert.ok(venus.every((level) => level.enemyMessage.includes('Venera')))
  assert.deepEqual(
    venus.map((level) => level.giant),
    [false, false, false, true]
  )
  assert.equal(venus[3].giantKey, 'venera-giant')
  assert.ok(venus.every((level) => level.enemyChase === true))
  const kinds = new Set(venus.flatMap((level) => level.enemies.map((enemy) => enemy.key)))
  assert.equal(VENERA_TYPES.length, 14)
  assert.equal(new Set(VENERA_TYPES.map((type) => type.key)).size, 14)
  assert.deepEqual(
    [...kinds].sort(),
    VENERA_TYPES.map((type) => type.key).sort(),
    'all fourteen Venera types appear somewhere on Venus'
  )
  assert.deepEqual(
    VENERA_TYPES.slice(10).map((type) => type.behavior),
    ['walk', 'ambush', 'strafe', 'bomb']
  )
  assert.ok(VENERA_TYPES.find((type) => type.key === 'venera14').shield)
  const wide = venus.flatMap((level) => level.enemies).filter((enemy) => enemy.patrol)
  assert.ok(wide.length > 0 && wide.every((enemy) => enemy.max - enemy.min >= 400))
  for (const level of venus)
    for (const enemy of level.enemies) {
      if (['shoot', 'strafe', 'bomb'].includes(enemy.behavior)) assert.equal(enemy.chaseSpeed, 0)
      else
        assert.ok(
          enemy.chaseSpeed > 0 && enemy.chaseSpeed < 265,
          'chasers must be slower than the pigeon'
        )
      assert.ok(enemy.chaseMin <= enemy.x && enemy.x <= enemy.chaseMax)
      assert.equal(
        level.gaps.some(([start, end]) => end > enemy.chaseMin && start < enemy.chaseMax),
        false,
        `${level.id} chase range must not cross a pit`
      )
      assert.equal(enemy.hp, { venera9: 2, venera13: 3 }[enemy.key] ?? 1)
    }
  assert.ok(
    CAMPAIGN_LEVELS.filter((level) => level.world !== 'w7').every(
      (level) => !level.enemyChase && level.enemies.every((enemy) => !enemy.key)
    )
  )
  assert.deepEqual(
    venus.map((level) => level.extraSwarm),
    [2, 3, 4, 5]
  )
  assert.ok(
    venus.every((level) => level.swarmKey === 'venus-parasite' && level.swarmStyle === 'drift')
  )
  assert.ok(
    CAMPAIGN_LEVELS.filter((level) => level.world !== 'w7').every((level) => !level.extraSwarm)
  )
  assert.ok(
    CAMPAIGN_LEVELS.filter((level) => level.world !== 'w7').every((level) => !level.enemyKey)
  )
  const state = new AdventureState()
  for (const level of venus) assert.equal(state.isLevelUnlocked(level.id), true)
  assert.ok(BONUS_LEVEL_IDS.includes('7-1') && BONUS_LEVEL_IDS.includes('6-1'))
})

test('Banana World has four levels with roaming bananas, unlocked from the start', () => {
  const banana = CAMPAIGN_LEVELS.filter((level) => level.world === 'w6')
  assert.deepEqual(
    banana.map((level) => level.id),
    ['6-1', '6-2', '6-3', '6-4']
  )
  assert.deepEqual(BONUS_LEVEL_IDS, ['6-1', '6-2', '6-3', '6-4', '7-1', '7-2', '7-3', '7-4'])
  assert.equal(banana[0].worldName, 'Banana World')
  assert.deepEqual(
    banana.map((level) => level.bananas.length),
    [2, 3, 4, 5]
  )
  const state = new AdventureState()
  for (const id of ['6-1', '6-2', '6-3', '6-4']) assert.equal(state.isLevelUnlocked(id), true)
  assert.equal(state.selectLevel('6-3'), true)
  assert.equal(state.isLevelUnlocked('2-1'), false)
})

test('every level in every world has roaming bananas, growing through each world', () => {
  assert.ok(CAMPAIGN_LEVELS.every((level) => level.bananas.length > 0))
  for (const world of ['w1', 'w2', 'w3', 'w4', 'w5']) {
    assert.deepEqual(
      CAMPAIGN_LEVELS.filter((level) => level.world === world).map((level) => level.bananas.length),
      [1, 2, 2, 3]
    )
  }
})

test('an existing save made before Banana World gets it unlocked automatically', () => {
  const old = normalizeSave({
    version: 3,
    currentLevel: '2-2',
    unlockedLevels: ['1-1', '1-2', '1-3', '1-4', '2-1', '2-2'],
    completedLevels: ['1-1'],
    levelCheckpoints: { '2-2': 1 },
    deaths: 4,
  })
  for (const id of BONUS_LEVEL_IDS) assert.ok(old.unlockedLevels.includes(id))
  assert.equal(old.currentLevel, '2-2')
  assert.equal(old.deaths, 4)
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
  assert.deepEqual(state.unlockedLevels, [DEFAULT_LEVEL, ...BONUS_LEVEL_IDS])
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
  assert.deepEqual(state.unlockedLevels, [DEFAULT_LEVEL, ...BONUS_LEVEL_IDS])
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
