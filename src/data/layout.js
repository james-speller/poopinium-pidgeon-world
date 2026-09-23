// Deterministic level-layout helpers shared by campaign data and its tests.
// Keeping placement generative (rather than hand-typed per level) guarantees
// checkpoints, exits, enemies, and platforms never land inside a gap.

export function isSolid(gaps, x, margin = 40) {
  return !gaps.some(([a, b]) => x + margin > a && x - margin < b)
}

export function placeOnSolid(gaps, want, width, margin = 45) {
  const clamped = Math.min(Math.max(want, 70), width - 70)
  for (let step = 0; step <= width; step += 15) {
    for (const x of [clamped + step, clamped - step]) {
      if (x < 70 || x > width - 70) continue
      if (isSolid(gaps, x, margin)) return Math.round(x)
    }
  }
  return Math.round(width - 90)
}

export function spreadGaps(width, count, gapWidth, startMargin, endMargin) {
  if (count === 0) return []
  const span = width - startMargin - endMargin
  const step = span / (count + 1)
  const gaps = []
  for (let i = 1; i <= count; i++) {
    const center = startMargin + step * i
    gaps.push([Math.round(center - gapWidth / 2), Math.round(center + gapWidth / 2)])
  }
  return gaps
}

export function enemyPositions(gaps, width, count) {
  const list = []
  for (let i = 0; i < count; i++) {
    const want = width * (0.15 + (0.72 * i) / Math.max(1, count - 1))
    const x = placeOnSolid(gaps, want, width, 70)
    list.push({ x, min: x - 130, max: x + 130 })
  }
  return list
}

export function platformsForGaps(gaps) {
  return gaps.map(([a, b], i) => ({
    x: Math.round((a + b) / 2),
    y: 330 + (i % 3) * 35,
    width: 150,
  }))
}
