import { CONTROLS } from './constants'
import type { ControlConfig } from '../types'

export class InputManager {
  private pressedKeys: Set<string> = new Set()
  private justPressedKeys: Set<string> = new Set()

  // 鼠标状态
  mouseX: number = 0
  mouseY: number = 0
  mouseClicked: boolean = false

  constructor(canvas?: HTMLCanvasElement) {
    this.setupListeners(canvas)
  }

  private setupListeners(canvas?: HTMLCanvasElement): void {
    window.addEventListener('keydown', (e) => {
      if (!this.pressedKeys.has(e.code)) {
        this.justPressedKeys.add(e.code)
      }
      this.pressedKeys.add(e.code)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault()
      }
    })

    window.addEventListener('keyup', (e) => {
      this.pressedKeys.delete(e.code)
    })

    window.addEventListener('blur', () => {
      this.pressedKeys.clear()
      this.justPressedKeys.clear()
    })

    // 鼠标事件
    const targetCanvas = canvas ?? document.getElementById('gameCanvas') as HTMLCanvasElement
    if (targetCanvas) {
      targetCanvas.addEventListener('mousemove', (e) => {
        const rect = targetCanvas.getBoundingClientRect()
        this.mouseX = e.clientX - rect.left
        this.mouseY = e.clientY - rect.top
      })

      targetCanvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
          this.mouseClicked = true
        }
      })
    }
  }

  isPressed(key: string): boolean {
    return this.pressedKeys.has(key)
  }

  isJustPressed(key: string): boolean {
    return this.justPressedKeys.has(key)
  }

  clearJustPressed(): void {
    this.justPressedKeys.clear()
    this.mouseClicked = false
  }

  getPlayerInput(player: 'player1' | 'player2'): { vx: number; vy: number; kick: boolean } {
    const controls: ControlConfig = CONTROLS[player]

    let vx = 0
    let vy = 0

    if (this.isPressed(controls.up)) vy -= 1
    if (this.isPressed(controls.down)) vy += 1
    if (this.isPressed(controls.left)) vx -= 1
    if (this.isPressed(controls.right)) vx += 1

    if (vx !== 0 && vy !== 0) {
      const len = Math.sqrt(vx * vx + vy * vy)
      vx /= len
      vy /= len
    }

    const kick = this.isJustPressed(controls.kick)

    return { vx, vy, kick }
  }

  getMouseInput(playerX: number, playerY: number, maxSpeed: number): { vx: number; vy: number; kick: boolean } {
    const dx = this.mouseX - playerX
    const dy = this.mouseY - playerY
    const dist = Math.sqrt(dx * dx + dy * dy)

    let vx = 0
    let vy = 0

    if (dist > 5) {
      // 朝鼠标方向移动，距离越远速度越快，但不超过 maxSpeed
      const speed = Math.min(dist * 0.05, maxSpeed)
      vx = (dx / dist) * speed
      vy = (dy / dist) * speed
    }

    const kick = this.mouseClicked

    return { vx, vy, kick }
  }
}
