import { enemyPositions, placeOnSolid, platformsForGaps, spreadGaps } from './layout.js'

const START_MARGIN = 480
const END_MARGIN = 480

const WORLDS = [
  {
    id: 'w1',
    name: 'Outer America',
    sky: 0x070d1b,
    ground: 0x4b9b58,
    soil: 0x203b2b,
    accent: 0xa8ed86,
    sun: 0xffc95f,
    gravity: 1100,
    friction: 800,
    enemyTint: 0xffffff,
    giantTint: 0x9b75bb,
  },
  {
    id: 'w2',
    name: 'PE72B',
    sky: 0x071c35,
    ground: 0xa8eaff,
    soil: 0x315b7a,
    accent: 0xc9f5ff,
    sun: 0xdff8ff,
    gravity: 1030,
    friction: 35,
    enemyTint: 0xb9efff,
    giantTint: 0xe6fbff,
  },
  {
    id: 'w3',
    name: 'XPE72A',
    sky: 0x35101b,
    ground: 0xd84d2f,
    soil: 0x5b1c20,
    accent: 0xffc04d,
    sun: 0xff7138,
    gravity: 1160,
    friction: 700,
    enemyTint: 0xff765d,
    giantTint: 0xff4738,
  },
  {
    id: 'w4',
    name: 'EP17A',
    sky: 0x1f102d,
    ground: 0x82519a,
    soil: 0x34203f,
    accent: 0xe690ff,
    sun: 0xc861ff,
    gravity: 1080,
    friction: 650,
    enemyTint: 0xe98cff,
    giantTint: 0xb846d1,
  },
  {
    id: 'w5',
    name: 'Actually Earth',
    sky: 0x68bce8,
    ground: 0x65ae4d,
    soil: 0x745033,
    accent: 0xffef75,
    sun: 0xffe168,
    gravity: 1100,
    friction: 800,
    enemyTint: 0xffffff,
    giantTint: 0x6c8f55,
  },
]

// Per-world-index (li 0-3): [width, gapCount, gapWidth, enemyCount]
const SIZE_BY_INDEX = [
  [3000, 2, 230, 3],
  [3400, 3, 250, 4],
  [3800, 3, 280, 5],
  [4200, 4, 280, 6],
]

const JOKE_CYCLE = ['runaway', 'legPlatform', 'fakeFlag']

