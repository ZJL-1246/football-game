import type { ColorConfig, Team, SceneType } from '../types'
import { CLASSIC_COLORS, GAME_PARAMS } from './constants'

export class Ball {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  rotation: number
  colors: ColorConfig
  sceneType: SceneType
  justKicked: number = 0 // 踢球后跳过碰撞跟随的帧数
  lastKickedByTeam: Team | null = null // 最近踢球的队伍

  constructor(x: number, y: number, colors?: ColorConfig, sceneType?: SceneType) {
    this.x = x
    this.y = y
    this.vx = 0
    this.vy = 0
    this.radius = GAME_PARAMS.ballRadius
    this.rotation = 0
    this.colors = colors ?? CLASSIC_COLORS
    this.sceneType = sceneType ?? 'classic'
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

    // 球体阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
    ctx.beginPath()
    ctx.ellipse(2, 2, this.radius, this.radius * 0.9, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.rotate(this.rotation)

    // 根据场景绘制不同风格的球
    switch (this.sceneType) {
      case 'cyber':
        this.drawCyberBall(ctx)
        break
      case 'pixel':
        this.drawPixelBall(ctx)
        break
      case 'pop':
        this.drawPopBall(ctx)
        break
      default:
        this.drawClassicBall(ctx)
        break
    }

    ctx.restore()
  }

  // 经典足球
  private drawClassicBall(ctx: CanvasRenderingContext2D): void {
    const r = this.radius

    // 球体渐变
    const gradient = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r)
    gradient.addColorStop(0, '#FFFFFF')
    gradient.addColorStop(0.7, '#F5F5F5')
    gradient.addColorStop(1, '#E0E0E0')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fill()

    // 足球图案
    this.drawFootballPattern(ctx, '#333333')

    // 高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.beginPath()
    ctx.arc(-r * 0.25, -r * 0.25, r * 0.35, 0, Math.PI * 2)
    ctx.fill()

    // 描边
    ctx.strokeStyle = '#00000030'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.stroke()
  }

  // 赛博朋克发光球
  private drawCyberBall(ctx: CanvasRenderingContext2D): void {
    const r = this.radius

    // 发光效果
    ctx.shadowColor = '#00FFFF'
    ctx.shadowBlur = 15

    // 球体
    const gradient = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r)
    gradient.addColorStop(0, '#00FFFF')
    gradient.addColorStop(0.5, '#0088FF')
    gradient.addColorStop(1, '#0044AA')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fill()

    ctx.shadowBlur = 0

    // 霓虹图案
    this.drawFootballPattern(ctx, '#FF00FF')

    // 高光
    ctx.fillStyle = 'rgba(0, 255, 255, 0.8)'
    ctx.beginPath()
    ctx.arc(-r * 0.25, -r * 0.25, r * 0.3, 0, Math.PI * 2)
    ctx.fill()

    // 外圈发光
    ctx.strokeStyle = '#00FFFF'
    ctx.lineWidth = 2
    ctx.shadowColor = '#00FFFF'
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.stroke()
    ctx.shadowBlur = 0
  }

  // 像素复古球
  private drawPixelBall(ctx: CanvasRenderingContext2D): void {
    const r = this.radius
    const pixelSize = Math.max(2, r / 5)

    // 像素化圆形
    ctx.fillStyle = '#FFFFFF'
    for (let px = -r; px <= r; px += pixelSize) {
      for (let py = -r; py <= r; py += pixelSize) {
        if (px * px + py * py <= r * r) {
          ctx.fillRect(
            Math.round(px / pixelSize) * pixelSize,
            Math.round(py / pixelSize) * pixelSize,
            pixelSize,
            pixelSize
          )
        }
      }
    }

    // 像素化图案
    ctx.fillStyle = '#000000'
    // 中心十字
    ctx.fillRect(-pixelSize, -r * 0.4, pixelSize * 2, r * 0.8)
    ctx.fillRect(-r * 0.4, -pixelSize, r * 0.8, pixelSize * 2)

    // 角落方块
    const cornerOffset = r * 0.5
    ctx.fillRect(-cornerOffset - pixelSize, -cornerOffset - pixelSize, pixelSize * 2, pixelSize * 2)
    ctx.fillRect(cornerOffset - pixelSize, -cornerOffset - pixelSize, pixelSize * 2, pixelSize * 2)
    ctx.fillRect(-cornerOffset - pixelSize, cornerOffset - pixelSize, pixelSize * 2, pixelSize * 2)
    ctx.fillRect(cornerOffset - pixelSize, cornerOffset - pixelSize, pixelSize * 2, pixelSize * 2)
  }

  // 波普艺术球
  private drawPopBall(ctx: CanvasRenderingContext2D): void {
    const r = this.radius

    // 球体 - 高对比度
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fill()

    // 波普圆点纹理
    ctx.fillStyle = '#FF0000'
    const dotSize = r * 0.15
    const dotSpacing = r * 0.4
    for (let dx = -r; dx <= r; dx += dotSpacing) {
      for (let dy = -r; dy <= r; dy += dotSpacing) {
        if (dx * dx + dy * dy < r * r * 0.8) {
          ctx.beginPath()
          ctx.arc(dx, dy, dotSize, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    // 粗黑描边
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.stroke()

    // 高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.beginPath()
    ctx.arc(-r * 0.2, -r * 0.2, r * 0.3, 0, Math.PI * 2)
    ctx.fill()
  }

  private drawFootballPattern(ctx: CanvasRenderingContext2D, color?: string): void {
    const r = this.radius
    const patternColor = color || this.colors.ballPattern || '#333333'

    // 中心五边形（黑色）
    ctx.fillStyle = patternColor
    const pentagonRadius = r * 0.35
    ctx.beginPath()
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5 - Math.PI / 2
      const x = Math.cos(angle) * pentagonRadius
      const y = Math.sin(angle) * pentagonRadius
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fill()

    // 周围的五边形图案
    const hexRadius = r * 0.55
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5 - Math.PI / 2
      const cx = Math.cos(angle) * hexRadius
      const cy = Math.sin(angle) * hexRadius

      // 小五边形
      const smallPentRadius = r * 0.18
      ctx.beginPath()
      for (let j = 0; j < 5; j++) {
        const pAngle = (j * Math.PI * 2) / 5 - Math.PI / 2 + angle
        const px = cx + Math.cos(pAngle) * smallPentRadius
        const py = cy + Math.sin(pAngle) * smallPentRadius
        if (j === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fill()
    }

    // 连接线
    ctx.strokeStyle = patternColor
    ctx.lineWidth = 1.5
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5 - Math.PI / 2

      const x1 = Math.cos(angle) * pentagonRadius
      const y1 = Math.sin(angle) * pentagonRadius
      const x2 = Math.cos(angle) * hexRadius
      const y2 = Math.sin(angle) * hexRadius

      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }
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
