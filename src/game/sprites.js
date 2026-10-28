// Original code-drawn pixel placeholders. Replace with production sprite sheets after playtesting.
const palette = {
  '.': null,
  k: 0x182333,
  g: 0x86939f,
  l: 0xc2ced4,
  d: 0x53616e,
  p: 0x775b91,
  t: 0x419488,
  o: 0xf0aa55,
  w: 0xf4efe1,
  r: 0xd96565,
  b: 0x29364c,
  n: 0x626fc6,
  a: 0xb77946,
  y: 0xffd477,
  Y: 0xf9dc4a,
  O: 0xd9a920,
  N: 0x6b4a1a,
  h: 0x9fd8ee,
  H: 0xf4fbff,
  K: 0x101018,
}

export function makePixelTexture(scene, key, rows, scale = 2) {
  const gfx = scene.make.graphics({ x: 0, y: 0, add: false })
  rows.forEach((row, y) =>
    [...row].forEach((pixel, x) => {
      if (palette[pixel] != null)
        gfx.fillStyle(palette[pixel]).fillRect(x * scale, y * scale, scale, scale)
    })
  )
  gfx.generateTexture(
    key,
    Math.max(...rows.map((r) => r.length)) * scale,
    rows.length * scale
  )
  gfx.destroy()
}

// Outfits for the pigeon. `remap` recolours existing pixels in a band of rows, `edits`
// are [row, column, pixel] overlays applied afterwards. Applied to both flap frames.
const row = (y, from, to, pixel) =>
  Array.from({ length: to - from + 1 }, (_, i) => [y, from + i, pixel])
const COSTUMES = {
  // Banana World: a black tuxedo, white shirt front, red bow tie and a tiny top hat.
  tux: {
    remap: [{ rows: [7, 12], map: { g: 'K', d: 'K', l: 'K' } }],
    edits: [
      ...row(0, 9, 12, 'K'),
      ...row(1, 8, 13, 'K'),
      ...['r', 'r', 'k', 'r', 'r'].map((pixel, i) => [6, 7 + i, pixel]),
      ...[7, 8, 9, 10].flatMap((y) => [
        [y, 10, 'w'],
        [y, 11, 'w'],
      ]),
    ],
  },
  // Venus: a white space suit with a glass helmet, orange collar and chest strip, and boots.
  space: {
    remap: [
      { rows: [7, 12], map: { g: 'w', l: 'w', d: 'l' } },
      { rows: [13, 15], map: { r: 'w' } },
    ],
    edits: [
      ...row(0, 8, 13, 'h'),
      [0, 9, 'H'],
      [1, 7, 'h'],
      [1, 8, 'h'],
      [1, 13, 'h'],
      [1, 14, 'h'],
      ...[2, 3].flatMap((y) => [
        [y, 7, 'h'],
        [y, 14, 'h'],
      ]),
      [4, 7, 'h'],
      [4, 15, 'h'],
      [5, 13, 'h'],
      [5, 14, 'h'],
      ...row(6, 7, 12, 'o'),
      ...row(9, 4, 8, 'o'),
      [8, 0, 'l'],
    ],
  },
}

function dress(rows, { remap, edits }) {
  const grid = rows.map((line) => [...line])
  for (const { rows: [first, last], map } of remap)
    for (let y = first; y <= last; y++)
      grid[y].forEach((pixel, x) => {
        if (map[pixel]) grid[y][x] = map[pixel]
      })
  for (const [y, x, pixel] of edits) grid[y][x] = pixel
  return grid.map((line) => line.join(''))
}

