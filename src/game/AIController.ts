import type { Player } from './Player'
import type { Ball } from './Ball'
import type { Field } from './Field'
import type { Goal } from '../types'

export interface AIInput {
  vx: number
  vy: number
  kick: boolean
}

export class AIController {
  private kickCooldown: number = 0
  private decisionTimer: number = 0
  private targetX: number = 0
  private targetY: number = 0
  private shouldKick: boolean = false
  private difficulty: number // 0.5 ~ 1.0，越高越强

  constructor(difficulty: number = 0.75) {
    this.difficulty = difficulty
  }

  update(dt: number, player: Player, ball: Ball, field: Field, ownGoal: Goal, opponentGoal: Goal): AIInput {
    // 冷却计时
    if (this.kickCooldown > 0) this.kickCooldown -= dt * 16.67

    // 每隔一小段时间做一次决策（模拟反应延迟）
    this.decisionTimer -= dt
    if (this.decisionTimer <= 0) {
      this.decisionTimer = 0.15 + (1 - this.difficulty) * 0.2 // 反应时间
      this.makeDecision(player, ball, field, ownGoal, opponentGoal)
    }

    // 朝目标移动
    const dx = this.targetX - player.x
    const dy = this.targetY - player.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    let vx = 0
    let vy = 0

    if (dist > 5) {
      const speed = this.difficulty * 0.9 + 0.1 // 速度系数
      vx = (dx / dist) * speed
      vy = (dy / dist) * speed
    }

    // 踢球判断
    const kick = this.shouldKick && this.kickCooldown <= 0
    if (kick) {
      this.kickCooldown = 300
      this.shouldKick = false
    }

    return { vx, vy, kick }
  }

  private makeDecision(player: Player, ball: Ball, field: Field, ownGoal: Goal, opponentGoal: Goal): void {
    const ballDist = this.dist(player.x, player.y, ball.x, ball.y)
    const kickRange = player.radius + ball.radius + 15

    // 球在脚下 → 朝对方球门踢
    if (ballDist < kickRange) {
      this.shouldKick = true
      // 朝对方球门方向移动
      const goalCenterX = opponentGoal.x + opponentGoal.width / 2
      const goalCenterY = opponentGoal.y + opponentGoal.height / 2
      this.targetX = goalCenterX
      this.targetY = goalCenterY
      return
    }

    // 判断球是否朝自己球门飞来
    const ballToGoalDx = ownGoal.x + ownGoal.width / 2 - ball.x
    const ballToGoalDy = ownGoal.y + ownGoal.height / 2 - ball.y
    const ballMovingToGoal = (ball.vx * ballToGoalDx + ball.vy * ballToGoalDy) > 0

    // 球飞向自己球门 → 回防
    if (ballMovingToGoal && this.dist(ball.x, ball.y, ownGoal.x + ownGoal.width / 2, ownGoal.y + ownGoal.height / 2) < field.width * 0.4) {
      // 回到球门前防守
      const defenseX = ownGoal.x + ownGoal.width + player.radius * 2
      const defenseY = ownGoal.y + ownGoal.height / 2
      this.targetX = defenseX
      this.targetY = defenseY + (ball.y - defenseY) * 0.5 // 跟踪球的Y位置
      this.shouldKick = false
      return
    }

    // 球在对方半场 → 压上
    const fieldCenterX = field.x + field.width / 2
    const isBallInOpponentHalf = (opponentGoal.x < fieldCenterX && ball.x > fieldCenterX) ||
                                  (opponentGoal.x > fieldCenterX && ball.x < fieldCenterX)

    if (isBallInOpponentHalf && ballDist > field.width * 0.3) {
      // 球在对方半场且较远，压上到中场附近
      this.targetX = fieldCenterX + (opponentGoal.x < fieldCenterX ? -field.width * 0.15 : field.width * 0.15)
      this.targetY = ball.y
      this.shouldKick = false
      return
    }

    // 默认：追球
    this.targetX = ball.x
    this.targetY = ball.y
    this.shouldKick = false
  }

  private dist(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1
    const dy = y2 - y1
    return Math.sqrt(dx * dx + dy * dy)
  }
}
