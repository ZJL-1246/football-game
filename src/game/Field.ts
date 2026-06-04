import type { Goal, Rect, ColorConfig, SceneType } from '../types'
import { STRIPE_COUNT } from './constants'

export class Field {
  x: number
  y: number
  width: number
  height: number
  goalWidth: number
  goalHeight: number
  leftGoal: Goal
  rightGoal: Goal
  sceneType: SceneType
  colors: ColorConfig

  constructor(x: number, y: number, width: number, height: number, goalWidth: number, goalHeight: number, sceneType: SceneType, colors: ColorConfig) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.goalWidth = goalWidth
    this.goalHeight = goalHeight
    this.sceneType = sceneType
    this.colors = colors

    const goalY = y + (height - goalHeight) / 2

    this.leftGoal = {
      x: x - goalWidth,
      y: goalY,
      width: goalWidth,
      height: goalHeight,
      team: 'blue',
    }

    this.rightGoal = {
      x: x + width,
      y: goalY,
      width: goalWidth,
      height: goalHeight,
      team: 'red',
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.sceneType === 'cyber') {
      this.drawCyberField(ctx)
    } else {
      this.drawClassicField(ctx)
    }
  }

  // ============ 经典草地 ============
  private drawClassicField(ctx: CanvasRenderingContext2D): void {
    this.drawGrass(ctx)
    this.drawLines(ctx, this.colors.lines, 2)
    this.drawGoals(ctx)
  }

  private drawGrass(ctx: CanvasRenderingContext2D): void {
    const stripeHeight = this.height / STRIPE_COUNT
    for (let i = 0; i < STRIPE_COUNT; i++) {
      ctx.fillStyle = i % 2 === 0 ? this.colors.fieldDark : this.colors.fieldLight
      ctx.fillRect(this.x, this.y + i * stripeHeight, this.width, stripeHeight)
    }
  }

  // ============ 赛博朋克 ============
  private drawCyberField(ctx: CanvasRenderingContext2D): void {
    // 深色底色
    ctx.fillStyle = this.colors.fieldDark
    ctx.fillRect(this.x, this.y, this.width, this.height)

    // 网格线
    ctx.strokeStyle = this.colors.fieldLight
    ctx.lineWidth = 0.5
    const gridSize = 40
    for (let gx = this.x; gx <= this.x + this.width; gx += gridSize) {
      ctx.beginPath()
      ctx.moveTo(gx, this.y)
      ctx.lineTo(gx, this.y + this.height)
      ctx.stroke()
    }
    for (let gy = this.y; gy <= this.y + this.height; gy += gridSize) {
      ctx.beginPath()
      ctx.moveTo(this.x, gy)
      ctx.lineTo(this.x + this.width, gy)
      ctx.stroke()
    }

    // 霓虹线条
    this.drawLines(ctx, this.colors.lines, 2)

    // 四角发光
    const glow = 15
    ctx.shadowColor = this.colors.lines
    ctx.shadowBlur = glow
    this.drawLines(ctx, this.colors.lines, 2)
    ctx.shadowBlur = 0

    // 中圈发光
    const centerX = this.x + this.width / 2
    const centerY = this.y + this.height / 2
    const circleRadius = this.width * 0.08
    ctx.shadowColor = this.colors.lines
    ctx.shadowBlur = glow
    ctx.strokeStyle = this.colors.lines
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.shadowBlur = 0

    this.drawGoals(ctx)
  }

  // ============ 公共绘制 ============
  private drawLines(ctx: CanvasRenderingContext2D, lineColor: string, lineWidth: number): void {
    ctx.strokeStyle = lineColor
    ctx.lineWidth = lineWidth
    ctx.setLineDash([])

    // 边框
    ctx.strokeRect(this.x, this.y, this.width, this.height)

    // 中线
    const centerX = this.x + this.width / 2
    ctx.beginPath()
    ctx.moveTo(centerX, this.y)
    ctx.lineTo(centerX, this.y + this.height)
    ctx.stroke()

    // 中圈
    const centerY = this.y + this.height / 2
    const circleRadius = this.width * 0.08
    ctx.beginPath()
    ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2)
    ctx.stroke()

    // 中心点
    ctx.fillStyle = lineColor
    ctx.beginPath()
    ctx.arc(centerX, centerY, 4, 0, Math.PI * 2)
    ctx.fill()

    // 罚球区
    const penaltyWidth = this.width * 0.12
    const penaltyHeight = this.height * 0.4
    const penaltyY = this.y + (this.height - penaltyHeight) / 2

    ctx.strokeRect(this.x, penaltyY, penaltyWidth, penaltyHeight)
    ctx.strokeRect(this.x + this.width - penaltyWidth, penaltyY, penaltyWidth, penaltyHeight)
  }

  private drawGoals(ctx: CanvasRenderingContext2D): void {
    this.drawGoal(ctx, this.leftGoal)
    this.drawGoal(ctx, this.rightGoal)
  }

  private drawGoal(ctx: CanvasRenderingContext2D, goal: Goal): void {
    // 球门网
    ctx.fillStyle = this.colors.goalNet
    ctx.fillRect(goal.x, goal.y, goal.width, goal.height)

    // 球门框
    ctx.strokeStyle = this.colors.goal
    ctx.lineWidth = 4
    if (this.sceneType === 'cyber') {
      ctx.shadowColor = this.colors.goal
      ctx.shadowBlur = 10
    }
    ctx.strokeRect(goal.x, goal.y, goal.width, goal.height)
    ctx.shadowBlur = 0

    // 球门网线条
    const netAlpha = this.sceneType === 'cyber' ? '30' : '40'
    ctx.strokeStyle = this.colors.goal + netAlpha
    ctx.lineWidth = 1
    const netSpacing = 10
    for (let x = goal.x + netSpacing; x < goal.x + goal.width; x += netSpacing) {
      ctx.beginPath()
      ctx.moveTo(x, goal.y)
      ctx.lineTo(x, goal.y + goal.height)
      ctx.stroke()
    }
    for (let y = goal.y + netSpacing; y < goal.y + goal.height; y += netSpacing) {
      ctx.beginPath()
      ctx.moveTo(goal.x, y)
      ctx.lineTo(goal.x + goal.width, y)
      ctx.stroke()
    }
  }

  getCenter(): { x: number; y: number } {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
    }
  }

  getBounds(): Rect {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    }
  }
}
