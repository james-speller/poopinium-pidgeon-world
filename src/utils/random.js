export const randomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export const chance = (value = 0.5) => Math.random() < value

export const pickOne = (items = []) => {
  if (!items.length) return undefined
  const index = randomInt(0, items.length - 1)
  return items[index]
}