export function createSprites(scene) {
  const pigeon = [
    '................',
    '.........kkkk...',
    '........kgglgk..',
    '........kglwkk..',
    '........kgggkoo.',
    '.......ktttgk...',
    '...kkkkppttgk...',
    '..kgggggggggk...',
    '.kdggddddgggk...',
    'kkdgdddddlggk...',
    'kddgdddddlggk...',
    '.kkggggggggk....',
    '...kkggggkk.....',
    '.....krrk.......',
    '.....r..r.......',
    '....rr..rr......',
  ]
  const pigeonFlap = pigeon.map((r, i) =>
    i >= 6 && i <= 10
      ? [
          '..kkk..kpttgk...',
          '.klllkggggggk...',
          'kllldkdddgggk...',
          '.klldkdddlggk...',
          '..kkgddddlggk...',
        ][i - 6]
      : r
  )
  makePixelTexture(scene, 'pigeon', pigeon)
  makePixelTexture(scene, 'pigeon-flap', pigeonFlap)
  for (const [name, costume] of Object.entries(COSTUMES)) {
    makePixelTexture(scene, `pigeon-${name}`, dress(pigeon, costume))
    makePixelTexture(scene, `pigeon-${name}-flap`, dress(pigeonFlap, costume))
  }
  makePixelTexture(scene, 'roo', [
    '.......a.a..',
    '.......a.a..',
    '......kaaak.',
    '......kawak.',
    '.......aaao.',
    '......kaa...',
    '.....kaaa...',
    '....kaaaa...',
    '..a.kaaaa...',
    '.aa.kaaaa...',
    'aaa..a.aa...',
    'aa..aa..aa..',
    '...aaa..aaa.',
  ])
  makePixelTexture(scene, 'ninja', [
    '....kkkk....',
    '...kbbbbk...',
    '...kwwwrk...',
    '...kbbbbkrr.',
    '....kkkk....',
    '..kkbbbbkk..',
    '.kbbbnnbbbk.',
    '..kkbnnbkk..',
    '...kbbbbk...',
    '...kkkkkk...',
    '...kb..bk...',
    '..kkb..bkk..',
  ])
  makePixelTexture(
    scene,
    'giant',
    [
      '....pp......pp....',
      '...pppp....pppp...',
      '..pppppppppppppp..',
      '.pppwwppppppwwppp.',
      'ppppwkppppppkwpppp',
      'pppppppppppppppppp',
      'pppppppppppppppppp',
      '.pppkkkkkkkkppppp.',
      '..ppwkwkwkwkpppp..',
      '..pppppppppppppp..',
      '...ppp..ppp..ppp..',
      '..ppp..ppp..ppp...',
    ],
    7
  )
  makePixelTexture(
    scene,
    'ship',
    [
      '..........ll..........',
      '.........llll.........',
      '........llwwll........',
      '.......lllwwlll.......',
      '......llllwwllll......',
      '.....lllllbblllll.....',
      '....lllllbbbblllll....',
      '...llllllbbbbllllll...',
      '..llllllllllllllllll..',
      '.gggggggggggggggggggg.',
      'gggggggttttttggggggggg',
      '...kkk..oooo..kkk.....',
      '...kk...oyyo...kk.....',
      '..kk....oyyo....kk....',
    ],
    4
  )
  makePixelTexture(scene, 'banana', [
    '................',
    'NN............NN',
    'YY............YY',
    'YYY..........YYY',
    'OYYY........YYYO',
    '.OYYkYYYYYYkYYO.',
    '..OOYYYYYYYYOO..',
    '....OOOOOOOO....',
  ])
  const gfx = scene.make.graphics({ x: 0, y: 0, add: false })
  gfx.fillStyle(0x233e32).fillRect(0, 0, 32, 32)
  gfx.fillStyle(0x8ada65).fillRect(0, 0, 32, 6)
  gfx.fillStyle(0x43874d).fillRect(0, 6, 32, 5)
  gfx.fillStyle(0x42634a).fillRect(4, 17, 5, 4).fillRect(20, 26, 7, 3)
  gfx.generateTexture('ground', 32, 32)
  gfx.clear().fillStyle(0xffd477).fillRect(0, 0, 48, 20)
  gfx.fillStyle(0xb77946).fillRect(4, 12, 40, 4)
  gfx.generateTexture('bridge', 48, 20)
  gfx.clear().fillStyle(0x929cad).fillRect(0, 0, 56, 44)
  gfx.fillStyle(0x53616e).fillRect(4, 4, 48, 8).fillRect(24, 12, 8, 30)
  gfx.generateTexture('block', 56, 44)
  gfx.clear().fillStyle(0xff8e79).fillEllipse(70, 55, 118, 72)
  gfx.fillStyle(0xe35e65).fillRect(22, 30, 96, 12)
  gfx.fillStyle(0xffd6bd).fillCircle(92, 46, 11)
  gfx.fillStyle(0x172333).fillCircle(95, 45, 4)
  gfx.fillStyle(0xbec9ce).fillRect(42, 49, 48, 34)
  gfx.fillStyle(0x5b3345).fillRect(18, 79, 24, 9).fillRect(96, 79, 25, 9)
  gfx.fillStyle(0xff8e79).fillTriangle(8, 38, 30, 47, 20, 65)
  gfx.generateTexture('prawn-boss', 140, 100)
  gfx.clear().fillStyle(0xf7f1dc).fillTriangle(0, 0, 28, 0, 14, 38)
  gfx.fillStyle(0x8ddbf3).fillTriangle(6, 4, 22, 4, 14, 29)
  gfx.generateTexture('icicle', 28, 38)
  gfx.clear().fillStyle(0xff7a31).fillCircle(16, 16, 15)
  gfx.fillStyle(0xffd353).fillCircle(12, 11, 7)
  gfx.generateTexture('fireball', 32, 32)
  gfx.clear().fillStyle(0xdb71ed).fillCircle(16, 16, 15)
  gfx.fillStyle(0x53285f).fillCircle(11, 12, 4).fillCircle(21, 12, 4)
  gfx.fillRect(8, 21, 16, 4)
  gfx.generateTexture('parasite', 32, 32)
  gfx.clear().fillStyle(0xcad3d7).fillCircle(10, 10, 9)
  gfx.fillStyle(0xff6074).fillCircle(10, 10, 4)
  gfx.generateTexture('boss-shot', 20, 20)
  gfx.clear().fillStyle(0xb77946).fillCircle(9, 9, 8)
  gfx.fillStyle(0xffd477).fillCircle(6, 6, 3)
  gfx.generateTexture('crumb', 18, 18)
  gfx.clear().fillStyle(0xe35e65).fillRect(0, 0, 5, 48)
  gfx.fillStyle(0xffd477).fillTriangle(5, 4, 5, 26, 38, 15)
  gfx.generateTexture('fake-flag', 40, 48)
  drawVenera(gfx, 'venera', 1)
  drawVenera(gfx, 'venera-giant', 2.9)
  drawVenusParasite(gfx)
  drawVenera1(gfx)
  drawVenera7(gfx)
  drawVenera9(gfx)
  drawVenera3(gfx)
  drawVenera6(gfx)
  drawVenera8(gfx)
  drawVenera10(gfx)
  drawVenera13(gfx)
  drawVenera15(gfx)
  drawVega(gfx)
  drawVenera14(gfx)
  drawVenera12(gfx)
  drawVenera2(gfx)
  gfx.clear().fillStyle(0x8f9d2a)
  gfx.fillTriangle(7, 0, 0, 11, 14, 11)
  gfx.fillCircle(7, 12, 7)
  gfx.fillStyle(0xd8e86a)
  gfx.fillCircle(5, 11, 2.4)
  gfx.generateTexture('venera-bomb', 14, 19)
  gfx.clear().fillStyle(0x6b4a1a)
  gfx.fillEllipse(20, 20, 40, 22)
  gfx.fillStyle(0x8a6330)
  gfx.fillEllipse(19, 18, 34, 16)
  gfx.fillStyle(0x4a3212)
  gfx.fillCircle(8, 17, 2)
  gfx.fillCircle(31, 16, 2.4)
  gfx.fillStyle(0xcfd6db)
  gfx.fillTriangle(20, 0, 16, 12, 24, 12)
  gfx.generateTexture('dirt-mound', 40, 22)
  gfx.clear().lineStyle(3, 0x7fe3ff).strokeCircle(9, 9, 7)
  gfx.fillStyle(0xbff4ff, 0.85).fillCircle(9, 9, 3.2)
  gfx.generateTexture('radar-pulse', 18, 18)
  gfx.destroy()
}

