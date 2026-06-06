import type { Player } from './Player'
import type { Ball } from './Ball'
import type { Field } from './Field'
import type { Goal } from '../types'

export class AIController {
  private difficulty: number // 0-1, 越高越强
  private decisionTimer: number = 0
  private decisionInterval: number = 200 // 毫秒
  private targetX: number = 0
  private targetY: number = 0
  private kickTarget: { x: number; y: number } | null = null
  private wantsToKick: boolean = false

  constructor(difficulty: number = 0.7) {
    this.difficulty = Math.max(0, Math.min(1, difficulty))
    this.decisionInterval = 350 - this.difficulty * 200 // 150-350ms
  }

  update(
    dt: number,
    player: Player,
    ball: Ball,
    field: Field,
    ownGoal: Goal,
    targetGoal: Goal
  ): { vx: number; vy: number; kick: boolean; kickTarget: { x: number; y: number } | null } {
    this.decisionTimer += dt * 16.67

    if (this.decisionTimer >= this.decisionInterval) {
      this.decisionTimer = 0
      this.decide(player, ball, field, ownGoal, targetGoal)
      this.wantsToKick = this.shouldKick(player, ball)
    }

    // 朝目标移动
    const dx = this.targetX - player.x
    const dy = this.targetY - player.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    let vx = 0
    let vy = 0
    if (dist > 5) {
      vx = dx / dist
      vy = dy / dist
    }

    // 判断是否该踢球（仅在决策时刻判定，避免帧率依赖）
    const kick = this.wantsToKick
    this.wantsToKick = false // 消费掉踢球意图

    return { vx, vy, kick, kickTarget: this.kickTarget }
  }

  private decide(
    player: Player,
    ball: Ball,
    field: Field,
    ownGoal: Goal,
    targetGoal: Goal
  ): void {
    const ballDist = this.dist(player, ball)

    // 判断球是否在我方脚下（距离近 + 球速慢）
    const ballSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy)
    const hasBall = ballDist < player.radius + ball.radius + 10 && ballSpeed < 3

    const goalCenterY = targetGoal.y + targetGoal.height / 2
    const goalTop = targetGoal.y
    const goalBottom = targetGoal.y + targetGoal.height

    if (hasBall) {
      // 持球 → 朝对方球门推进
      const goalDist = Math.abs(player.x - targetGoal.x)
      if (goalDist < 300) {
        // 离球门近 → 射门
        this.kickTarget = {
          x: targetGoal.x,
          y: goalCenterY + (Math.random() - 0.5) * (goalBottom - goalTop) * 0.8,
        }
        this.targetX = ball.x
        this.targetY = ball.y
      } else {
        // 还远 → 带球推进
        this.kickTarget = {
          x: targetGoal.x,
          y: goalCenterY,
        }
        this.targetX = targetGoal.x
        this.targetY = player.y + (Math.random() - 0.5) * 50
      }
    } else {
      // 没持球 → 追球，朝对方球门方向踢（避免乌龙球）
      this.kickTarget = { x: targetGoal.x, y: targetGoal.y + targetGoal.height / 2 }
      this.targetX = ball.x
      this.targetY = ball.y

      // 如果球朝我方球门来，优先回防
      const ballApproaching = (targetGoal.x > ownGoal.x)
        ? ball.vx < -1
        : ball.vx > 1
      if (ballApproaching && Math.abs(ball.x - ownGoal.x) < field.width * 0.4) {
        // 回防到球和球门之间
        this.targetX = (ball.x + ownGoal.x) / 2
        this.targetY = ball.y
      }

      // 球在对方半场时适当前压
      const ballInOpponentHalf = Math.abs(ball.x - targetGoal.x) < Math.abs(ball.x - ownGoal.x)
      if (ballInOpponentHalf && ballDist > 200) {
        this.targetX = ball.x + (targetGoal.x - ball.x) * 0.3
        this.targetY = ball.y + (Math.random() - 0.5) * 80
      }
    }

    // 加入一点随机偏移，模拟人类不精确
    this.targetX += (Math.random() - 0.5) * 15 * (1 - this.difficulty)
    this.targetY += (Math.random() - 0.5) * 15 * (1 - this.difficulty)
  }

  private shouldKick(player: Player, ball: Ball): boolean {
    // Player 自身有 kickCooldown，不需要 AI 再管
    const dx = ball.x - player.x
    const dy = ball.y - player.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const kickRange = (player.radius + ball.radius + 10) * player.stats.attractMult

    // 距离够近就踢，概率与难度和距离相关（仅在决策时刻判定，避免帧率依赖）
    if (distance < kickRange) {
      const closeness = 1 - (distance / kickRange) // 0~1，越近越大
      const probability = 0.5 + closeness * 0.4     // 0.5~0.9
      return Math.random() < probability * this.difficulty
    }
    return false
  }

  private dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
    const dx = a.x - b.x
    const dy = a.y - b.y
    return Math.sqrt(dx * dx + dy * dy)
  }
}
