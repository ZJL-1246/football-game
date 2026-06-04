// 游戏状态
export type GameState = 'modeSelect' | 'charSelect' | 'settings' | 'playing' | 'paused' | 'goal' | 'gameover'

// 人物类型
export type CharacterType = 'pixel' | 'circle' | 'robot' | 'ninja' | 'cat' | 'alien' | 'stickman'

// 玩家操控方式
export type PlayerMode = 'keyboard' | 'mouse'

// 游戏模式
export type GameModeType = 'duo' | 'trio' | 'ai'

// 场景类型
export type SceneType = 'classic' | 'cyber' | 'pixel' | 'pop'

// 场地大小
export type FieldSize = 'small' | 'standard' | 'large'

// 游戏模式
export type GameMode = 'score' | 'time'

// 球队
export type Team = 'red' | 'blue'

// 2D 向量
export interface Vec2 {
  x: number
  y: number
}

// 矩形
export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

// 球门
export interface Goal {
  x: number
  y: number
  width: number
  height: number
  team: Team
}

// 颜色配置
export interface ColorConfig {
  fieldDark: string
  fieldLight: string
  lines: string
  background: string
  goal: string
  goalNet: string
  player1: string
  player2: string
  playerStroke: string
  arrowColor: string
  trailOpacity: number
  ball: string
  ballPattern: string
  text: string
  scoreBg: string
}

// 操控配置
export interface ControlConfig {
  up: string
  down: string
  left: string
  right: string
  kick: string
}

// 游戏参数
export interface GameParams {
  playerSpeed: number
  playerRadius: number
  arrowLength: number
  arrowWidth: number
  trailMaxLength: number
  trailFadeSpeed: number
  ballRadius: number
  ballFriction: number
  kickForce: number
  kickSpeedBonus: number
  kickCooldown: number
  maxBallSpeed: number
  goalWidth: number
  goalHeight: number
  defaultWinScore: number
  defaultDuration: number
  goalResetDelay: number
  winScoreOptions: number[]
  speedOptions: number[]
}

// 拖尾点
export interface TrailPoint {
  x: number
  y: number
  opacity: number
}

// 球员数据
export interface PlayerData {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  direction: number
  trail: TrailPoint[]
  kickCooldown: number
  team: Team
  label: string
}

// 球数据
export interface BallData {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  rotation: number
}

// 比分
export interface Score {
  red: number
  blue: number
}