// Vega 1 (1985): a silver balloon carrying a gondola into the Venus clouds. It drifts
// high up and drops acid bombs on the pigeon below.
function drawVega(gfx) {
  gfx.clear()
  gfx.lineStyle(1.5, 0xe4ecf0)
  for (const [x1, y1, x2, y2] of [
    [14, 40, 22, 55],
    [42, 40, 34, 55],
    [28, 48, 28, 55],
  ]) {
    gfx.beginPath()
    gfx.moveTo(x1, y1)
    gfx.lineTo(x2, y2)
    gfx.strokePath()
  }
  gfx.fillStyle(0x6e7c88)
  gfx.fillCircle(28, 24, 24)
  gfx.fillStyle(0xdfe6ea)
  gfx.fillCircle(27, 23, 22.5)
  gfx.fillStyle(0xffffff)
  gfx.fillEllipse(18, 14, 14, 8)
  gfx.lineStyle(1.5, 0x9aa7b1)
  gfx.strokeEllipse(28, 24, 24, 44)
  gfx.strokeEllipse(28, 24, 6, 44)
  redStar(gfx, 28, 26, 7)
  gfx.fillStyle(0x3b444d)
  gfx.fillRoundedRect(17, 54, 22, 12, 3)
  gfx.fillStyle(0x8693a0)
  gfx.fillRoundedRect(18, 55, 20, 8, 2)
  gfx.fillStyle(0x2a2f36)
  gfx.fillRect(27, 66, 2, 3)
  gfx.generateTexture('vega', 56, 70)
}

