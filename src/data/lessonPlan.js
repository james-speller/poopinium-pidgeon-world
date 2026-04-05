export const lessonPlan = [
  {
    level: 1,
    label: 'Counting Flock',
    targets: [1, 2, 3, 4],
    distractors: [5, 6, 7],
    spawnDelay: 1400,
    hawkDelay: 3200,
    fallSpeed: { min: 95, max: 130 },
    tip: 'Collect numbers less than five.'
  },
  {
    level: 2,
    label: 'Even Glide',
    targets: [2, 4, 6, 8],
    distractors: [3, 5, 7, 9],
    spawnDelay: 1200,
    hawkDelay: 3000,
    fallSpeed: { min: 120, max: 160 },
    tip: 'Only even numbered seeds count.'
  },
  {
    level: 3,
    label: 'Tidy Tens',
    targets: [10, 20, 30, 40],
    distractors: [5, 15, 25, 35],
    spawnDelay: 1000,
    hawkDelay: 2600,
    fallSpeed: { min: 140, max: 190 },
    tip: 'Focus on multiples of ten.'
  }
]

export const maxLessonLevel = lessonPlan.length

export const getLesson = (level = 1) => {
  const normalized = ((level - 1) % lessonPlan.length + lessonPlan.length) % lessonPlan.length
  return lessonPlan[normalized]
}