// world index (0-4), level index (0-3): trap id + copy
const LEVEL_TEXT = [
  [
    {
      name: 'Outer America I',
      short: 'GREEN. SPACE. FIRST STEPS.',
      intro: 'A friendly-looking landing field. Nothing about it is friendly.',
      message: 'Find your feet. The bridge ahead has excellent references.',
      trap: 'bridge',
      signText: 'ABSOLUTELY SAFE BRIDGE',
    },
    {
      name: 'Outer America II',
      short: 'THE CEILING HAS OPINIONS.',
      intro: 'Someone bolted the architecture to the sky. Loosely.',
      message: 'Complimentary ceiling. Please do not stand underneath it.',
      trap: 'earthBlock',
      signText: 'DEBRIS-FREE ZONE (CITATION NEEDED)',
    },
    {
      name: 'Outer America III',
      short: 'A LONGER, RUDER BRIDGE.',
      intro: 'The second bridge learned from the first bridge’s mistakes. It is worse.',
      message: 'Ninjas ahead. The bridge is still not sorry.',
      trap: 'bridge',
      signText: 'INSPECTED TWICE (BY THE SAME PERSON)',
    },
    {
      name: 'Outer America IV',
      short: 'SOMETHING VERY LARGE LIVES HERE.',
      intro: 'The launch road to the spaceship. Also, apparently, wildlife.',
      message: 'Reach the ship. Do not befriend the wildlife.',
      trap: 'bridge',
      signText: 'TOTALLY NORMAL WILDLIFE AHEAD',
      giant: true,
    },
  ],
  [
    {
      name: 'PE72B I',
      short: 'VERY COLD. SO DANGEROUS.',
      intro: 'A frozen planet where the floor is slippery and the icicles are offended.',
      message: 'Do not lick the checkpoint. It remembers everything.',
      trap: 'icicles',
      signText: 'ICICLE-FREE ZONE',
    },
    {
      name: 'PE72B II',
      short: 'THE ICE HAS AN ATTITUDE.',
      intro: 'More icicles, closer together, all with better aim.',
      message: 'Keep moving. Standing still is how you become a snowman.',
      trap: 'icicles',
      signText: 'PLEASE DO NOT FEED THE ICICLES',
    },
    {
      name: 'PE72B III',
      short: 'A FALLING-DEBRIS ENCORE.',
      intro: 'Even the sky here is unreasonably heavy.',
      message: 'Something is falling. It is, once again, not soup.',
      trap: 'earthBlock',
      signText: 'STRUCTURALLY SOUND (PROBABLY)',
    },
    {
      name: 'PE72B IV',
      short: 'FROZEN AND ENORMOUS.',
      intro: 'The exit is close. So is something gigantic.',
      message: 'Board the ship. Ignore anything the size of a building.',
      trap: 'icicles',
      signText: 'TOTALLY NORMAL WILDLIFE AHEAD',
      giant: true,
    },
  ],
  [
    {
      name: 'XPE72A I',
      short: 'HOT. WITH LITERAL MONSTERS.',
      intro: 'The ground is hot, the lava is hotter, and the monsters insist they are literal.',
      message: 'The lava is not soup. We checked twice.',
      trap: 'fire',
      signText: 'LAVA: LOCALLY SOURCED',
    },
    {
      name: 'XPE72A II',
      short: 'MORE FIRE. LESS SUBTLETY.',
      intro: 'The fireballs have started jumping in formation.',
      message: 'Timing matters. So does not touching the fire.',
      trap: 'fire',
      signText: 'ARTISANAL, FREE-RANGE FIREBALLS',
    },
    {
      name: 'XPE72A III',
      short: 'THE SKY IS ALSO ON FIRE.',
      intro: 'Something heavy just detached from the ceiling. It is on fire, obviously.',
      message: 'Look up occasionally. It is currently a good idea.',
      trap: 'earthBlock',
      signText: 'FIREPROOF SCENERY (UNTESTED)',
    },
    {
      name: 'XPE72A IV',
      short: 'MONSTROUSLY HOT.',
      intro: 'The path to the ship runs directly past something enormous and warm.',
      message: 'Board the ship. The monster does not want a hug.',
      trap: 'fire',
      signText: 'TOTALLY NORMAL WILDLIFE AHEAD',
      giant: true,
    },
  ],
  [
    {
      name: 'EP17A I',
      short: 'MASSIVE PARASITES. MANY OF THEM.',
      intro: 'A living purple planet with parasites large enough to have their own parasites.',
      message: 'If the ground blinks, politely stop standing on it.',
      trap: 'swarm',
      signText: 'PARASITE QUIET AREA',
    },
    {
      name: 'EP17A II',
      short: 'THE SWARM LEARNED FORMATIONS.',
      intro: 'The parasites now move in a pattern. The pattern is "towards you".',
      message: 'Weave, do not fight. There are a lot of them.',
      trap: 'swarm',
      signText: 'ALLERGY-FRIENDLY (LIES)',
    },
    {
      name: 'EP17A III',
      short: 'SOMETHING JUST HATCHED ABOVE YOU.',
      intro: 'The living ceiling occasionally sheds. Loudly, and downward.',
      message: 'The planet is shedding again. Try not to be underneath it.',
      trap: 'earthBlock',
      signText: 'CEILING FULLY DOMESTICATED',
    },
    {
      name: 'EP17A IV',
      short: 'A VERY LARGE PARASITE.',
      intro: 'One of the parasites grew up. It is now the size of the spaceship.',
      message: 'Board the ship. The big one does not count as a friend.',
      trap: 'swarm',
      signText: 'TOTALLY NORMAL WILDLIFE AHEAD',
      giant: true,
    },
  ],
  [
    {
      name: 'Actually Earth I',
      short: 'BLUE SKY. GRASS. SUSPICIOUS.',
      intro: 'At last, Earth. It looks normal, which is by far the most worrying thing.',
      message: 'Welcome home. Please ignore the ninja lawn service.',
      trap: 'earthBlock',
      signText: 'NORMAL EARTH LAWN',
    },
    {
      name: 'Actually Earth II',
      short: 'A VERY LOCAL BRIDGE.',
      intro: 'Somehow there is a suspicious bridge here too. Some things are universal.',
      message: 'Some habits, it turns out, are interplanetary.',
      trap: 'bridge',
      signText: 'COUNCIL-APPROVED FOOTBRIDGE',
    },
    {
      name: 'Actually Earth III',
      short: 'THE SKY IS FALLING (LOCALLY).',
      intro: 'The Empire has been redecorating. Loudly, and from above.',
      message: 'Home improvements continue. From directly overhead.',
      trap: 'earthBlock',
      signText: 'RENOVATIONS COMPLETE (LIES)',
    },
    {
      name: 'Actually Earth IV',
      short: 'THE PRAWN SUIT AWAITS.',
      intro: 'The last stretch of Earth, then the Japanese Empire in a big prawn suit.',
      message: 'Reach the arena. Then fire kangaroos at the prawn.',
      trap: 'earthBlock',
      signText: 'PRAWN SUIT AHEAD. NO REFUNDS.',
      giant: true,
      finalBoss: true,
    },
  ],
]

