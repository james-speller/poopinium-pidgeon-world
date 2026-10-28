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

// The widest stretch of solid ground around x (up to `reach` each way) for roaming things.
export function patrolRange(gaps, x, reach, width, margin = 40) {
  let min = x
  let max = x
  while (x - min < reach && min - 10 > 60 && isSolid(gaps, min - 10, margin)) min -= 10
  while (max - x < reach && max + 10 < width - 60 && isSolid(gaps, max + 10, margin)) max += 10
  return [min, max]
}

// Bananas start well away from enemies (and each other) so they don't flatten a ninja
// before the player has even seen them; they meet later as everything roams.
export function bananaPositions(gaps, width, count, avoid = []) {
  const list = []
  for (let i = 0; i < count; i++) {
    const want = width * (0.2 + (0.66 * i) / Math.max(1, count - 1))
    let chosen = null
    for (const offset of [0, 140, -140, 280, -280, 420, -420]) {
      const x = placeOnSolid(gaps, want + offset, width, 100)
      const clear = [...avoid, ...list.map((banana) => banana.x)].every(
        (other) => Math.abs(other - x) >= 260
      )
      if (clear) {
        chosen = x
        break
      }
    }
    const x = chosen ?? placeOnSolid(gaps, want, width, 100)
    const [min, max] = patrolRange(gaps, x, 220, width)
    list.push({ x, min, max })
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
