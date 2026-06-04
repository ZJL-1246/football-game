import type { Score, Team } from '../types'
import { GAME_PARAMS } from './constants'

export class ScoreManager {
  score: Score
  winScore: number
  winningTeam: Team | null

  constructor(winScore: number = GAME_PARAMS.defaultWinScore) {
    this.score = { red: 0, blue: 0 }
    this.winScore = winScore
    this.winningTeam = null
  }

  addGoal(team: Team): void {
    if (team === 'red') {
      this.score.red++
    } else {
      this.score.blue++
    }
    this.checkWin()
  }

  private checkWin(): void {
    if (this.score.red >= this.winScore) {
      this.winningTeam = 'red'
    } else if (this.score.blue >= this.winScore) {
      this.winningTeam = 'blue'
    }
  }

  isGameOver(): boolean {
    return this.winningTeam !== null
  }

  getWinner(): Team | null {
    return this.winningTeam
  }

  getScoreText(): string {
    return `${this.score.red} : ${this.score.blue}`
  }

  setWinScore(score: number): void {
    this.winScore = score
    this.checkWin()
  }

  reset(): void {
    this.score = { red: 0, blue: 0 }
    this.winningTeam = null
  }
}
