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
    switch (this.sceneType) {
      case 'cyber':
        this.drawCyberField(ctx)
        break
      case 'pixel':
        this.drawPixelField(ctx)
        break
      case 'pop':
        this.drawPopField(ctx)
        break
      default:
        this.drawClassicField(ctx)
        break
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
      // 基础条纹
      const baseColor = i % 2 === 0 ? this.colors.fieldDark : this.colors.fieldLight
      ctx.fillStyle = baseColor
      ctx.fillRect(this.x, this.y + i * stripeHeight, this.width, stripeHeight)

      // 添加细微的渐变效果，增加立体感
      const gradient = ctx.createLinearGradient(
        this.x, this.y + i * stripeHeight,
        this.x, this.y + (i + 1) * stripeHeight
      )
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.03)')
      gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.02)')
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0.01)')
      ctx.fillStyle = gradient
      ctx.fillRect(this.x, this.y + i * stripeHeight, this.width, stripeHeight)
    }

    // 添加草地纹理点（确定性图案）
    ctx.fillStyle = 'rgba(255, 255, 255, 0.015)'
    const dotSpacing = 16
    for (let dx = this.x + 4; dx < this.x + this.width; dx += dotSpacing) {
      for (let dy = this.y + 4; dy < this.y + this.height; dy += dotSpacing) {
        // 使用坐标生成确定性图案
        const hash = ((dx * 7 + dy * 13) % 100)
        if (hash < 30) {
          ctx.fillRect(dx, dy, 1, 1)
        }
      }
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

  // ============ 像素复古 ============
  private drawPixelField(ctx: CanvasRenderingContext2D): void {
    // 黑色背景
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    // 像素化草地（方块风格）
    const pixelSize = 8
    for (let px = this.x; px < this.x + this.width; px += pixelSize) {
      for (let py = this.y; py < this.y + this.height; py += pixelSize) {
        // 棋盘格图案
        const isDark = ((Math.floor(px / pixelSize) + Math.floor(py / pixelSize)) % 2 === 0)
        ctx.fillStyle = isDark ? this.colors.fieldDark : this.colors.fieldLight
        ctx.fillRect(px, py, pixelSize, pixelSize)
      }
    }

    // 像素化线条（锯齿效果）
    ctx.fillStyle = this.colors.lines
    const lineThickness = 4

    // 边框
    ctx.fillRect(this.x, this.y, this.width, lineThickness)
    ctx.fillRect(this.x, this.y + this.height - lineThickness, this.width, lineThickness)
    ctx.fillRect(this.x, this.y, lineThickness, this.height)
    ctx.fillRect(this.x + this.width - lineThickness, this.y, lineThickness, this.height)

    // 中线
    const centerX = this.x + this.width / 2
    ctx.fillRect(centerX - lineThickness / 2, this.y, lineThickness, this.height)

    // 中圈（像素化圆形）
    const centerY = this.y + this.height / 2
    const circleRadius = this.width * 0.08
    this.drawPixelCircle(ctx, centerX, centerY, circleRadius, this.colors.lines)

    // 中心点
    ctx.fillRect(centerX - 4, centerY - 4, 8, 8)

    // 罚球区
    const penaltyWidth = this.width * 0.12
    const penaltyHeight = this.height * 0.4
    const penaltyY = this.y + (this.height - penaltyHeight) / 2

    ctx.fillRect(this.x, penaltyY, penaltyWidth, lineThickness)
    ctx.fillRect(this.x, penaltyY + penaltyHeight - lineThickness, penaltyWidth, lineThickness)
    ctx.fillRect(this.x, penaltyY, lineThickness, penaltyHeight)

    ctx.fillRect(this.x + this.width - penaltyWidth, penaltyY, penaltyWidth, lineThickness)
    ctx.fillRect(this.x + this.width - penaltyWidth, penaltyY + penaltyHeight - lineThickness, penaltyWidth, lineThickness)
    ctx.fillRect(this.x + this.width - lineThickness, penaltyY, lineThickness, penaltyHeight)

    this.drawGoals(ctx)
  }

  private drawPixelCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, color: string): void {
    ctx.fillStyle = color
    const pixelSize = 4
    // Bresenham 风格的像素圆
    for (let angle = 0; angle < Math.PI * 2; angle += 0.05) {
      const px = cx + Math.cos(angle) * radius
      const py = cy + Math.sin(angle) * radius
      ctx.fillRect(
        Math.round(px / pixelSize) * pixelSize,
        Math.round(py / pixelSize) * pixelSize,
        pixelSize,
        pixelSize
      )
    }
  }

  // ============ 波普艺术 ============
  private drawPopField(ctx: CanvasRenderingContext2D): void {
    // 高饱和渐变背景
    const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height)
    gradient.addColorStop(0, '#4ECDC4')
    gradient.addColorStop(0.5, '#45B7D1')
    gradient.addColorStop(1, '#96CEB4')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    // 波普圆点背景纹理
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    const dotSize = 6
    const dotSpacing = 24
    for (let dx = 0; dx < ctx.canvas.width; dx += dotSpacing) {
      for (let dy = 0; dy < ctx.canvas.height; dy += dotSpacing) {
        ctx.beginPath()
        ctx.arc(dx, dy, dotSize / 2, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // 场地（粗黑边框风格）
    ctx.fillStyle = this.colors.fieldDark
    ctx.fillRect(this.x + 4, this.y + 4, this.width - 8, this.height - 8)
    ctx.fillStyle = this.colors.fieldLight
    ctx.fillRect(this.x + 12, this.y + 12, this.width - 24, this.height - 24)

    // 粗黑描边
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 8
    ctx.strokeRect(this.x, this.y, this.width, this.height)

    // 中线（粗黑）
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

    // 中心点（大圆点）
    ctx.fillStyle = '#000000'
    ctx.beginPath()
    ctx.arc(centerX, centerY, 6, 0, Math.PI * 2)
    ctx.fill()

    // 罚球区
    const penaltyWidth = this.width * 0.12
    const penaltyHeight = this.height * 0.4
    const penaltyY = this.y + (this.height - penaltyHeight) / 2

    ctx.strokeRect(this.x, penaltyY, penaltyWidth, penaltyHeight)
    ctx.strokeRect(this.x + this.width - penaltyWidth, penaltyY, penaltyWidth, penaltyHeight)

    // 波普风格装饰 - 角落星星
    this.drawPopStar(ctx, this.x + 20, this.y + 20, 12, '#FF0000')
    this.drawPopStar(ctx, this.x + this.width - 20, this.y + 20, 12, '#FFD700')
    this.drawPopStar(ctx, this.x + 20, this.y + this.height - 20, 12, '#FF6B6B')
    this.drawPopStar(ctx, this.x + this.width - 20, this.y + this.height - 20, 12, '#FF3366')

    this.drawGoals(ctx)
  }

  private drawPopStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string): void {
    ctx.fillStyle = color
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    const innerRadius = size * 0.4
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 - Math.PI / 2
      const r = i % 2 === 0 ? size : innerRadius
      const x = cx + Math.cos(angle) * r
      const y = cy + Math.sin(angle) * r
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
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

    // 角球弧
    const cornerRadius = 12
    const corners = [
      { x: this.x, y: this.y, startAngle: 0, endAngle: Math.PI / 2 },
      { x: this.x + this.width, y: this.y, startAngle: Math.PI / 2, endAngle: Math.PI },
      { x: this.x, y: this.y + this.height, startAngle: -Math.PI / 2, endAngle: 0 },
      { x: this.x + this.width, y: this.y + this.height, startAngle: Math.PI, endAngle: Math.PI * 1.5 },
    ]

    ctx.strokeStyle = lineColor
    ctx.lineWidth = lineWidth
    corners.forEach(corner => {
      ctx.beginPath()
      ctx.arc(corner.x, corner.y, cornerRadius, corner.startAngle, corner.endAngle)
      ctx.stroke()
    })
  }

  private drawGoals(ctx: CanvasRenderingContext2D): void {
    this.drawGoal(ctx, this.leftGoal)
    this.drawGoal(ctx, this.rightGoal)
  }

  private drawGoal(ctx: CanvasRenderingContext2D, goal: Goal): void {
    // 球门网背景（半透明）
    ctx.fillStyle = this.colors.goalNet
    ctx.fillRect(goal.x, goal.y, goal.width, goal.height)

    // 球门网 - 斜线网格效果
    const netAlpha = this.sceneType === 'cyber' ? '40' : '50'
    ctx.strokeStyle = this.colors.goal + netAlpha
    ctx.lineWidth = 1
    const netSpacing = 8

    // 斜线网格（菱形效果）
    for (let i = -goal.height; i < goal.width + goal.height; i += netSpacing) {
      ctx.beginPath()
      ctx.moveTo(goal.x + i, goal.y)
      ctx.lineTo(goal.x + i - goal.height, goal.y + goal.height)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(goal.x + i, goal.y)
      ctx.lineTo(goal.x + i + goal.height, goal.y + goal.height)
      ctx.stroke()
    }

    // 球门框
    ctx.strokeStyle = this.colors.goal
    ctx.lineWidth = 4
    if (this.sceneType === 'cyber') {
      ctx.shadowColor = this.colors.goal
      ctx.shadowBlur = 12
    }
    ctx.strokeRect(goal.x, goal.y, goal.width, goal.height)
    ctx.shadowBlur = 0

    // 球门框内边高光
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 1
    ctx.strokeRect(goal.x + 2, goal.y + 2, goal.width - 4, goal.height - 4)
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
