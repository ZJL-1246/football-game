import type { Team, CharacterType, PlayerMode, ColorConfig } from '../types'
import { CLASSIC_COLORS, GAME_PARAMS } from './constants'

interface KickEffect {
  x: number
  y: number
  radius: number
  maxRadius: number
  opacity: number
}

export class Player {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  direction: number
  kickCooldown: number
  team: Team
  label: string
  characterType: CharacterType
  playerMode: PlayerMode
  colors: ColorConfig
  private animFrame: number = 0
  private kickEffect: KickEffect | null = null

  constructor(x: number, y: number, team: Team, label: string, characterType: CharacterType = 'pixel', playerMode: PlayerMode = 'keyboard', colors?: ColorConfig) {
    this.x = x
    this.y = y
    this.vx = 0
    this.vy = 0
    this.radius = GAME_PARAMS.playerRadius
    this.colors = colors ?? CLASSIC_COLORS
    this.color = team === 'red' ? this.colors.player1 : this.colors.player2
    this.direction = team === 'red' ? 0 : Math.PI
    this.kickCooldown = 0
    this.team = team
    this.label = label
    this.characterType = characterType
    this.playerMode = playerMode
  }

  update(dt: number): void {
    this.x += this.vx * dt
    this.y += this.vy * dt

    if (Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1) {
      this.direction = Math.atan2(this.vy, this.vx)
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy)
      const freq = 0.04 + speed * 0.015
      this.animFrame += freq * dt
    }

    if (this.kickEffect) {
      this.kickEffect.radius += 1.5 * dt
      this.kickEffect.opacity -= 0.06 * dt
      if (this.kickEffect.opacity <= 0) {
        this.kickEffect = null
      }
    }

    if (this.kickCooldown > 0) {
      this.kickCooldown -= dt * 16.67
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.drawKickEffect(ctx)

    switch (this.characterType) {
      case 'pixel':
        this.drawPixelCharacter(ctx)
        break
      case 'circle':
        this.drawCircleCharacter(ctx)
        break
      case 'robot':
        this.drawRobotCharacter(ctx)
        break
    }
  }

  // ============ 踢球特效 ============
  private drawKickEffect(ctx: CanvasRenderingContext2D): void {
    if (!this.kickEffect) return
    const e = this.kickEffect

    ctx.strokeStyle = `rgba(255, 255, 100, ${e.opacity})`
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2)
    ctx.stroke()