// Venera 14 (1982): carries a thick curved shield plate on its front that blocks
// kangaroos. Go round the back, or slam it.
function drawVenera14(gfx) {
  gfx.clear()
  gfx.fillStyle(0x2a2f36)
  gfx.fillRect(15, 0, 2, 10)
  gfx.fillCircle(16, 1.5, 2.4)
  gfx.fillStyle(0x3b444d)
  gfx.fillRect(10, 44, 8, 6)
  gfx.fillRect(24, 44, 8, 6)
  gfx.fillStyle(0x56626d)
  gfx.fillCircle(20, 28, 17)
  gfx.fillStyle(0xb9c5cf)
  gfx.fillCircle(19, 27, 15.5)
  gfx.fillStyle(0xe4ecf0)
  gfx.fillCircle(14, 21, 4)
  redStar(gfx, 17, 31, 5)
  gfx.fillStyle(0x2f3a44)
  gfx.fillEllipse(38, 28, 22, 44)
  gfx.fillStyle(0x6b7884)
  gfx.fillEllipse(37, 28, 16, 38)
  gfx.fillStyle(0x44505a)
  gfx.fillEllipse(36, 28, 8, 28)
  gfx.fillStyle(0xf0aa55)
  for (const y of [14, 24, 34]) gfx.fillRect(34, y, 8, 3)
  gfx.fillStyle(0x2a2f36)
  for (const y of [10, 46]) gfx.fillCircle(38, y, 1.6)
  gfx.generateTexture('venera14', 52, 50)
}

// Venera 12 (1978): a lander with a big soil drill. It starts buried in the ground (only a
// little mound with the drill tip showing) and erupts when you walk past.
function drawVenera12(gfx) {
  gfx.clear()
  gfx.fillStyle(0x2a2f36)
  gfx.fillRect(24, 4, 4, 16)
  gfx.fillStyle(0xcfd6db)
  for (const [y, half] of [
    [0, 3],
    [5, 5],
    [10, 7],
    [15, 9],
  ])
    gfx.fillTriangle(26 - half, y + 5, 26 + half, y + 5, 26, y)
  gfx.fillStyle(0x3b444d)
  gfx.fillRoundedRect(2, 40, 48, 10, 5)
  gfx.fillStyle(0x6b7884)
  for (const x of [10, 26, 42]) gfx.fillCircle(x, 45, 3.2)
  gfx.fillStyle(0x7a4f24)
  gfx.fillRoundedRect(6, 18, 40, 24, 5)
  gfx.fillStyle(0xb0763a)
  gfx.fillRoundedRect(8, 20, 36, 20, 4)
  gfx.fillStyle(0xd9a05a)
  gfx.fillRect(10, 21, 32, 3)
  gfx.fillStyle(0xcfd8de)
  gfx.fillEllipse(14, 18, 10, 8)
  gfx.fillStyle(0x23303a)
  gfx.fillCircle(15, 18, 2.4)
  redStar(gfx, 30, 31, 5)
  gfx.generateTexture('venera12', 52, 52)
}

// Venera 2 (1966): the flyby probe. A long, sleek craft with swept solar panels and a
// nose cone. It strafes back and forth at head height, very fast.
function drawVenera2(gfx) {
  gfx.clear()
  gfx.fillStyle(0xffc04d)
  gfx.fillTriangle(0, 18, 8, 13, 8, 23)
  gfx.fillStyle(0x28458a)
  gfx.fillRect(8, 1, 34, 8)
  gfx.fillRect(8, 29, 34, 8)
  gfx.fillStyle(0x6f93d6)
  for (const x of [9, 18, 27, 36]) {
    gfx.fillRect(x, 2, 7, 6)
    gfx.fillRect(x, 30, 7, 6)
  }
  gfx.fillStyle(0x4a5560)
  gfx.fillRect(22, 9, 3, 4)
  gfx.fillRect(22, 23, 3, 4)
  gfx.fillStyle(0x56626d)
  gfx.fillRoundedRect(8, 10, 44, 16, 7)
  gfx.fillStyle(0xb9c5cf)
  gfx.fillRoundedRect(9, 11, 42, 13, 6)
  gfx.fillStyle(0xe4ecf0)
  gfx.fillEllipse(24, 14, 18, 4)
  gfx.fillStyle(0xe0702a)
  gfx.fillTriangle(50, 10, 50, 26, 63, 18)
  gfx.fillStyle(0xffb070)
  gfx.fillTriangle(50, 10, 50, 18, 63, 18)
  redStar(gfx, 32, 19, 4.8)
  gfx.generateTexture('venera2', 64, 38)
}

