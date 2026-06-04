import { Game } from './game/Game'

// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement

  if (!canvas) {
    console.error('Canvas element not found!')
    return
  }

  new Game(canvas)

  console.log('⚽ 足球对战游戏已启动!')
  console.log('玩家1: WASD + 空格踢球')
  console.log('玩家2: 方向键 + Enter踢球')
})
