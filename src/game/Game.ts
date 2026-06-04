import type { GameState, Team, CharacterType, GameModeType, SceneType, FieldSize, ColorConfig } from '../types'
import { GAME_PARAMS, FIELD_RATIO, FIELD_MARGIN, CHARACTER_TYPES, SCENE_TYPES, FIELD_SIZES, CLASSIC_COLORS, CYBER_COLORS, PIXEL_COLORS, POP_COLORS } from './constants'
import { Field } from './Field'
import { Player } from './Player'
import { Ball } from './Ball'
import { Physics } from './Physics'
import { InputManager } from './InputManager'
import { ScoreManager } from './ScoreManager'
import { SoundManager } from './SoundManager'
import { AIController } from './AIController'

interface MenuButton {
  x: number
  y: number
  width: number
  height: number
  label: string
  value: number | string
  group: string
}

export class Game {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  field!: Field
  players: Player[] = []
  ball!: Ball
  scoreManager!: ScoreManager
  inputManager: InputManager
  soundManager: SoundManager
  state: GameState
  winScore: number
  playerSpeed: number
  gameMode: GameModeType = 'duo'
  player1Char: CharacterType = 'pixel'
  player2Char: CharacterType = 'pixel'
  player3Char: CharacterType = 'pixel'
  sceneType: SceneType = 'classic'
  fieldSize: FieldSize = 'standard'
  private aiController: AIController | null = null
  private goalTimer: number = 0
  private goalTeam: Team | null = null
  private goalFlash: number = 0
  private goalScored: boolean = false
  private animationId: number = 0
  private menuButtons: MenuButton[] = []
  private isGameInited: boolean = false

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.inputManager = new InputManager()
    this.soundManager = new SoundManager()
    this.state = 'modeSelect'
    this.winScore = GAME_PARAMS.defaultWinScore
    this.playerSpeed = GAME_PARAMS.playerSpeed

    this.resize(false)
    this.setupMenuButtons()
    this.setupClickHandler()

    window.addEventListener('resize', () => this.resize(true))