// Venera 3 (1965): the first craft to hit another planet. A bullet-shaped capsule with a
// pointed nose and tail fins. It charges.
function drawVenera3(gfx) {
  gfx.clear()
  gfx.fillStyle(0x3b444d)
  gfx.fillTriangle(8, 26, 0, 10, 16, 16)
  gfx.fillTriangle(8, 26, 0, 42, 16, 36)
  gfx.fillStyle(0x56626d)
  gfx.fillEllipse(24, 27, 38, 26)
  gfx.fillStyle(0xb9c5cf)
  gfx.fillEllipse(23, 26, 35, 22)
  gfx.fillStyle(0xe4ecf0)
  gfx.fillEllipse(17, 19, 12, 5)
  gfx.fillStyle(0xe0702a)
  gfx.fillTriangle(40, 15, 40, 39, 50, 27)
  gfx.fillStyle(0xffb070)
  gfx.fillTriangle(40, 15, 40, 27, 50, 27)
  gfx.fillStyle(0x2a2f36)
  gfx.fillRect(23, 0, 2, 7)
  gfx.fillStyle(0x28458a)
  gfx.fillRect(12, 6, 24, 5)
  gfx.fillStyle(0x6f93d6)
  for (const x of [13, 21, 29]) gfx.fillRect(x, 7, 6, 3)
  redStar(gfx, 22, 27, 5)
  gfx.fillStyle(0x3b444d)
  gfx.fillRect(14, 39, 6, 5)
  gfx.fillRect(28, 39, 6, 5)
  gfx.generateTexture('venera3', 50, 44)
}

// Venera 6 (1969): a descent capsule under an orange-and-white parachute. It floats.
function drawVenera6(gfx) {
  gfx.clear()
  gfx.lineStyle(1.5, 0xe4ecf0)
  for (const [x1, y1, x2, y2] of [
    [5, 18, 21, 34],
    [47, 18, 31, 34],
    [26, 22, 26, 31],
    [16, 21, 23, 33],
    [36, 21, 29, 33],
  ]) {
    gfx.beginPath()
    gfx.moveTo(x1, y1)
    gfx.lineTo(x2, y2)
    gfx.strokePath()
  }
  for (const [width, color] of [
    [50, 0xe4ecf0],
    [38, 0xf0aa55],
    [26, 0xe4ecf0],
    [14, 0xf0aa55],
    [5, 0xe4ecf0],
  ]) {
    gfx.fillStyle(color)
    gfx.fillEllipse(26, 13, width, 24)
  }
  gfx.fillStyle(0x56626d)
  gfx.fillCircle(26, 43, 12)
  gfx.fillStyle(0xb9c5cf)
  gfx.fillCircle(25, 42, 10.5)
  gfx.fillStyle(0xe4ecf0)
  gfx.fillCircle(21, 38, 3)
  redStar(gfx, 26, 46, 4.4)
  gfx.generateTexture('venera6', 52, 56)
}

// Venera 8 (1972): a golden dome on frog-like hind legs. It leaps.
function drawVenera8(gfx) {
  gfx.clear()
  gfx.fillStyle(0x3b444d)
  gfx.fillTriangle(10, 34, 22, 36, 3, 50)
  gfx.fillTriangle(36, 34, 24, 36, 43, 50)
  gfx.fillRect(0, 48, 10, 4)
  gfx.fillRect(36, 48, 10, 4)
  gfx.fillStyle(0x2a2f36)
  gfx.fillRect(20, 0, 2, 11)
  gfx.fillCircle(21, 1.5, 2.6)
  gfx.fillStyle(0x7a5d1e)
  gfx.fillEllipse(23, 28, 42, 36)
  gfx.fillStyle(0xcaa24a)
  gfx.fillEllipse(23, 27, 39, 33)
  gfx.fillStyle(0xf1d98a)
  gfx.fillEllipse(15, 17, 14, 7)
  gfx.fillStyle(0x7a5d1e)
  gfx.fillRect(5, 29, 36, 3)
  gfx.fillStyle(0x23303a)
  gfx.fillCircle(32, 21, 5)
  gfx.fillStyle(0xfff3a0)
  gfx.fillCircle(33.5, 19.5, 1.8)
  redStar(gfx, 21, 38, 4.6)
  gfx.generateTexture('venera8', 46, 52)
}

