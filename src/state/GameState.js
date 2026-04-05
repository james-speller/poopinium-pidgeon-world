import { GAME_RULES } from '../constants/gameConstants.js'
import { getLesson } from '../data/lessonPlan.js'
import { pickOne } from '../utils/random.js'

export class GameState {
  constructor() {
    this.reset()
  }

  reset() {
    this.level = 1
    this.score = 0
    this.lives = GAME_RULES.maxLives
    this.streak = 0
    this.collected = 0
    this.assignLesson()
  }

  assignLesson() {
    this.lesson = getLesson(this.level)
    this.targetValue = pickOne(this.lesson.targets)
    this.tip = this.lesson.tip
  }

  snapshot(extra = {}) {
    return {
      level: this.level,
      score: this.score,
      lives: this.lives,
      streak: this.streak,
      collected: this.collected,
      goal: GAME_RULES.goalPerLevel,
      target: this.targetValue,
      label: this.lesson.label,
      tip: this.tip,
      ...extra
    }
  }

  recordCorrect() {
    this.streak += 1
    this.collected += 1
    this.score += 10 + this.streak * 2
    const completed = this.collected >= GAME_RULES.goalPerLevel
    if (!completed) {
      this.targetValue = pickOne(this.lesson.targets)
    }
    return completed
  }

  recordIncorrect() {
    this.streak = 0
    this.lives -= 1
    return this.lives <= 0
  }

  advanceLevel() {
    this.level += 1
    this.collected = 0
    this.streak = 0
    this.assignLesson()
  }
}
