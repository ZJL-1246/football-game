import type { Team, CharacterType, PlayerMode, ColorConfig, CharacterStats } from '../types'
import { CLASSIC_COLORS, GAME_PARAMS, CHARACTER_STATS } from './constants'

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
  stats: CharacterStats
  burstVx: number = 0  // 忍者冲刺残留速度 X
  burstVy: number = 0  // 忍者冲刺残留速度 Y
  teleportTrail: { x: number; y: number; opacity: number } | null = null  // 瞬移残影
  pendingTeleport: { x: number; y: number; timer: number } | null = null  // 延迟瞬移
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
    this.stats = CHARACTER_STATS[characterType]
  }

  update(dt: number): void {
    // 冲刺残留速度衰减
    this.burstVx *= 0.85
    this.burstVy *= 0.85
    if (Math.abs(this.burstVx) < 0.05) this.burstVx = 0
    if (Math.abs(this.burstVy) < 0.05) this.burstVy = 0

    // 延迟瞬移（忍者特性）
    if (this.pendingTeleport) {
      this.pendingTeleport.timer -= dt * 16.67
      if (this.pendingTeleport.timer <= 0) {
        this.teleportTrail = { x: this.x, y: this.y, opacity: 1 }
        this.x = this.pendingTeleport.x
        this.y = this.pendingTeleport.y
        this.pendingTeleport = null
      }
    }

    this.x += (this.vx + this.burstVx) * dt
    this.y += (this.vy + this.burstVy) * dt

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

    if (this.teleportTrail) {
      this.teleportTrail.opacity -= 0.08 * dt
      if (this.teleportTrail.opacity <= 0) {
        this.teleportTrail = null
      }
    }

    if (this.kickCooldown > 0) {
      this.kickCooldown -= dt * 16.67
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.drawKickEffect(ctx)
    this.drawTeleportTrail(ctx)

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
      case 'ninja':
        this.drawNinjaCharacter(ctx)
        break
      case 'cat':
        this.drawCatCharacter(ctx)
        break
      case 'alien':
        this.drawAlienCharacter(ctx)
        break
      case 'stickman':
        this.drawStickmanCharacter(ctx)
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

  // ============ 瞬移残影 ============
  private drawTeleportTrail(ctx: CanvasRenderingContext2D): void {
    if (!this.teleportTrail) return
    const t = this.teleportTrail
    ctx.globalAlpha = t.opacity * 0.5
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(t.x, t.y, this.radius * 0.6, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
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

  // ============ 忍者 ============
  private drawNinjaCharacter(ctx: CanvasRenderingContext2D): void {
    const s = this.radius
    const x = this.x
    const y = this.y
    const moving = Math.abs(this.vx) > 0.3 || Math.abs(this.vy) > 0.3
    const legOffset = moving ? Math.sin(this.animFrame * 2) * s * 0.2 : 0
    const darkColor = this.team === 'red' ? '#B71C1C' : '#0D47A1'

    // 腿
    ctx.fillStyle = '#212121'
    ctx.fillRect(x - s * 0.2 - 1, y + s * 0.3 + legOffset, s * 0.16, s * 0.35)
    ctx.fillRect(x + s * 0.04 + 1, y + s * 0.3 - legOffset, s * 0.16, s * 0.35)

    // 鞋子
    ctx.fillStyle = '#111111'
    ctx.fillRect(x - s * 0.25 - 1, y + s * 0.6 + legOffset, s * 0.22, s * 0.1)
    ctx.fillRect(x - s * 0.01 + 1, y + s * 0.6 - legOffset, s * 0.22, s * 0.1)

    // 身体（黑色忍者服）
    ctx.fillStyle = '#212121'
    ctx.fillRect(x - s * 0.32, y - s * 0.3, s * 0.64, s * 0.65)
    ctx.strokeStyle = darkColor
    ctx.lineWidth = 1.5
    ctx.strokeRect(x - s * 0.32, y - s * 0.3, s * 0.64, s * 0.65)

    // 腰带
    ctx.fillStyle = this.color
    ctx.fillRect(x - s * 0.34, y + s * 0.05, s * 0.68, s * 0.08)

    // 手臂
    const armOffset = moving ? -legOffset * 0.8 : 0
    ctx.fillStyle = '#212121'
    ctx.fillRect(x - s * 0.48, y - s * 0.15 + armOffset, s * 0.12, s * 0.3)
    ctx.fillRect(x + s * 0.36, y - s * 0.15 - armOffset, s * 0.12, s * 0.3)

    // 头（黑色头巾）
    ctx.fillStyle = '#212121'
    ctx.beginPath()
    ctx.arc(x, y - s * 0.42, s * 0.24, 0, Math.PI * 2)
    ctx.fill()

    // 护额
    ctx.fillStyle = '#757575'
    ctx.fillRect(x - s * 0.26, y - s * 0.52, s * 0.52, s * 0.08)
    // 护额中间标志
    ctx.fillStyle = this.color
    ctx.fillRect(x - s * 0.06, y - s * 0.54, s * 0.12, s * 0.12)

    // 眼睛（露出的部分）
    const eyeDir = Math.cos(this.direction) > 0 ? 1 : -1
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(x + eyeDir * s * 0.02 - 2, y - s * 0.42, s * 0.14, s * 0.06)
    ctx.fillRect(x + eyeDir * s * 0.12 - 2, y - s * 0.42, s * 0.14, s * 0.06)
    // 瞳孔
    ctx.fillStyle = '#000000'
    ctx.fillRect(x + eyeDir * s * 0.06 - 1, y - s * 0.41, 2, 2)
    ctx.fillRect(x + eyeDir * s * 0.16 - 1, y - s * 0.41, 2, 2)

    // 编号
    ctx.fillStyle = '#FFFFFF'
    ctx.font = `bold ${s * 0.35}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.label.replace('P', ''), x, y + s * 0.05)

    this.drawArrow(ctx, s)
  }

  // ============ 猫猫 ============
  private drawCatCharacter(ctx: CanvasRenderingContext2D): void {
    const s = this.radius
    const x = this.x
    const y = this.y
    const moving = Math.abs(this.vx) > 0.3 || Math.abs(this.vy) > 0.3
    const legOffset = moving ? Math.sin(this.animFrame * 2) * s * 0.2 : 0
    const darkColor = this.team === 'red' ? '#B71C1C' : '#0D47A1'

    // 尾巴
    ctx.strokeStyle = this.color
    ctx.lineWidth = s * 0.12
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x + s * 0.3, y + s * 0.2)
    const tailWag = moving ? Math.sin(this.animFrame * 3) * s * 0.15 : 0
    ctx.quadraticCurveTo(x + s * 0.6, y - s * 0.1 + tailWag, x + s * 0.5, y - s * 0.4 + tailWag)
    ctx.stroke()

    // 腿
    ctx.fillStyle = this.color
    ctx.fillRect(x - s * 0.22 - 1, y + s * 0.3 + legOffset, s * 0.15, s * 0.25)
    ctx.fillRect(x + s * 0.07 + 1, y + s * 0.3 - legOffset, s * 0.15, s * 0.25)

    // 爪子
    ctx.fillStyle = '#FFCC80'
    ctx.fillRect(x - s * 0.25 - 1, y + s * 0.52 + legOffset, s * 0.2, s * 0.08)
    ctx.fillRect(x + s * 0.05 + 1, y + s * 0.52 - legOffset, s * 0.2, s * 0.08)

    // 身体
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.ellipse(x, y + s * 0.05, s * 0.32, s * 0.38, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = darkColor
    ctx.lineWidth = 1.5
    ctx.stroke()

    // 肚皮
    ctx.fillStyle = '#FFCC80'
    ctx.beginPath()
    ctx.ellipse(x, y + s * 0.12, s * 0.18, s * 0.22, 0, 0, Math.PI * 2)
    ctx.fill()

    // 头
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(x, y - s * 0.38, s * 0.28, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = darkColor
    ctx.lineWidth = 1.5
    ctx.stroke()

    // 耳朵
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.moveTo(x - s * 0.22, y - s * 0.52)
    ctx.lineTo(x - s * 0.12, y - s * 0.75)
    ctx.lineTo(x - s * 0.02, y - s * 0.52)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(x + s * 0.02, y - s * 0.52)
    ctx.lineTo(x + s * 0.12, y - s * 0.75)
    ctx.lineTo(x + s * 0.22, y - s * 0.52)
    ctx.fill()
    // 内耳
    ctx.fillStyle = '#FFAB91'
    ctx.beginPath()
    ctx.moveTo(x - s * 0.18, y - s * 0.52)
    ctx.lineTo(x - s * 0.12, y - s * 0.68)
    ctx.lineTo(x - s * 0.06, y - s * 0.52)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(x + s * 0.06, y - s * 0.52)
    ctx.lineTo(x + s * 0.12, y - s * 0.68)
    ctx.lineTo(x + s * 0.18, y - s * 0.52)
    ctx.fill()

    // 眼睛
    const eyeDir = Math.cos(this.direction) > 0 ? 1 : -1
    ctx.fillStyle = '#4CAF50'
    ctx.beginPath()
    ctx.ellipse(x + eyeDir * s * 0.05 - s * 0.06, y - s * 0.4, s * 0.07, s * 0.08, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(x + eyeDir * s * 0.05 + s * 0.08, y - s * 0.4, s * 0.07, s * 0.08, 0, 0, Math.PI * 2)
    ctx.fill()
    // 瞳孔（竖瞳）
    ctx.fillStyle = '#000000'
    ctx.fillRect(x + eyeDir * s * 0.05 - s * 0.07, y - s * 0.42, s * 0.02, s * 0.08)
    ctx.fillRect(x + eyeDir * s * 0.05 + s * 0.07, y - s * 0.42, s * 0.02, s * 0.08)

    // 鼻子
    ctx.fillStyle = '#FF8A80'
    ctx.beginPath()
    ctx.arc(x + eyeDir * s * 0.05, y - s * 0.32, s * 0.04, 0, Math.PI * 2)
    ctx.fill()

    // 嘴
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x + eyeDir * s * 0.05, y - s * 0.28)
    ctx.lineTo(x + eyeDir * s * 0.05 - s * 0.06, y - s * 0.22)
    ctx.moveTo(x + eyeDir * s * 0.05, y - s * 0.28)
    ctx.lineTo(x + eyeDir * s * 0.05 + s * 0.06, y - s * 0.22)
    ctx.stroke()

    // 胡须
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 1
    for (let i = -1; i <= 1; i += 2) {
      ctx.beginPath()
      ctx.moveTo(x + eyeDir * s * 0.12, y - s * 0.3 + i * s * 0.04)
      ctx.lineTo(x + eyeDir * s * 0.35, y - s * 0.3 + i * s * 0.1)
      ctx.stroke()
    }

    // 编号
    ctx.fillStyle = '#FFFFFF'
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.font = `bold ${s * 0.35}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.strokeText(this.label.replace('P', ''), x, y + s * 0.08)
    ctx.fillText(this.label.replace('P', ''), x, y + s * 0.08)

    this.drawArrow(ctx, s)
  }

  // ============ 外星人 ============
  private drawAlienCharacter(ctx: CanvasRenderingContext2D): void {
    const s = this.radius
    const x = this.x
    const y = this.y
    const moving = Math.abs(this.vx) > 0.3 || Math.abs(this.vy) > 0.3
    const legOffset = moving ? Math.sin(this.animFrame * 2) * s * 0.15 : 0

    // 腿
    ctx.fillStyle = '#388E3C'
    ctx.fillRect(x - s * 0.18 - 1, y + s * 0.25 + legOffset, s * 0.12, s * 0.3)
    ctx.fillRect(x + s * 0.06 + 1, y + s * 0.25 - legOffset, s * 0.12, s * 0.3)

    // 鞋子（发光）
    ctx.fillStyle = '#00E5FF'
    ctx.fillRect(x - s * 0.22 - 1, y + s * 0.52 + legOffset, s * 0.18, s * 0.08)
    ctx.fillRect(x + s * 0.04 + 1, y + s * 0.52 - legOffset, s * 0.18, s * 0.08)

    // 身体
    ctx.fillStyle = '#4CAF50'
    ctx.beginPath()
    ctx.ellipse(x, y + s * 0.05, s * 0.28, s * 0.35, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#388E3C'
    ctx.lineWidth = 1.5
    ctx.stroke()

    // 太空服条纹
    ctx.fillStyle = this.color + '80'
    ctx.fillRect(x - s * 0.2, y - s * 0.1, s * 0.4, s * 0.06)

    // 手臂
    const armOffset = moving ? -legOffset * 0.8 : 0
    ctx.fillStyle = '#4CAF50'
    ctx.fillRect(x - s * 0.42, y - s * 0.1 + armOffset, s * 0.1, s * 0.25)
    ctx.fillRect(x + s * 0.32, y - s * 0.1 - armOffset, s * 0.1, s * 0.25)

    // 头（大而圆）
    ctx.fillStyle = '#66BB6A'
    ctx.beginPath()
    ctx.ellipse(x, y - s * 0.4, s * 0.32, s * 0.3, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#4CAF50'
    ctx.lineWidth = 1.5
    ctx.stroke()

    // 大眼睛
    const eyeDir = Math.cos(this.direction) > 0 ? 1 : -1
    ctx.fillStyle = '#000000'
    ctx.beginPath()
    ctx.ellipse(x + eyeDir * s * 0.05 - s * 0.1, y - s * 0.42, s * 0.12, s * 0.16, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(x + eyeDir * s * 0.05 + s * 0.12, y - s * 0.42, s * 0.12, s * 0.16, 0, 0, Math.PI * 2)
    ctx.fill()
    // 眼睛高光
    ctx.fillStyle = '#00E5FF'
    ctx.beginPath()
    ctx.arc(x + eyeDir * s * 0.05 - s * 0.06, y - s * 0.46, s * 0.05, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(x + eyeDir * s * 0.05 + s * 0.16, y - s * 0.46, s * 0.05, 0, Math.PI * 2)
    ctx.fill()

    // 天线
    ctx.strokeStyle = '#4CAF50'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x - s * 0.12, y - s * 0.65)
    ctx.lineTo(x - s * 0.2, y - s * 0.85)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x + s * 0.12, y - s * 0.65)
    ctx.lineTo(x + s * 0.2, y - s * 0.85)
    ctx.stroke()
    // 天线球
    ctx.fillStyle = '#FF5722'
    ctx.beginPath()
    ctx.arc(x - s * 0.2, y - s * 0.87, s * 0.06, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(x + s * 0.2, y - s * 0.87, s * 0.06, 0, Math.PI * 2)
    ctx.fill()

    // 编号
    ctx.fillStyle = '#FFFFFF'
    ctx.font = `bold ${s * 0.35}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.label.replace('P', ''), x, y + s * 0.08)

    this.drawArrow(ctx, s)
  }

  // ============ 火柴人 ============
  private drawStickmanCharacter(ctx: CanvasRenderingContext2D): void {
    const s = this.radius
    const x = this.x
    const y = this.y
    const moving = Math.abs(this.vx) > 0.3 || Math.abs(this.vy) > 0.3
    const legOffset = moving ? Math.sin(this.animFrame * 2) * s * 0.3 : 0
    const armOffset = moving ? -legOffset * 0.8 : 0

    ctx.strokeStyle = this.color
    ctx.lineWidth = s * 0.1
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // 头
    ctx.beginPath()
    ctx.arc(x, y - s * 0.45, s * 0.18, 0, Math.PI * 2)
    ctx.stroke()
    // 头部填充
    ctx.fillStyle = '#FFCC80'
    ctx.fill()

    // 身体
    ctx.beginPath()
    ctx.moveTo(x, y - s * 0.27)
    ctx.lineTo(x, y + s * 0.2)
    ctx.stroke()

    // 手臂
    ctx.beginPath()
    ctx.moveTo(x - s * 0.35, y - s * 0.05 + armOffset)
    ctx.lineTo(x, y - s * 0.15)
    ctx.lineTo(x + s * 0.35, y - s * 0.05 - armOffset)
    ctx.stroke()

    // 腿
    ctx.beginPath()
    ctx.moveTo(x - s * 0.25, y + s * 0.5 + legOffset)
    ctx.lineTo(x, y + s * 0.2)
    ctx.lineTo(x + s * 0.25, y + s * 0.5 - legOffset)
    ctx.stroke()

    // 鞋子
    ctx.fillStyle = '#212121'
    ctx.beginPath()
    ctx.ellipse(x - s * 0.25, y + s * 0.52 + legOffset, s * 0.1, s * 0.04, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(x + s * 0.25, y + s * 0.52 - legOffset, s * 0.1, s * 0.04, 0, 0, Math.PI * 2)
    ctx.fill()

    // 眼睛
    const eyeDir = Math.cos(this.direction) > 0 ? 1 : -1
    ctx.fillStyle = '#000000'
    ctx.beginPath()
    ctx.arc(x + eyeDir * s * 0.04 - s * 0.05, y - s * 0.47, s * 0.03, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(x + eyeDir * s * 0.04 + s * 0.07, y - s * 0.47, s * 0.03, 0, Math.PI * 2)
    ctx.fill()

    // 笑嘴
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(x + eyeDir * s * 0.04, y - s * 0.38, s * 0.08, 0.1 * Math.PI, 0.9 * Math.PI)
    ctx.stroke()

    // 编号
    ctx.fillStyle = this.color
    ctx.font = `bold ${s * 0.4}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.label.replace('P', ''), x, y - s * 0.05)

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
      case 'ninja':
        tempPlayer.drawNinjaCharacter(ctx)
        break
      case 'cat':
        tempPlayer.drawCatCharacter(ctx)
        break
      case 'alien':
        tempPlayer.drawAlienCharacter(ctx)
        break
      case 'stickman':
        tempPlayer.drawStickmanCharacter(ctx)
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

    const dx = ballX - this.x
    const dy = ballY - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist === 0) {
      return { fx: 0, fy: 0 }
    }

    this.kickCooldown = GAME_PARAMS.kickCooldown * this.stats.kickCooldownMult

    this.kickEffect = {
      x: ballX,
      y: ballY,
      radius: 5,
      maxRadius: this.radius * 2,
      opacity: 1,
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
    this.burstVx = 0
    this.burstVy = 0
    this.teleportTrail = null
    this.pendingTeleport = null
  }
}