// Venera 10 (1975): the twin lander. Two spheres on a bar; when one is destroyed it
// splits into two mini robots.
function drawVenera10(gfx) {
  gfx.clear()
  gfx.fillStyle(0x2a2f36)
  gfx.fillRect(25, 2, 2, 14)
  gfx.fillStyle(0xe4ecf0)
  gfx.fillEllipse(26, 3, 18, 6)
  gfx.fillStyle(0x3b444d)
  gfx.fillRect(12, 26, 28, 5)
  gfx.fillRect(8, 41, 8, 5)
  gfx.fillRect(36, 41, 8, 5)
  for (const cx of [14, 38]) {
    gfx.fillStyle(0x4f6a66)
    gfx.fillCircle(cx, 29, 13)
    gfx.fillStyle(0xa8c8c0)
    gfx.fillCircle(cx - 1, 28, 11.5)
    gfx.fillStyle(0xe4ecf0)
    gfx.fillCircle(cx - 5, 23, 3.4)
    redStar(gfx, cx, 32, 4.2)
  }
  gfx.generateTexture('venera10', 52, 46)
}

// Venera 13 (1981): an armoured lander with camera domes and a soil-drill arm. Slow
// and takes three hits.
function drawVenera13(gfx) {
  gfx.clear()
  gfx.fillStyle(0x3b444d)
  gfx.fillRect(10, 42, 10, 6)
  gfx.fillRect(36, 42, 10, 6)
  gfx.fillStyle(0x2a2f36)
  gfx.fillRect(50, 26, 8, 4)
  gfx.fillStyle(0xd0d6da)
  gfx.fillTriangle(58, 23, 58, 33, 64, 28)
  gfx.fillStyle(0x44505a)
  gfx.fillRoundedRect(4, 16, 48, 28, 6)
  gfx.fillStyle(0x6b7884)
  gfx.fillRoundedRect(6, 18, 44, 24, 5)
  gfx.fillStyle(0xf0aa55)
  for (const x of [8, 16, 24, 32, 40])
    gfx.fillTriangle(x, 41, x + 4, 41, x + 8, 37)
  gfx.fillStyle(0x2a2f36)
  for (const [x, y] of [
    [9, 21],
    [47, 21],
    [9, 38],
    [47, 38],
  ])
    gfx.fillCircle(x, y, 1.4)
  for (const cx of [16, 40]) {
    gfx.fillStyle(0xcfd8de)
    gfx.fillEllipse(cx, 15, 14, 12)
    gfx.fillStyle(0x23303a)
    gfx.fillCircle(cx + 1, 15, 3)
  }
  redStar(gfx, 28, 30, 5.2)
  gfx.generateTexture('venera13', 64, 48)
}

// Venera 15 (1983): the radar orbiter, dish up front. It stays back and fires radar pulses.
function drawVenera15(gfx) {
  gfx.clear()
  gfx.fillStyle(0x4a5560)
  gfx.fillRect(13, 34, 5, 2)
  gfx.fillRect(38, 34, 5, 2)
  gfx.fillStyle(0x28458a)
  gfx.fillRect(0, 24, 13, 22)
  gfx.fillRect(43, 24, 13, 22)
  gfx.fillStyle(0x6f93d6)
  for (const y of [25, 32.5, 40]) {
    gfx.fillRect(1, y, 11, 5.5)
    gfx.fillRect(44, y, 11, 5.5)
  }
  gfx.fillStyle(0x56626d)
  gfx.fillRoundedRect(18, 22, 20, 26, 4)
  gfx.fillStyle(0xb9c5cf)
  gfx.fillRoundedRect(19, 23, 18, 24, 3)
  gfx.fillStyle(0x56626d)
  gfx.fillRect(19, 33, 18, 2)
  gfx.fillStyle(0x2a2f36)
  gfx.fillRect(27, 12, 2, 11)
  gfx.fillRect(38, 7, 9, 3)
  gfx.fillStyle(0xe4ecf0)
  gfx.fillEllipse(28, 9, 40, 16)
  gfx.fillStyle(0x8693a0)
  gfx.fillEllipse(28, 9, 30, 10)
  gfx.fillStyle(0x2a2f36)
  gfx.fillCircle(28, 9, 2.6)
  redStar(gfx, 28, 41, 4.6)
  gfx.fillStyle(0x3b444d)
  gfx.fillRect(20, 48, 6, 5)
  gfx.fillRect(30, 48, 6, 5)
  gfx.generateTexture('venera15', 56, 54)
}

