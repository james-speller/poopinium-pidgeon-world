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
  makePixelTexture(scene, 'pigeon', pigeon)
  makePixelTexture(
    scene,
    'pigeon-flap',
    pigeon.map((r, i) =>
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
  )
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
  gfx.destroy()
}