    this.renderLoop()
  }

  private getColors(): ColorConfig {
    switch (this.sceneType) {
      case 'cyber': return CYBER_COLORS
      case 'pixel': return PIXEL_COLORS
      case 'pop':   return POP_COLORS
      default:      return CLASSIC_COLORS
    }
  }

  private getEntityScale(): number {
    return FIELD_SIZES.find(f => f.type === this.fieldSize)?.entityScale ?? 1
  }

  private resize(isResize: boolean): void {
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    const margin = FIELD_MARGIN

    this.canvas.width = windowWidth
    this.canvas.height = windowHeight

    let fieldWidth = windowWidth * (1 - margin * 2)
    let fieldHeight = fieldWidth / FIELD_RATIO

    if (fieldHeight > windowHeight * (1 - margin * 2)) {
      fieldHeight = windowHeight * (1 - margin * 2)
      fieldWidth = fieldHeight * FIELD_RATIO
    }

    const scale = fieldWidth / 800
    const goalWidth = GAME_PARAMS.goalWidth * scale
    const totalWidth = fieldWidth + goalWidth * 2
    const offsetX = (windowWidth - totalWidth) / 2
    const offsetY = (windowHeight - fieldHeight) / 2

    const oldField = this.field
    const colors = this.getColors()
    this.field = new Field(offsetX + goalWidth, offsetY, fieldWidth, fieldHeight, goalWidth, GAME_PARAMS.goalHeight * scale, this.sceneType, colors)

    if (isResize && this.isGameInited && oldField && this.players.length > 0) {
      const scaleX = this.field.width / oldField.width
      const scaleY = this.field.height / oldField.height

      for (const player of this.players) {
        player.x = (player.x - oldField.x) * scaleX + this.field.x
        player.y = (player.y - oldField.y) * scaleY + this.field.y
        player.radius = GAME_PARAMS.playerRadius * scale * this.getEntityScale()
      }

      this.ball.x = (this.ball.x - oldField.x) * scaleX + this.field.x
      this.ball.y = (this.ball.y - oldField.y) * scaleY + this.field.y
      this.ball.radius = GAME_PARAMS.ballRadius * scale * this.getEntityScale()
    }

    this.setupMenuButtons()
  }

  private initGame(): void {
    const center = this.field.getCenter()
    const bounds = this.field.getBounds()
    const scale = bounds.width / 800
    const eScale = this.getEntityScale()
    const playerOffset = bounds.width * 0.3
    const pRadius = GAME_PARAMS.playerRadius * scale * eScale

    const colors = this.getColors()

    if (this.gameMode === 'duo' || this.gameMode === 'ai') {
      this.players = [
        new Player(center.x - playerOffset, center.y, 'red', '1P', this.player1Char, 'keyboard', colors),
        new Player(center.x + playerOffset, center.y, 'blue', '2P', this.player2Char, 'keyboard', colors),
      ]
    } else {
      this.players = [
        new Player(center.x - playerOffset * 1.2, center.y, 'red', '1P', this.player1Char, 'keyboard', colors),
        new Player(center.x - playerOffset * 0.4, center.y, 'red', '2P', this.player2Char, 'keyboard', colors),
        new Player(center.x + playerOffset, center.y, 'blue', '3P', this.player3Char, 'mouse', colors),
      ]
    }

    // AI 模式初始化 AI 控制器
    this.aiController = this.gameMode === 'ai' ? new AIController(0.7) : null

    for (const player of this.players) {
      player.radius = pRadius
    }

    const ballY = this.field.y + Math.random() * this.field.height
    this.ball = new Ball(center.x, ballY, this.getColors(), this.sceneType)
    this.ball.radius = GAME_PARAMS.ballRadius * scale * eScale

    this.scoreManager = new ScoreManager(this.winScore)
    this.isGameInited = true
  }

  // ============ 按钮布局 ============
  private setupMenuButtons(): void {
    const cx = this.canvas.width / 2
    const cy = this.canvas.height / 2
    const btnW = 50
    const btnH = 32
    const gap = 8

    this.menuButtons = []

    if (this.state === 'charSelect') {
      // 人物选择页
      const charBtnSize = 50
      const charGap = 10
      const playerSectionHeight = 110  // 每个玩家区域的高度
      const charCy = cy - 40

      // 玩家1
      const c1x = cx - 200
      const c1y = charCy - 50
      CHARACTER_TYPES.forEach((c, i) => {
        this.menuButtons.push({ x: c1x + i * (charBtnSize + charGap), y: c1y, width: charBtnSize, height: charBtnSize, label: c.label, value: c.type, group: 'char1' })
      })

      // 玩家2
      const c2x = cx - 200
      const c2y = c1y + playerSectionHeight
      CHARACTER_TYPES.forEach((c, i) => {
        this.menuButtons.push({ x: c2x + i * (charBtnSize + charGap), y: c2y, width: charBtnSize, height: charBtnSize, label: c.label, value: c.type, group: 'char2' })
      })

      // 玩家3（三人模式）
      if (this.gameMode === 'trio') {
        const c3x = cx - 200
        const c3y = c2y + playerSectionHeight
        CHARACTER_TYPES.forEach((c, i) => {
          this.menuButtons.push({ x: c3x + i * (charBtnSize + charGap), y: c3y, width: charBtnSize, height: charBtnSize, label: c.label, value: c.type, group: 'char3' })
        })
      }

    } else if (this.state === 'settings') {
      // 游戏设置页
      const rowGap = 65
      const settingsCy = cy - 40

      // 场景
      const sceneY = settingsCy - 48
      const sceneTotalWidth = SCENE_TYPES.length * (btnW + gap) - gap
      const sceneStartX = cx - sceneTotalWidth / 2 + btnW / 2
      SCENE_TYPES.forEach((s, i) => {
        this.menuButtons.push({ x: sceneStartX + i * (btnW + gap), y: sceneY, width: btnW, height: btnH, label: s.label, value: s.type, group: 'scene' })
      })

      // 场地大小
      const fSizeY = sceneY + rowGap
      FIELD_SIZES.forEach((s, i) => {
        this.menuButtons.push({ x: cx - 67 + i * (btnW + gap), y: fSizeY, width: btnW, height: btnH, label: s.label, value: s.type, group: 'fieldSize' })
      })

      // 胜利分数
      const winY = fSizeY + rowGap
      const winScores = GAME_PARAMS.winScoreOptions
      const wsx = cx - ((btnW + gap) * winScores.length) / 2 + btnW / 2
      winScores.forEach((score, i) => {
        this.menuButtons.push({ x: wsx + i * (btnW + gap), y: winY, width: btnW, height: btnH, label: score === Infinity ? '∞' : `${score}`, value: score, group: 'winScore' })
      })

      // 移动速度
      const spdY = winY + rowGap
      const speeds = GAME_PARAMS.speedOptions
      const speedLabels = ['慢', '普', '快', '极']
      const spx = cx - ((btnW + gap) * speeds.length) / 2 + btnW / 2
      speeds.forEach((speed, i) => {
        this.menuButtons.push({ x: spx + i * (btnW + gap), y: spdY, width: btnW, height: btnH, label: speedLabels[i], value: speed, group: 'speed' })
      })
    }
  }

  private setupClickHandler(): void {
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const cx = this.canvas.width / 2
      const cy = this.canvas.height / 2

      // 模式选择页
      if (this.state === 'modeSelect') {
        const modeCy = cy - 40
        if (this.hitBtn(mx, my, cx - 120, modeCy - 30, 240, 60)) {
          this.gameMode = 'duo'
          this.state = 'charSelect'
          this.setupMenuButtons()
        }
        if (this.hitBtn(mx, my, cx - 120, modeCy + 50, 240, 60)) {
          this.gameMode = 'trio'
          this.state = 'charSelect'
          this.setupMenuButtons()
        }
        if (this.hitBtn(mx, my, cx - 120, modeCy + 130, 240, 60)) {
          this.gameMode = 'ai'
          this.state = 'charSelect'
          this.setupMenuButtons()
        }
        return
      }

      // 人物选择页
      if (this.state === 'charSelect') {
        for (const btn of this.menuButtons) {
          if (this.hitBtn(mx, my, btn.x - btn.width / 2, btn.y - btn.height / 2, btn.width, btn.height)) {
            if (btn.group === 'char1') this.player1Char = btn.value as CharacterType
            else if (btn.group === 'char2') this.player2Char = btn.value as CharacterType
            else if (btn.group === 'char3') this.player3Char = btn.value as CharacterType
          }
        }
        // 计算按钮位置
        const charCy = cy - 40
        const charInfoY = this.gameMode === 'trio' ? charCy + 200 : charCy + 150
        const charBtnY = charInfoY + 30
        // 下一步按钮
        if (this.hitBtn(mx, my, cx - 70, charBtnY, 140, 40)) {
          this.state = 'settings'
          this.setupMenuButtons()
        }
        // 返回
        if (this.hitBtn(mx, my, cx - 60, charBtnY + 40, 120, 25)) {
          this.state = 'modeSelect'
          this.setupMenuButtons()
        }
        return
      }

      // 游戏设置页
      if (this.state === 'settings') {
        for (const btn of this.menuButtons) {
          if (this.hitBtn(mx, my, btn.x - btn.width / 2, btn.y - btn.height / 2, btn.width, btn.height)) {
            if (btn.group === 'scene') {
              this.sceneType = btn.value as SceneType
              this.resize(false)
            } else if (btn.group === 'fieldSize') {
              this.fieldSize = btn.value as FieldSize
              this.resize(false)
            } else if (btn.group === 'winScore') {
              this.setWinScore(btn.value as number)
            } else if (btn.group === 'speed') {
              this.playerSpeed = btn.value as number
            }
          }
        }
        const settingsCy = cy - 40
        // 开始游戏按钮
        if (this.hitBtn(mx, my, cx - 80, settingsCy + 195, 160, 45)) {
          this.start()
        }
        // 返回
        if (this.hitBtn(mx, my, cx - 60, settingsCy + 250, 120, 25)) {
          this.state = 'charSelect'
          this.setupMenuButtons()
        }
        return
      }

      // 游戏结束页
      if (this.state === 'gameover') {
        // 再来一局
        if (this.hitBtn(mx, my, cx - 80, cy + 55, 160, 40)) {
          this.restart()
        }
        // 返回菜单
        if (this.hitBtn(mx, my, cx - 80, cy + 105, 160, 40)) {
          this.state = 'modeSelect'
          this.setupMenuButtons()
        }
        return
      }
    })
  }

  private hitBtn(mx: number, my: number, x: number, y: number, w: number, h: number): boolean {
    return mx >= x && mx <= x + w && my >= y && my <= y + h
  }

  // ============ 游戏循环 ============
  private renderLoop = (): void => {
    if (this.state === 'playing' || this.state === 'goal') {
      this.update()
    }

    this.handleMenuInput()
    this.inputManager.clearJustPressed()

    this.render()
    this.animationId = requestAnimationFrame(this.renderLoop)
  }

  private update(): void {
    if (this.state === 'goal') {
      this.goalTimer -= 16.67
      if (this.goalTimer <= 0) {
        this.goalScored = false
        if (this.scoreManager.isGameOver()) {
          this.state = 'gameover'
        } else {
          this.resetPositions()
          this.state = 'playing'
        }
      }
      return
    }

    this.handleInput()

    for (const player of this.players) {
      player.update(1)
      player.constrainToBounds(this.field.getBounds())
    }

    this.ball.update(1)
    this.handleCollisions()
    this.checkGoals()
  }

  private handleInput(): void {
    const eScale = this.getEntityScale()
    const speed = this.playerSpeed * eScale

    const p1Input = this.inputManager.getPlayerInput('player1')
    this.players[0].vx = p1Input.vx * speed
    this.players[0].vy = p1Input.vy * speed
    if (p1Input.kick) this.tryKick(this.players[0])

    // 玩家2：AI 或 键盘
    if (this.gameMode === 'ai' && this.aiController) {
      const aiInput = this.aiController.update(1, this.players[1], this.ball, this.field, this.field.leftGoal, this.field.rightGoal)
      this.players[1].vx = aiInput.vx * speed
      this.players[1].vy = aiInput.vy * speed
      if (aiInput.kick) this.tryKick(this.players[1], aiInput.kickTarget ?? undefined)
    } else {
      const p2Input = this.inputManager.getPlayerInput('player2')
      this.players[1].vx = p2Input.vx * speed
      this.players[1].vy = p2Input.vy * speed
      if (p2Input.kick) this.tryKick(this.players[1])
    }

    if (this.gameMode === 'trio' && this.players.length >= 3) {
      const p3 = this.players[2]
      const mouseMaxSpeed = speed * 0.8
      const mouseInput = this.inputManager.getMouseInput(p3.x, p3.y, mouseMaxSpeed)
      p3.vx = mouseInput.vx
      p3.vy = mouseInput.vy
      if (mouseInput.kick) this.tryKick(p3)
    }
  }

  private tryKick(player: Player, target?: { x: number; y: number }): void {
    const dx = this.ball.x - player.x
    const dy = this.ball.y - player.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < player.radius + this.ball.radius + 10) {
      if (!player.canKick()) return

      // 踢球特效和冷却（通过 player.kick 触发）
      const defaultForce = player.kick(this.ball.x, this.ball.y)

      // 如果有目标（AI模式），朝目标踢；否则用默认方向
      let forceX = defaultForce.fx
      let forceY = defaultForce.fy
      if (target) {
        const tdx = target.x - this.ball.x
        const tdy = target.y - this.ball.y
        const tDist = Math.sqrt(tdx * tdx + tdy * tdy)
        if (tDist > 0) {
          const kickForce = GAME_PARAMS.kickForce
          forceX = (tdx / tDist) * kickForce
          forceY = (tdy / tDist) * kickForce
        }
      }

      this.ball.applyForce(forceX, forceY)
      this.ball.justKicked = 3
      this.ball.lastKickedByTeam = player.team
      this.soundManager.playKick()
    }
  }

  private handleCollisions(): void {
    for (const player of this.players) {
      if (Physics.playerBallCollision(player, this.ball)) {
        Physics.resolvePlayerBallCollision(player, this.ball)
      }
    }

    for (let i = 0; i < this.players.length; i++) {
      for (let j = i + 1; j < this.players.length; j++) {
        if (Physics.playerPlayerCollision(this.players[i], this.players[j])) {
          Physics.resolvePlayerPlayerCollision(this.players[i], this.players[j])
        }
      }
    }

    this.ball.constrainToBoundsWithGoals(this.field.getBounds(), this.field.leftGoal, this.field.rightGoal)
  }

  private checkGoals(): void {
    if (this.goalScored) return

    if (Physics.isBallInGoal(this.ball, this.field.leftGoal)) {
      this.onGoal('blue')
    } else if (Physics.isBallInGoal(this.ball, this.field.rightGoal)) {
      this.onGoal('red')
    }
  }

  private onGoal(team: Team): void {
    this.scoreManager.addGoal(team)
    this.goalTeam = team
    this.state = 'goal'
    this.goalTimer = GAME_PARAMS.goalResetDelay
    this.goalFlash = 1
    this.goalScored = true
    this.soundManager.playGoal()

    // 立即把球移到中线随机位置，防止重复触发
    const center = this.field.getCenter()
    const ballY = this.field.y + Math.random() * this.field.height
    this.ball.reset(center.x, ballY)
  }

  private resetPositions(): void {
    const center = this.field.getCenter()
    const bounds = this.field.getBounds()
    const playerOffset = bounds.width * 0.3

    if (this.gameMode === 'trio') {
      this.players[0].reset(center.x - playerOffset * 1.2, center.y)
      this.players[1].reset(center.x - playerOffset * 0.4, center.y)
      this.players[2].reset(center.x + playerOffset, center.y)
    } else {
      this.players[0].reset(center.x - playerOffset, center.y)
      this.players[1].reset(center.x + playerOffset, center.y)
    }

    const ballY = this.field.y + Math.random() * this.field.height
    this.ball.reset(center.x, ballY)
  }

  // ============ 渲染 ============
  private render(): void {
    const ctx = this.ctx
    const colors = this.getColors()

    ctx.fillStyle = colors.background
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    this.field.render(ctx)

    if (this.ball) this.ball.render(ctx)
    for (const player of this.players) player.render(ctx)

    if (this.gameMode === 'trio' && this.state === 'playing') {
      this.drawMouseCursor(ctx)
    }

    if (this.state !== 'modeSelect' && this.state !== 'charSelect' && this.state !== 'settings') {
      this.drawHUD(ctx)
    }

    // 菜单页面背景虚化
    if (this.state === 'modeSelect' || this.state === 'charSelect' || this.state === 'settings') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }

    if (this.state === 'goal') this.drawGoalText(ctx)
    else if (this.state === 'gameover') this.drawGameOver(ctx)
    else if (this.state === 'modeSelect') this.drawModeSelect(ctx)
    else if (this.state === 'charSelect') this.drawCharSelect(ctx)
    else if (this.state === 'settings') this.drawSettings(ctx)
    else if (this.state === 'paused') this.drawPaused(ctx)
  }

  private drawHUD(ctx: CanvasRenderingContext2D): void {
    const colors = this.getColors()
    const centerX = this.canvas.width / 2
    const y = 30

    ctx.fillStyle = colors.scoreBg
    ctx.beginPath()
    ctx.roundRect(centerX - 60, y - 20, 120, 40, 8)
    ctx.fill()

    ctx.fillStyle = colors.text
    ctx.font = 'bold 24px "Segoe UI", "Microsoft YaHei", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.scoreManager.getScoreText(), centerX, y)

    const winText = this.winScore === Infinity ? '∞' : `${this.winScore}`
    ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif'
    ctx.fillStyle = colors.text + '80'
    const modeText = this.gameMode === 'trio' ? '2v1 ' : this.gameMode === 'ai' ? 'vs AI ' : ''
    ctx.fillText(`${modeText}先得 ${winText} 分`, centerX, y + 22)

    if (this.gameMode === 'trio') {
      ctx.font = '11px "Segoe UI", "Microsoft YaHei", sans-serif'
      ctx.fillStyle = colors.player1
      ctx.textAlign = 'left'
      ctx.fillText('红队: 1P+2P (键盘)', 10, 18)
      ctx.fillStyle = colors.player2
      ctx.textAlign = 'right'
      ctx.fillText('蓝队: 3P (鼠标)', this.canvas.width - 10, 18)
    }
  }

  private drawGoalText(ctx: CanvasRenderingContext2D): void {
    if (this.goalFlash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.goalFlash * 0.6})`
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
      this.goalFlash -= 0.03
    }

    const shake = this.goalFlash > 0 ? (Math.random() - 0.5) * 8 * this.goalFlash : 0
    ctx.save()
    ctx.translate(shake, shake)

    ctx.fillStyle = '#00000080'
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    const colors = this.getColors()
    const teamColor = this.goalTeam === 'red' ? colors.player1 : colors.player2

    ctx.shadowColor = teamColor
    ctx.shadowBlur = 20
    ctx.fillStyle = teamColor
    ctx.font = 'bold 56px "Segoe UI", "Microsoft YaHei", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('⚽ GOAL!', this.canvas.width / 2, this.canvas.height / 2 - 10)
    ctx.shadowBlur = 0

    ctx.fillStyle = colors.text
    ctx.font = 'bold 24px "Segoe UI", "Microsoft YaHei", sans-serif'
    const teamName = this.goalTeam === 'red' ? '红队 🔴' : '蓝队 🔵'
    ctx.fillText(`${teamName} 得分!`, this.canvas.width / 2, this.canvas.height / 2 + 40)

    ctx.font = '16px "Segoe UI", "Microsoft YaHei", sans-serif'
    ctx.fillStyle = '#ffffff80'
    ctx.fillText(this.scoreManager.getScoreText(), this.canvas.width / 2, this.canvas.height / 2 + 70)

    ctx.restore()
  }

  private drawGameOver(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#00000090'
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    const centerX = this.canvas.width / 2
    const centerY = this.canvas.height / 2
    const colors = this.getColors()

    const winner = this.scoreManager.getWinner()
    const winnerName = winner === 'red' ? '红队 🔴' : '蓝队 🔵'
    const winnerColor = winner === 'red' ? colors.player1 : colors.player2

    ctx.shadowColor = winnerColor
    ctx.shadowBlur = 15
    ctx.fillStyle = colors.text
    ctx.font = 'bold 56px "Segoe UI", "Microsoft YaHei", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🏆', centerX, centerY - 70)
    ctx.shadowBlur = 0

    ctx.fillStyle = winnerColor
    ctx.font = 'bold 36px "Segoe UI", "Microsoft YaHei", sans-serif'
    ctx.fillText(`${winnerName} 获胜!`, centerX, centerY - 10)

    ctx.fillStyle = colors.text
    ctx.font = 'bold 28px "Segoe UI", "Microsoft YaHei", sans-serif'
    ctx.fillText(this.scoreManager.getScoreText(), centerX, centerY + 30)

    // 再来一局
    ctx.fillStyle = '#4CAF5030'
    ctx.strokeStyle = '#4CAF50'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(centerX - 80, centerY + 55, 160, 40, 10)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#4CAF50'
    ctx.font = 'bold 18px "Segoe UI", "Microsoft YaHei", sans-serif'
    ctx.fillText('再来一局 [R]', centerX, centerY + 75)

    // 返回菜单
    ctx.fillStyle = '#FF980030'
    ctx.strokeStyle = '#FF9800'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(centerX - 80, centerY + 105, 160, 40, 10)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#FF9800'
    ctx.font = 'bold 18px "Segoe UI", "Microsoft YaHei", sans-serif'
    ctx.fillText('返回菜单 [ESC]', centerX, centerY + 125)
  }

  private drawMouseCursor(ctx: CanvasRenderingContext2D): void {
    const mx = this.inputManager.mouseX
    const my = this.inputManager.mouseY
    const size = 12
    const gap = 4
    const colors = this.getColors()

    ctx.strokeStyle = colors.player2
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(mx, my, size, 0, Math.PI * 2)
    ctx.stroke()

    ctx.fillStyle = colors.player2
    ctx.beginPath()
    ctx.arc(mx, my, 2, 0, Math.PI * 2)
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(mx - size - gap, my); ctx.lineTo(mx - gap, my)
    ctx.moveTo(mx + gap, my); ctx.lineTo(mx + size + gap, my)
    ctx.moveTo(mx, my - size - gap); ctx.lineTo(mx, my - gap)
    ctx.moveTo(mx, my + gap); ctx.lineTo(mx, my + size + gap)
    ctx.stroke()

    ctx.fillStyle = colors.player2
    ctx.font = 'bold 10px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText('3P', mx, my + size + gap + 2)
  }

  private drawPaused(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#00000060'
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    ctx.fillStyle = this.getColors().text
    ctx.font = 'bold 48px "Segoe UI", "Microsoft YaHei", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('⏸ 暂停', this.canvas.width / 2, this.canvas.height / 2)

    ctx.font = '18px "Segoe UI", "Microsoft YaHei", sans-serif'
    ctx.fillText('按 P 继续 | ESC 返回菜单', this.canvas.width / 2, this.canvas.height / 2 + 40)
  }

  // ============ 页面1：模式选择 ============
  private drawModeSelect(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#00000080'
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    const cx = this.canvas.width / 2
    const cy = this.canvas.height / 2 - 40

    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 48px "Segoe UI", "Microsoft YaHei", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('⚽ 足球对战', cx, cy - 100)

    // 双人模式
    ctx.fillStyle = '#4CAF5030'
    ctx.strokeStyle = '#4CAF50'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(cx - 120, cy - 30, 240, 60, 12)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#4CAF50'
    ctx.font = 'bold 22px "Segoe UI", "Microsoft YaHei", sans-serif'
    ctx.fillText('双人对战', cx, cy - 10)
    ctx.font = '14px "Segoe UI", "Microsoft YaHei", sans-serif'
    ctx.fillStyle = '#ffffffaa'
    ctx.fillText('键盘 vs 键盘', cx, cy + 14)

    // 三人模式
    ctx.fillStyle = '#FF980030'
    ctx.strokeStyle = '#FF9800'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(cx - 120, cy + 50, 240, 60, 12)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#FF9800'
    ctx.font = 'bold 22px "Segoe UI", "Microsoft YaHei", sans-serif'
    ctx.fillText('三人对战', cx, cy + 70)
    ctx.font = '14px "Segoe UI", "Microsoft YaHei", sans-serif'
    ctx.fillStyle = '#ffffffaa'
    ctx.fillText('键盘+键盘 vs 鼠标 (2v1)', cx, cy + 94)

    // 人机模式
    ctx.fillStyle = '#9C27B030'
    ctx.strokeStyle = '#9C27B0'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(cx - 120, cy + 130, 240, 60, 12)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#9C27B0'
    ctx.font = 'bold 22px "Segoe UI", "Microsoft YaHei", sans-serif'
    ctx.fillText('人机对战', cx, cy + 150)
    ctx.font = '14px "Segoe UI", "Microsoft YaHei", sans-serif'
    ctx.fillStyle = '#ffffffaa'
    ctx.fillText('键盘 vs AI', cx, cy + 174)

    ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif'
    ctx.fillStyle = '#ffffff60'
    ctx.fillText('点击选择模式', cx, cy + 215)
  }

  // ============ 页面2：人物选择 ============
  private drawCharSelect(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#00000080'
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    const cx = this.canvas.width / 2
    const cy = this.canvas.height / 2 - 40
    const colors = this.getColors()
    const modeName = this.gameMode === 'trio' ? '三人对战' : this.gameMode === 'ai' ? '人机对战' : '双人对战'
    const playerSectionHeight = 110

    // 标题
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 40px "Segoe UI", "Microsoft YaHei", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`⚽ ${modeName} — 选择角色`, cx, cy - 130)

    // 玩家1 红队
    const p1LabelY = cy - 85
    ctx.fillStyle = colors.player1
    ctx.font = 'bold 16px "Segoe UI", "Microsoft YaHei", sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('🔴 玩家1 红队 (键盘)', cx - 200, p1LabelY)
    for (const btn of this.menuButtons.filter(b => b.group === 'char1')) {
      this.drawCharButton(ctx, btn, btn.value === this.player1Char, colors.player1)
      Player.drawPreview(ctx, btn.x, btn.y + 2, 16, btn.value as CharacterType, 'red', colors)
    }

    // 玩家2 / AI
    const p2LabelY = p1LabelY + playerSectionHeight
    if (this.gameMode === 'ai') {
      ctx.fillStyle = colors.player2
      ctx.font = 'bold 16px "Segoe UI", "Microsoft YaHei", sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('🔵 AI 蓝队', cx - 200, p2LabelY)
      for (const btn of this.menuButtons.filter(b => b.group === 'char2')) {
        this.drawCharButton(ctx, btn, btn.value === this.player2Char, colors.player2)
        Player.drawPreview(ctx, btn.x, btn.y + 2, 16, btn.value as CharacterType, 'blue', colors)
      }
    } else {
      const p2color = this.gameMode === 'trio' ? colors.player1 : colors.player2
      const p2label = this.gameMode === 'trio' ? '🔴 玩家2 红队 (键盘)' : '🔵 玩家2 蓝队 (键盘)'
      ctx.fillStyle = p2color
      ctx.font = 'bold 16px "Segoe UI", "Microsoft YaHei", sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(p2label, cx - 200, p2LabelY)
      for (const btn of this.menuButtons.filter(b => b.group === 'char2')) {
        this.drawCharButton(ctx, btn, btn.value === this.player2Char, p2color)
        const team = this.gameMode === 'trio' ? 'red' : 'blue'
        Player.drawPreview(ctx, btn.x, btn.y + 2, 16, btn.value as CharacterType, team as Team, colors)
      }
    }

    // 玩家3（三人模式）
    if (this.gameMode === 'trio') {
      const p3LabelY = p2LabelY + playerSectionHeight
      ctx.fillStyle = colors.player2
      ctx.font = 'bold 16px "Segoe UI", "Microsoft YaHei", sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('🔵 玩家3 蓝队 (鼠标)', cx - 200, p3LabelY)
      for (const btn of this.menuButtons.filter(b => b.group === 'char3')) {
        this.drawCharButton(ctx, btn, btn.value === this.player3Char, colors.player2)
        Player.drawPreview(ctx, btn.x, btn.y + 2, 16, btn.value as CharacterType, 'blue', colors)
      }
    }

    // 操作说明
    const infoY = this.gameMode === 'trio' ? cy + 200 : cy + 150
    ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif'
    ctx.fillStyle = '#ffffffaa'
    ctx.textAlign = 'center'
    if (this.gameMode === 'trio') {
      ctx.fillText('1P: WASD+空格 | 2P: 方向键+Enter | 3P: 鼠标移动+点击', cx, infoY)
    } else if (this.gameMode === 'ai') {
      ctx.fillText('1P: WASD+空格 踢球 | AI 自动控制蓝队', cx, infoY)
    } else {
      ctx.fillText('1P: WASD+空格 | 2P: 方向键+Enter', cx, infoY)
    }

    // 下一步按钮
    const btnY = infoY + 30
    ctx.fillStyle = '#4CAF5030'
    ctx.strokeStyle = '#4CAF50'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(cx - 70, btnY, 140, 40, 10)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#4CAF50'
    ctx.font = 'bold 18px "Segoe UI", "Microsoft YaHei", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('下一步 →', cx, btnY + 20)

    // 返回
    ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif'
    ctx.fillStyle = '#ffffff60'
    ctx.fillText('← 返回模式选择', cx, btnY + 50)
  }

  // ============ 页面3：游戏设置 ============
  private drawSettings(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#00000080'
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    const cx = this.canvas.width / 2
    const cy = this.canvas.height / 2 - 40

    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 36px "Segoe UI", "Microsoft YaHei", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('游戏设置', cx, cy - 120)

    // 场景
    ctx.font = '16px "Segoe UI", "Microsoft YaHei", sans-serif'
    ctx.fillStyle = '#ffffffcc'
    ctx.fillText('选择场景', cx, cy - 78)
    for (const btn of this.menuButtons.filter(b => b.group === 'scene')) {
      this.drawSmallButton(ctx, btn, btn.value === this.sceneType, '#E040FB')
    }

    // 场地大小
    ctx.font = '16px "Segoe UI", "Microsoft YaHei", sans-serif'
    ctx.fillStyle = '#ffffffcc'
    ctx.fillText('场地大小（人物等比缩放）', cx, cy - 13)
    for (const btn of this.menuButtons.filter(b => b.group === 'fieldSize')) {
      this.drawSmallButton(ctx, btn, btn.value === this.fieldSize, '#76FF03')
    }

    // 胜利分数
    ctx.font = '16px "Segoe UI", "Microsoft YaHei", sans-serif'
    ctx.fillStyle = '#ffffffcc'
    ctx.fillText('胜利分数', cx, cy + 52)
    for (const btn of this.menuButtons.filter(b => b.group === 'winScore')) {
      this.drawSmallButton(ctx, btn, btn.value === this.winScore, '#FFD700')
    }

    // 移动速度
    ctx.font = '16px "Segoe UI", "Microsoft YaHei", sans-serif'
    ctx.fillStyle = '#ffffffcc'
    ctx.fillText('移动速度', cx, cy + 117)
    for (const btn of this.menuButtons.filter(b => b.group === 'speed')) {
      this.drawSmallButton(ctx, btn, btn.value === this.playerSpeed, '#4FC3F7')
    }

    // 开始游戏
    ctx.fillStyle = '#FFD70030'
    ctx.strokeStyle = '#FFD700'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.roundRect(cx - 80, cy + 195, 160, 45, 12)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 22px "Segoe UI", "Microsoft YaHei", sans-serif'
    ctx.fillText('开始游戏', cx, cy + 218)

    // 返回
    ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif'
    ctx.fillStyle = '#ffffff60'
    ctx.fillText('← 返回角色选择', cx, cy + 265)
  }

  // ============ 按钮绘制 ============
  private drawCharButton(ctx: CanvasRenderingContext2D, btn: MenuButton, isSelected: boolean, activeColor: string): void {
    const halfW = btn.width / 2
    const halfH = btn.height / 2

    ctx.fillStyle = isSelected ? activeColor + '30' : '#ffffff10'
    ctx.beginPath()
    ctx.roundRect(btn.x - halfW, btn.y - halfH, btn.width, btn.height, 8)
    ctx.fill()

    ctx.strokeStyle = isSelected ? activeColor : '#ffffff40'
    ctx.lineWidth = isSelected ? 2.5 : 1
    ctx.beginPath()
    ctx.roundRect(btn.x - halfW, btn.y - halfH, btn.width, btn.height, 8)
    ctx.stroke()

    ctx.fillStyle = isSelected ? activeColor : '#ffffffaa'
    ctx.font = '10px "Segoe UI", "Microsoft YaHei", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    ctx.fillText(btn.label, btn.x, btn.y + halfH - 2)
  }

  private drawSmallButton(ctx: CanvasRenderingContext2D, btn: MenuButton, isSelected: boolean, activeColor: string): void {
    const halfW = btn.width / 2
    const halfH = btn.height / 2

    ctx.fillStyle = isSelected ? activeColor + '30' : 'transparent'
    ctx.strokeStyle = isSelected ? activeColor : '#ffffff40'
    ctx.lineWidth = isSelected ? 2 : 1

    ctx.beginPath()
    ctx.roundRect(btn.x - halfW, btn.y - halfH, btn.width, btn.height, 6)
    if (isSelected) ctx.fill()
    ctx.stroke()

    ctx.fillStyle = isSelected ? activeColor : '#ffffffcc'
    ctx.font = 'bold 16px "Segoe UI", "Microsoft YaHei", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(btn.label, btn.x, btn.y)
  }

  // ============ 输入处理 ============
  private handleMenuInput(): void {
    if (this.state === 'modeSelect') {
      this.canvas.style.cursor = 'default'
      // Enter 快速开始：默认双人模式
      if (this.inputManager.isJustPressed('Enter')) {
        this.gameMode = 'duo'
        this.state = 'charSelect'
        this.setupMenuButtons()
      }
    } else if (this.state === 'charSelect') {
      this.canvas.style.cursor = 'default'
      if (this.inputManager.isJustPressed('Escape')) {
        this.state = 'modeSelect'
        this.setupMenuButtons()
      }
      // Enter 跳过角色选择，用默认值
      if (this.inputManager.isJustPressed('Enter')) {
        this.state = 'settings'
        this.setupMenuButtons()
      }
    } else if (this.state === 'settings') {
      this.canvas.style.cursor = 'default'
      if (this.inputManager.isJustPressed('Escape')) {
        this.state = 'charSelect'
        this.setupMenuButtons()
      }
      // Enter 直接开始游戏，用默认设置
      if (this.inputManager.isJustPressed('Enter')) {
        this.start()
      }
    } else if (this.state === 'gameover') {
      this.canvas.style.cursor = 'default'
      if (this.inputManager.isJustPressed('KeyR')) this.restart()
      if (this.inputManager.isJustPressed('Escape')) {
        this.state = 'modeSelect'
        this.setupMenuButtons()
      }
    } else if (this.state === 'playing') {
      this.canvas.style.cursor = this.gameMode === 'trio' ? 'none' : 'default'
      if (this.inputManager.isJustPressed('KeyP')) this.state = 'paused'
      if (this.inputManager.isJustPressed('Escape')) {
        this.state = 'modeSelect'
        this.setupMenuButtons()
      }
    } else if (this.state === 'paused') {
      this.canvas.style.cursor = 'default'
      if (this.inputManager.isJustPressed('KeyP')) this.state = 'playing'
      if (this.inputManager.isJustPressed('Escape')) {
        this.state = 'modeSelect'
        this.setupMenuButtons()
      }
    }
  }

  start(): void {
    this.initGame()
    this.state = 'playing'
    this.canvas.style.cursor = this.gameMode === 'trio' ? 'none' : 'default'
  }

  setWinScore(score: number): void {
    this.winScore = score
    if (this.scoreManager) this.scoreManager.setWinScore(score)
  }

  restart(): void {
    this.initGame()
    this.state = 'playing'
  }

  destroy(): void {
    cancelAnimationFrame(this.animationId)
  }
}