function redStar(gfx, cx, cy, outer) {
  const points = []
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5
    const radius = i % 2 ? outer * 0.4 : outer
    points.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius })
  }
  gfx.fillStyle(0xd93a30)
  gfx.fillPoints(points, true)
}

// Venera 1 (1961): a tall cylinder with two big solar-panel wings and a dish on top.
// The fast, fragile scout.
function drawVenera1(gfx) {
  gfx.clear()
  gfx.fillStyle(0x4a5560)
  gfx.fillRect(14, 20, 4, 3)
  gfx.fillRect(32, 20, 4, 3)
  gfx.fillStyle(0x28458a)
  gfx.fillRect(0, 8, 14, 28)
  gfx.fillRect(36, 8, 14, 28)
  gfx.fillStyle(0x6f93d6)
  for (const y of [9, 17.5, 26]) {
    gfx.fillRect(1, y, 12, 7)
    gfx.fillRect(37, y, 12, 7)
  }
  gfx.fillStyle(0x56626d)
  gfx.fillRoundedRect(17, 10, 16, 30, 4)
  gfx.fillStyle(0xb9c5cf)
  gfx.fillRoundedRect(18, 11, 14, 28, 3)
  gfx.fillStyle(0x56626d)
  gfx.fillRect(18, 22, 14, 2)
  gfx.fillStyle(0x2a2f36)
  gfx.fillRect(24, 3, 2, 8)
  gfx.fillStyle(0xe4ecf0)
  gfx.fillEllipse(25, 4, 17, 6)
  redStar(gfx, 25, 31, 4.6)
  gfx.fillStyle(0x3b444d)
  gfx.fillRect(19, 40, 4, 5)
  gfx.fillRect(27, 40, 4, 5)
  gfx.generateTexture('venera1', 50, 46)
}

// Venera 7 (1970): the first probe to land on another planet. A conical capsule on
// springy legs, so this one hops.
function drawVenera7(gfx) {
  gfx.clear()
  gfx.lineStyle(3, 0x3b444d)
  for (const x of [10, 30]) {
    gfx.beginPath()
    gfx.moveTo(x, 34)
    gfx.lineTo(x + 4, 38)
    gfx.lineTo(x - 4, 41)
    gfx.lineTo(x + 4, 44)
    gfx.lineTo(x, 47)
    gfx.strokePath()
  }
  gfx.fillStyle(0x2a2f36)
  gfx.fillRect(19, 0, 2, 10)
  gfx.fillCircle(20, 1.5, 2.6)
  gfx.fillStyle(0xb9c5cf)
  gfx.fillTriangle(6, 33, 34, 33, 20, 8)
  gfx.fillStyle(0x8693a0)
  gfx.fillTriangle(20, 8, 34, 33, 20, 33)
  gfx.fillStyle(0xe4ecf0)
  gfx.fillTriangle(14, 22, 18, 14, 18, 22)
  gfx.fillStyle(0x56626d)
  gfx.fillRect(4, 31, 32, 5)
  gfx.lineStyle(2, 0x2a2f36)
  gfx.strokeTriangle(6, 33, 34, 33, 20, 8)
  redStar(gfx, 20, 25, 4.4)
  gfx.generateTexture('venera7', 40, 48)
}

// Venera 9 (1975): a heavy lander inside a wide aerodynamic-brake ring, with a camera
// dome. Slow, and takes two hits.
function drawVenera9(gfx) {
  gfx.clear()
  gfx.fillStyle(0x3b444d)
  gfx.fillRect(10, 38, 8, 6)
  gfx.fillRect(46, 38, 8, 6)
  gfx.fillRect(28, 39, 8, 5)
  gfx.fillStyle(0x2a2f36)
  gfx.fillRect(46, 3, 2, 13)
  gfx.fillStyle(0xe4ecf0)
  gfx.fillEllipse(47, 4, 11, 4)
  gfx.fillStyle(0x3b444d)
  gfx.fillEllipse(32, 29, 64, 26)
  gfx.fillStyle(0x8a98a4)
  gfx.fillEllipse(32, 27, 60, 20)
  gfx.fillStyle(0x56626d)
  gfx.fillEllipse(32, 27, 40, 12)
  gfx.fillStyle(0x3b444d)
  for (const x of [8, 16, 48, 56]) gfx.fillCircle(x, 28, 1.6)
  gfx.fillStyle(0x56626d)
  gfx.fillRect(22, 12, 20, 16)
  gfx.fillStyle(0xb9c5cf)
  gfx.fillRect(23, 13, 18, 14)
  gfx.fillStyle(0xe4ecf0)
  gfx.fillEllipse(32, 12, 18, 12)
  gfx.fillStyle(0x23303a)
  gfx.fillCircle(32, 12, 3.2)
  redStar(gfx, 32, 21, 4.4)
  gfx.generateTexture('venera9', 64, 44)
}

