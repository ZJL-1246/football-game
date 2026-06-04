import type { Ball } from './Ball'
import type { Player } from './Player'
import type { Goal } from '../types'

export class Physics {
  // 圆形碰撞检测
  static circleVsCircle(
    x1: number, y1: number, r1: number,
    x2: number, y2: number, r2: number
  ): boolean {
    const dx = x2 - x1
    const dy = y2 - y1
    const dist = Math.sqrt(dx * dx + dy * dy)
    return dist < r1 + r2
  }

  // 球员与球碰撞
  static playerBallCollision(player: Player, ball: Ball): boolean {
    return this.circleVsCircle(
      player.x, player.y, player.radius,
      ball.x, ball.y, ball.radius
    )
  }

  // 球员与球员碰撞
  static playerPlayerCollision(p1: Player, p2: Player): boolean {
    return this.circleVsCircle(
      p1.x, p1.y, p1.radius,
      p2.x, p2.y, p2.radius
    )
  }

  // 处理球员与球碰撞（自然带球 - 球跟随球员）
  static resolvePlayerBallCollision(player: Player, ball: Ball): void {
    const dx = ball.x - player.x
    const dy = ball.y - player.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist === 0) return

    // 归一化方向
    const nx = dx / dist
    const ny = dy / dist

    // 分离球和球员（保持接触距离）
    const targetDist = player.radius + ball.radius + 1
    if (dist < targetDist) {
      ball.x = player.x + nx * targetDist
      ball.y = player.y + ny * targetDist
    }

    // 刚被踢的球：踢球方跳过跟随（避免吸回来），但对方能接住
    if (ball.justKicked > 0 && ball.lastKickedByTeam === player.team) return

    // 对方接球：高速飞来的球被接住后停在脚下
    const ballSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy)
    const playerSpeed = Math.sqrt(player.vx * player.vx + player.vy * player.vy)

    if (ballSpeed > 2 && ball.lastKickedByTeam !== player.team) {
      // 球被对方接住，大幅减速
      ball.vx *= 0.1
      ball.vy *= 0.1
      ball.justKicked = 0
      ball.lastKickedByTeam = null
      return
    }

    // 球跟随球员移动
    if (playerSpeed > 0.3) {
      ball.vx = player.vx * 0.9
      ball.vy = player.vy * 0.9
    } else {
      // 球员静止时，球也减速停下
      ball.vx *= 0.5
      ball.vy *= 0.5
    }
  }

  // 处理球员与球员碰撞
  static resolvePlayerPlayerCollision(p1: Player, p2: Player): void {
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist === 0) return

    // 归一化方向
    const nx = dx / dist
    const ny = dy / dist

    // 分离两个球员
    const overlap = p1.radius + p2.radius - dist
    if (overlap > 0) {
      const separation = overlap / 2
      p1.x -= nx * separation
      p1.y -= ny * separation
      p2.x += nx * separation
      p2.y += ny * separation
    }

    // 交换速度分量（弹性碰撞）
    const v1n = p1.vx * nx + p1.vy * ny
    const v2n = p2.vx * nx + p2.vy * ny

    p1.vx += (v2n - v1n) * nx * 0.5
    p1.vy += (v2n - v1n) * ny * 0.5
    p2.vx += (v1n - v2n) * nx * 0.5
    p2.vy += (v1n - v2n) * ny * 0.5
  }

  // 检查球是否在球门内
  static isBallInGoal(ball: Ball, goal: Goal): boolean {
    return (
      ball.x - ball.radius > goal.x &&
      ball.x + ball.radius < goal.x + goal.width &&
      ball.y - ball.radius > goal.y &&
      ball.y + ball.radius < goal.y + goal.height
    )
  }
}