    ctx.fillStyle = `rgba(255, 255, 200, ${e.opacity * 0.5})`
    ctx.beginPath()
    ctx.arc(e.x, e.y, e.radius * 0.5, 0, Math.PI * 2)
    ctx.fill()

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2
      const px = e.x + Math.cos(angle) * e.radius * 1.2
      const py = e.y + Math.sin(angle) * e.radius * 1.2
      ctx.fillStyle = `rgba(255, 200, 50, ${e.opacity * 0.8})`
      ctx.fillRect(px - 2, py - 2, 4, 4)
    }
  }

  // ============ 像素小人 ============
  private drawPixelCharacter(ctx: CanvasRenderingContext2D): void {
    const s = this.radius
    const x = this.x
    const y = this.y
    const moving = Math.abs(this.vx) > 0.3 || Math.abs(this.vy) > 0.3
    const legOffset = moving ? Math.sin(this.animFrame * 2) * s * 0.25 : 0
    const darkColor = this.team === 'red' ? '#B71C1C' : '#0D47A1'

    // 手臂
    const armOffset = moving ? -legOffset * 0.8 : 0
    ctx.fillStyle = '#FFCC80'
    ctx.fillRect(x - s * 0.5, y - s * 0.15 + armOffset, s * 0.12, s * 0.35)
    ctx.fillRect(x + s * 0.38, y - s * 0.15 - armOffset, s * 0.12, s * 0.35)

    // 腿
    ctx.fillStyle = '#5D4037'
    ctx.fillRect(x - s * 0.25 - 1, y + s * 0.3 + legOffset, s * 0.2, s * 0.35)
    ctx.fillRect(x + s * 0.05 + 1, y + s * 0.3 - legOffset, s * 0.2, s * 0.35)

    // 鞋子
    ctx.fillStyle = '#212121'
    ctx.fillRect(x - s * 0.3 - 1, y + s * 0.6 + legOffset, s * 0.3, s * 0.12)
    ctx.fillRect(x + s * 0.0 + 1, y + s * 0.6 - legOffset, s * 0.3, s * 0.12)

    // 身体
    ctx.fillStyle = this.color
    ctx.fillRect(x - s * 0.35, y - s * 0.3, s * 0.7, s * 0.65)
    ctx.strokeStyle = darkColor
    ctx.lineWidth = 1.5
    ctx.strokeRect(x - s * 0.35, y - s * 0.3, s * 0.7, s * 0.65)
    ctx.fillStyle = darkColor + '40'
    ctx.fillRect(x - s * 0.35, y - s * 0.05, s * 0.7, s * 0.1)

    // 头
    ctx.fillStyle = '#FFCC80'
    ctx.fillRect(x - s * 0.2, y - s * 0.55, s * 0.4, s * 0.3)
    ctx.fillStyle = '#3E2723'
    ctx.fillRect(x - s * 0.22, y - s * 0.6, s * 0.44, s * 0.12)

    // 眼睛
    const eyeDir = Math.cos(this.direction) > 0 ? 1 : -1
    ctx.fillStyle = '#000000'
    ctx.fillRect(x + eyeDir * s * 0.02 - 1, y - s * 0.45, 2, 2)
    ctx.fillRect(x + eyeDir * s * 0.1 - 1, y - s * 0.45, 2, 2)

    // 编号
    ctx.fillStyle = '#FFFFFF'
    ctx.font = `bold ${s * 0.4}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.label.replace('P', ''), x, y + s * 0.05)

    // 朝向箭头
    this.drawArrow(ctx, s)
  }

  // ============ 圆形球员 ============
  private drawCircleCharacter(ctx: CanvasRenderingContext2D): void {
    const s = this.radius
    const x = this.x
    const y = this.y

    // 身体（圆形）
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(x, y, s * 0.5, 0, Math.PI * 2)
    ctx.fill()

    // 描边
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    ctx.stroke()

    // 内圈装饰
    ctx.strokeStyle = (this.team === 'red' ? '#B71C1C' : '#0D47A1') + '60'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(x, y, s * 0.35, 0, Math.PI * 2)
    ctx.stroke()

    // 编号
    ctx.fillStyle = '#FFFFFF'
    ctx.font = `bold ${s * 0.5}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.label.replace('P', ''), x, y)

    // 朝向箭头
    this.drawArrow(ctx, s)
  }

  // ============ 机器人 ============
  private drawRobotCharacter(ctx: CanvasRenderingContext2D): void {
    const s = this.radius
    const x = this.x
    const y = this.y
    const moving = Math.abs(this.vx) > 0.3 || Math.abs(this.vy) > 0.3
    const legOffset = moving ? Math.sin(this.animFrame * 2) * s * 0.2 : 0
    const darkColor = this.team === 'red' ? '#B71C1C' : '#0D47A1'

    // 天线
    ctx.strokeStyle = '#9E9E9E'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x, y - s * 0.55)
    ctx.lineTo(x, y - s * 0.8)
    ctx.stroke()
    // 天线球
    ctx.fillStyle = '#FF5722'
    ctx.beginPath()
    ctx.arc(x, y - s * 0.82, s * 0.08, 0, Math.PI * 2)
    ctx.fill()

    // 头（方形金属）
    ctx.fillStyle = '#78909C'
    ctx.fillRect(x - s * 0.28, y - s * 0.55, s * 0.56, s * 0.35)
    ctx.strokeStyle = '#546E7A'
    ctx.lineWidth = 1.5
    ctx.strokeRect(x - s * 0.28, y - s * 0.55, s * 0.56, s * 0.35)

    // 方形眼睛
    const eyeDir = Math.cos(this.direction) > 0 ? 1 : -1
    ctx.fillStyle = '#00E5FF'
    ctx.fillRect(x + eyeDir * s * 0.0 - s * 0.08, y - s * 0.48, s * 0.12, s * 0.1)
    ctx.fillRect(x + eyeDir * s * 0.1 - s * 0.04, y - s * 0.48, s * 0.12, s * 0.1)
    // 眼睛描边
    ctx.strokeStyle = '#00BCD4'
    ctx.lineWidth = 1
    ctx.strokeRect(x + eyeDir * s * 0.0 - s * 0.08, y - s * 0.48, s * 0.12, s * 0.1)
    ctx.strokeRect(x + eyeDir * s * 0.1 - s * 0.04, y - s * 0.48, s * 0.12, s * 0.1)

    // 身体（方形金属）
    ctx.fillStyle = this.color
    ctx.fillRect(x - s * 0.35, y - s * 0.22, s * 0.7, s * 0.55)
    ctx.strokeStyle = darkColor
    ctx.lineWidth = 2
    ctx.strokeRect(x - s * 0.35, y - s * 0.22, s * 0.7, s * 0.55)

    // 胸口屏幕
    ctx.fillStyle = '#263238'
    ctx.fillRect(x - s * 0.18, y - s * 0.12, s * 0.36, s * 0.2)
    // 屏幕内容（编号）
    ctx.fillStyle = '#00E5FF'
    ctx.font = `bold ${s * 0.3}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.label.replace('P', ''), x, y - s * 0.02)

    // 手臂（金属管）
    const armOffset = moving ? -legOffset * 0.8 : 0
    ctx.fillStyle = '#78909C'
    ctx.fillRect(x - s * 0.52, y - s * 0.1 + armOffset, s * 0.14, s * 0.35)
    ctx.fillRect(x + s * 0.38, y - s * 0.1 - armOffset, s * 0.14, s * 0.35)
    // 手爪
    ctx.fillStyle = '#FFCC80'
    ctx.fillRect(x - s * 0.52, y + s * 0.25 + armOffset, s * 0.14, s * 0.08)
    ctx.fillRect(x + s * 0.38, y + s * 0.25 - armOffset, s * 0.14, s * 0.08)

    // 腿（金属）
    ctx.fillStyle = '#546E7A'
    ctx.fillRect(x - s * 0.25, y + s * 0.33 + legOffset, s * 0.18, s * 0.3)
    ctx.fillRect(x + s * 0.07, y + s * 0.33 - legOffset, s * 0.18, s * 0.3)
    // 鞋子
    ctx.fillStyle = '#37474F'
    ctx.fillRect(x - s * 0.28, y + s * 0.6 + legOffset, s * 0.24, s * 0.1)
    ctx.fillRect(x + s * 0.04, y + s * 0.6 - legOffset, s * 0.24, s * 0.1)

    // 朝向箭头
    this.drawArrow(ctx, s)
  }

  // ============ 公共：朝向箭头 ============
  private drawArrow(ctx: CanvasRenderingContext2D, s: number): void {
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.direction)
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.moveTo(s * 0.5 + s * 0.2, 0)
    ctx.lineTo(s * 0.5, -s * 0.12)
    ctx.lineTo(s * 0.5, s * 0.12)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  // ============ 静态：绘制预览（用于菜单选择） ============
  static drawPreview(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, characterType: CharacterType, team: Team, colors?: ColorConfig): void {
    const tempPlayer = new Player(x, y, team, team === 'red' ? '1' : '2', characterType, 'keyboard', colors)
    tempPlayer.radius = size
    tempPlayer.direction = team === 'red' ? 0 : Math.PI
    // 直接调用对应绘制方法
    switch (characterType) {
      case 'pixel':
        tempPlayer.drawPixelCharacter(ctx)
        break
      case 'circle':
        tempPlayer.drawCircleCharacter(ctx)
        break
      case 'robot':
        tempPlayer.drawRobotCharacter(ctx)
        break
    }
  }

  canKick(): boolean {
    return this.kickCooldown <= 0
  }

  kick(ballX: number, ballY: number): { fx: number; fy: number } {
    if (!this.canKick()) {
      return { fx: 0, fy: 0 }
    }

    this.kickCooldown = GAME_PARAMS.kickCooldown

    this.kickEffect = {
      x: ballX,
      y: ballY,
      radius: 5,
      maxRadius: this.radius * 2,
      opacity: 1,
    }

    const dx = ballX - this.x
    const dy = ballY - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist === 0) {
      return { fx: 0, fy: 0 }
    }

    const nx = dx / dist
    const ny = dy / dist

    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy)
    const force = GAME_PARAMS.kickForce + speed * GAME_PARAMS.kickSpeedBonus

    return {
      fx: nx * force,
      fy: ny * force,
    }
  }

  constrainToBounds(bounds: { x: number; y: number; width: number; height: number }): void {
    if (this.x - this.radius < bounds.x) {
      this.x = bounds.x + this.radius
      this.vx = 0
    }
    if (this.x + this.radius > bounds.x + bounds.width) {
      this.x = bounds.x + bounds.width - this.radius
      this.vx = 0
    }
    if (this.y - this.radius < bounds.y) {
      this.y = bounds.y + this.radius
      this.vy = 0
    }
    if (this.y + this.radius > bounds.y + bounds.height) {
      this.y = bounds.y + bounds.height - this.radius
      this.vy = 0
    }
  }

  reset(x: number, y: number): void {
    this.x = x
    this.y = y
    this.vx = 0
    this.vy = 0
    this.direction = this.team === 'red' ? 0 : Math.PI
    this.kickCooldown = 0
    this.animFrame = 0
    this.kickEffect = null
  }
}
