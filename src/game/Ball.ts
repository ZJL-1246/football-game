import type { ColorConfig, Team } from '../types'
import { CLASSIC_COLORS, GAME_PARAMS } from './constants'

export class Ball {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  rotation: number
  colors: ColorConfig
  justKicked: number = 0 // 踢球后跳过碰撞跟随的帧数
  lastKickedByTeam: Team | null = null // 最近踢球的队伍

  constructor(x: number, y: number, colors?: ColorConfig) {
    this.x = x
    this.y = y
    this.vx = 0
    this.vy = 0
    this.radius = GAME_PARAMS.ballRadius
    this.rotation = 0
    this.colors = colors ?? CLASSIC_COLORS
  }

  update(dt: number): void {
    // 踢球冷却计时
    if (this.justKicked > 0) this.justKicked -= dt

    // 更新位置
    this.x += this.vx * dt
    this.y += this.vy * dt

    // 摩擦力衰减
    this.vx *= GAME_PARAMS.ballFriction
    this.vy *= GAME_PARAMS.ballFriction

    // 速度低于阈值时停止
    if (Math.abs(this.vx) < 0.01) this.vx = 0
    if (Math.abs(this.vy) < 0.01) this.vy = 0

    // 限制最大速度
    let speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy)
    if (speed > GAME_PARAMS.maxBallSpeed) {
      this.vx = (this.vx / speed) * GAME_PARAMS.maxBallSpeed
      this.vy = (this.vy / speed) * GAME_PARAMS.maxBallSpeed
      speed = GAME_PARAMS.maxBallSpeed
    }

    // 更新旋转角度
    this.rotation += speed * 0.05 * dt
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.rotation)

    // 球体
    ctx.fillStyle = this.colors.ball
    ctx.beginPath()
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2)
    ctx.fill()

    // 纹理（五边形图案）
    this.drawPattern(ctx)

    // 描边
    ctx.strokeStyle = '#00000040'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.restore()
  }

  private drawPattern(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.colors.ballPattern
    const r = this.radius

    // 中心五边形
    const sides = 5
    const innerRadius = r * 0.4
    ctx.beginPath()
    for (let i = 0; i < sides; i++) {
      const angle = (i * Math.PI * 2) / sides - Math.PI / 2
      const x = Math.cos(angle) * innerRadius
      const y = Math.sin(angle) * innerRadius
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fill()
  }

  applyForce(fx: number, fy: number): void {
    this.vx += fx
    this.vy += fy
  }

  constrainToBounds(bounds: { x: number; y: number; width: number; height: number }): { bounced: boolean } {
    let bounced = false

    if (this.x - this.radius < bounds.x) {
      this.x = bounds.x + this.radius
      this.vx = Math.abs(this.vx) * 0.8
      bounced = true
    }
    if (this.x + this.radius > bounds.x + bounds.width) {
      this.x = bounds.x + bounds.width - this.radius
      this.vx = -Math.abs(this.vx) * 0.8
      bounced = true
    }
    if (this.y - this.radius < bounds.y) {
      this.y = bounds.y + this.radius
      this.vy = Math.abs(this.vy) * 0.8
      bounced = true
    }
    if (this.y + this.radius > bounds.y + bounds.height) {
      this.y = bounds.y + bounds.height - this.radius
      this.vy = -Math.abs(this.vy) * 0.8
      bounced = true
    }

    return { bounced }
  }

  // 带球门开口的边界碰撞（球门位置不反弹）
  constrainToBoundsWithGoals(
    bounds: { x: number; y: number; width: number; height: number },
    leftGoal: { x: number; y: number; width: number; height: number },
    rightGoal: { x: number; y: number; width: number; height: number }
  ): void {
    const inLeftGoalY = this.y > leftGoal.y && this.y < leftGoal.y + leftGoal.height
    const inRightGoalY = this.y > rightGoal.y && this.y < rightGoal.y + rightGoal.height

    // 左边界：如果在球门范围内，不反弹（让球进凹槽）
    if (this.x - this.radius < bounds.x) {
      if (!inLeftGoalY) {
        this.x = bounds.x + this.radius
        this.vx = Math.abs(this.vx) * 0.8
      }
    }

    // 右边界：如果在球门范围内，不反弹
    if (this.x + this.radius > bounds.x + bounds.width) {
      if (!inRightGoalY) {
        this.x = bounds.x + bounds.width - this.radius
        this.vx = -Math.abs(this.vx) * 0.8
      }
    }

    // 上下边界：正常反弹
    if (this.y - this.radius < bounds.y) {
      this.y = bounds.y + this.radius
      this.vy = Math.abs(this.vy) * 0.8
    }
    if (this.y + this.radius > bounds.y + bounds.height) {
      this.y = bounds.y + bounds.height - this.radius
      this.vy = -Math.abs(this.vy) * 0.8
    }

    // 球进入凹槽后，碰到凹槽内壁反弹
    if (this.x < bounds.x) {
      // 在左球门凹槽内
      if (this.x - this.radius < leftGoal.x) {
        this.x = leftGoal.x + this.radius
        this.vx = Math.abs(this.vx) * 0.5
      }
      if (this.y - this.radius < leftGoal.y) {
        this.y = leftGoal.y + this.radius
        this.vy = Math.abs(this.vy) * 0.5
      }
      if (this.y + this.radius > leftGoal.y + leftGoal.height) {
        this.y = leftGoal.y + leftGoal.height - this.radius
        this.vy = -Math.abs(this.vy) * 0.5
      }
    }

    if (this.x > bounds.x + bounds.width) {
      // 在右球门凹槽内
      if (this.x + this.radius > rightGoal.x + rightGoal.width) {
        this.x = rightGoal.x + rightGoal.width - this.radius
        this.vx = -Math.abs(this.vx) * 0.5
      }
      if (this.y - this.radius < rightGoal.y) {
        this.y = rightGoal.y + this.radius
        this.vy = Math.abs(this.vy) * 0.5
      }
      if (this.y + this.radius > rightGoal.y + rightGoal.height) {
        this.y = rightGoal.y + rightGoal.height - this.radius
        this.vy = -Math.abs(this.vy) * 0.5
      }
    }
  }

  getSpeed(): number {
    return Math.sqrt(this.vx * this.vx + this.vy * this.vy)
  }

  reset(x: number, y: number): void {
    this.x = x
    this.y = y
    this.vx = 0
    this.vy = 0
    this.rotation = 0
  }
}