// A Venus parasite: a drifting sulphur-yellow cloud-jelly with a glowing green eye and
// dripping acid tendrils. Deliberately unlike the round purple parasites of EP17A.
function drawVenusParasite(gfx) {
  gfx.clear()
  gfx.fillStyle(0xfff0a0, 0.28)
  gfx.fillEllipse(22, 16, 44, 34)
  gfx.fillStyle(0xb98a1c)
  for (const [x, height] of [
    [9, 14],
    [16, 18],
    [24, 15],
    [31, 19],
  ]) {
    gfx.fillRect(x, 25, 3, height)
    gfx.fillStyle(0x7bd13a)
    gfx.fillCircle(x + 1.5, 25 + height + 2, 2.6)
    gfx.fillStyle(0xb98a1c)
  }
  gfx.fillStyle(0xe6bf3f)
  gfx.fillEllipse(22, 17, 36, 28)
  gfx.fillStyle(0xfff3b0)
  gfx.fillEllipse(17, 11, 17, 9)
  gfx.fillStyle(0xd98a1c)
  gfx.fillCircle(10, 21, 2.2)
  gfx.fillCircle(34, 22, 2.6)
  gfx.fillCircle(27, 8, 1.8)
  gfx.fillStyle(0x7bd13a)
  gfx.fillCircle(22, 18, 7)
  gfx.fillStyle(0xc7f58a)
  gfx.fillCircle(20, 16, 3)
  gfx.fillStyle(0x1c3a10)
  gfx.fillCircle(22, 19, 3.2)
  gfx.generateTexture('venus-parasite', 44, 46)
}

// A Venera robot, after the Soviet Venera 4 probe: a spherical descent capsule with a
// parachute-housing cap and whip antenna, flanked by the bus's solar-panel wings, with a
// red star on the front. Drawn at 48x52 and scaled by k.
function drawVenera(gfx, key, k) {
  const rect = (x, y, w, h) => gfx.fillRect(x * k, y * k, w * k, h * k)
  const circle = (x, y, radius) => gfx.fillCircle(x * k, y * k, radius * k)
  gfx.clear()
  // solar-panel wings and struts
  gfx.fillStyle(0x4a5560)
  rect(8, 31, 6, 2)
  rect(34, 31, 6, 2)
  gfx.fillStyle(0x28458a)
  rect(0, 22, 9, 18)
  rect(39, 22, 9, 18)
  gfx.fillStyle(0x6f93d6)
  for (const x of [1, 39.5])
    for (const y of [23, 28.5, 34]) rect(x, y, 7.5, 4.5)
  // whip antenna with a small dish
  gfx.fillStyle(0x2a2f36)
  rect(23, 1, 2, 11)
  gfx.fillStyle(0xd6dee3)
  gfx.fillEllipse(24 * k, 2 * k, 11 * k, 4 * k)
  // parachute-housing cap
  gfx.fillStyle(0x6d7a86)
  rect(15, 10, 18, 8)
  gfx.fillStyle(0xa3afb9)
  rect(15, 10, 18, 3)
  // the descent sphere
  gfx.fillStyle(0x56626d)
  circle(24, 33, 18)
  gfx.fillStyle(0xb9c5cf)
  circle(23, 32, 16.5)
  gfx.fillStyle(0xe4ecf0)
  circle(17, 25, 5)
  gfx.fillStyle(0x56626d)
  rect(8, 33, 32, 2)
  gfx.fillStyle(0x23303a)
  circle(32, 27, 3)
  gfx.lineStyle(2 * k, 0x2a2f36)
  gfx.strokeCircle(24 * k, 33 * k, 18 * k)
  // red star
  const star = []
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5
    const radius = i % 2 ? 2.6 : 6.5
    star.push({ x: (24 + Math.cos(angle) * radius) * k, y: (40 + Math.sin(angle) * radius) * k })
  }
  gfx.fillStyle(0xd93a30)
  gfx.fillPoints(star, true)
  // little feet
  gfx.fillStyle(0x3b444d)
  rect(12, 48, 8, 4)
  rect(28, 48, 8, 4)
  gfx.generateTexture(key, Math.round(48 * k), Math.round(52 * k))
}