const TRAP_SIGN_DEFAULT = {
  bridge: 'ABSOLUTELY SAFE BRIDGE',
  icicles: 'ICICLE-FREE ZONE',
  fire: 'LAVA: LOCALLY SOURCED',
  swarm: 'PARASITE QUIET AREA',
  earthBlock: 'NORMAL EARTH LAWN',
}

const TRAP_HAZARD_MESSAGE = {
  bridge: 'The bridge has entered early retirement.',
  icicles: 'Cold, sharp, and surprisingly punctual.',
  fire: 'Literal fire monster. Metaphors unavailable.',
  swarm: 'The swarm has voted to bite.',
  earthBlock: 'The scenery has become interactive.',
}

const BOSS_ARENA_WIDTH = 1900

function buildLevel(worldIndex, levelIndex, globalIndex) {
  const world = WORLDS[worldIndex]
  const text = LEVEL_TEXT[worldIndex][levelIndex]
  const [baseWidth, gapCount, gapWidth, enemyCount] = SIZE_BY_INDEX[levelIndex]
  const finalBoss = text.finalBoss === true
  const platformWidth = finalBoss ? Math.round(baseWidth * 0.82) : baseWidth
  const width = finalBoss ? platformWidth + BOSS_ARENA_WIDTH : baseWidth

  const gaps = spreadGaps(platformWidth, gapCount, gapWidth, START_MARGIN, END_MARGIN)
  const checkpoints = [
    150,
    placeOnSolid(gaps, platformWidth * 0.42, platformWidth),
    placeOnSolid(gaps, platformWidth * 0.74, platformWidth),
  ]
  const exitX = finalBoss ? null : Math.round(width - 190)
  const platforms = platformsForGaps(gaps)
  const enemies = enemyPositions(gaps, platformWidth, enemyCount)

  const jokeType = JOKE_CYCLE[globalIndex % JOKE_CYCLE.length]
  const jokeX = placeOnSolid(
    gaps,
    platformWidth * (jokeType === 'runaway' ? 0.35 : 0.62),
    platformWidth
  )
  if (jokeType === 'legPlatform' && platforms.length) {
    platforms[0].legs = true
  }

  return {
    id: `${worldIndex + 1}-${levelIndex + 1}`,
    number: `${worldIndex + 1}—${levelIndex + 1}`,
    world: world.id,
    worldName: world.name,
    worldIndex,
    levelIndex,
    isWorldFinale: levelIndex === SIZE_BY_INDEX.length - 1,
    name: text.name,
    short: text.short,
    intro: text.intro,
    message: text.message,
    sky: world.sky,
    ground: world.ground,
    soil: world.soil,
    accent: world.accent,
    sun: world.sun,
    gravity: world.gravity,
    friction: world.friction,
    enemyTint: world.enemyTint,
    giantTint: world.giantTint,
    width,
    platformWidth,
    gaps,
    checkpoints,
    exitX,
    platforms,
    enemies,
    trap: text.trap,
    signText: text.signText || TRAP_SIGN_DEFAULT[text.trap],
    hazardMessage: TRAP_HAZARD_MESSAGE[text.trap],
    giant: text.giant === true,
    giantX: text.giant ? placeOnSolid(gaps, platformWidth * 0.85, platformWidth, 140) : null,
    finalBoss,
    joke:
      jokeType === 'fakeFlag'
        ? { type: 'fakeFlag', x: jokeX }
        : jokeType === 'runaway'
          ? { type: 'runaway', x: jokeX }
          : { type: 'legPlatform' },
    bossX: finalBoss ? platformWidth + Math.round(BOSS_ARENA_WIDTH * 0.55) : null,
    bossMaxHealth: finalBoss ? 16 : 0,
  }
}

export const CAMPAIGN_LEVELS = WORLDS.flatMap((_, worldIndex) =>
  LEVEL_TEXT[worldIndex].map((_, levelIndex) =>
    buildLevel(worldIndex, levelIndex, worldIndex * 4 + levelIndex)
  )
)

export const LEVEL_BY_ID = Object.fromEntries(
  CAMPAIGN_LEVELS.map((level) => [level.id, level])
)

export const LEVEL_ORDER = CAMPAIGN_LEVELS.map((level) => level.id)

export const DEFAULT_LEVEL = LEVEL_ORDER[0]

export function nextLevelId(id) {
  const index = LEVEL_ORDER.indexOf(id)
  if (index === -1 || index === LEVEL_ORDER.length - 1) return null
  return LEVEL_ORDER[index + 1]
}

export const WORLD_LIST = WORLDS.map((world) => ({
  id: world.id,
  name: world.name,
  levels: CAMPAIGN_LEVELS.filter((level) => level.world === world.id),
}))
