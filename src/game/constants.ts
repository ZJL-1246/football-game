import type { ColorConfig, ControlConfig, GameParams, CharacterType, SceneType, FieldSize } from '../types'

export interface CharacterConfig {
  type: CharacterType
  label: string
  description: string
}

export const CHARACTER_TYPES: CharacterConfig[] = [
  { type: 'pixel',  label: '像素', description: '经典像素小人' },
  { type: 'circle', label: '圆形', description: '简洁圆形球员' },
  { type: 'robot',  label: '机器人', description: '方块机器人' },
]

// 颜色配置
export const COLORS: ColorConfig = {
  fieldDark:   '#2E7D32',
  fieldLight:  '#388E3C',
  lines:       '#FFFFFF',
  background:  '#1A1A2E',
  goal:        '#FFC107',
  goalNet:     '#FFE082',
  player1:     '#F44336',
  player2:     '#2196F3',
  playerStroke: '#FFFFFF',
  arrowColor:  '#FFFFFF',
  trailOpacity: 0.4,
  ball:        '#FFFFFF',
  ballPattern: '#333333',
  text:        '#FFFFFF',
  scoreBg:     'rgba(0,0,0,0.5)',
}

// 操控配置
export const CONTROLS: Record<'player1' | 'player2', ControlConfig> = {
  player1: {
    up:    'KeyW',
    down:  'KeyS',
    left:  'KeyA',
    right: 'KeyD',
    kick:  'Space',
  },
  player2: {
    up:    'ArrowUp',
    down:  'ArrowDown',
    left:  'ArrowLeft',
    right: 'ArrowRight',
    kick:  'Enter',
  },
}

// 游戏参数
export const GAME_PARAMS: GameParams = {
  playerSpeed:     3,
  playerRadius:    20,
  arrowLength:     15,
  arrowWidth:      8,
  trailMaxLength:  10,
  trailFadeSpeed:  0.08,
  ballRadius:      12,
  ballFriction:    0.985,
  kickForce:       12,
  kickSpeedBonus:  1.5,
  kickCooldown:    300,
  maxBallSpeed:    15,
  goalWidth:       50,
  goalHeight:      120,
  defaultWinScore: 5,
  defaultDuration: 180,
  goalResetDelay:  1500,
  winScoreOptions: [3, 5, 10, Infinity],
  speedOptions:    [2, 3, 4, 5],
}

// 场地比例
export const FIELD_RATIO = 16 / 10
export const FIELD_MARGIN = 0.05  // 场地距离窗口边缘的比例
export const STRIPE_COUNT = 12    // 草坪条纹数量

// 场景配置
export interface SceneConfig {
  type: SceneType
  label: string
  description: string
}

export const SCENE_TYPES: SceneConfig[] = [
  { type: 'classic', label: '草地', description: '经典绿色草坪' },
  { type: 'cyber',   label: '赛博', description: '霓虹赛博朋克' },
]

// 经典场景颜色
export const CLASSIC_COLORS: ColorConfig = {
  fieldDark:   '#2E7D32',
  fieldLight:  '#388E3C',
  lines:       '#FFFFFF',
  background:  '#1A1A2E',
  goal:        '#FFC107',
  goalNet:     '#FFE082',
  player1:     '#F44336',
  player2:     '#2196F3',
  playerStroke: '#FFFFFF',
  arrowColor:  '#FFFFFF',
  trailOpacity: 0.4,
  ball:        '#FFFFFF',
  ballPattern: '#333333',
  text:        '#FFFFFF',
  scoreBg:     'rgba(0,0,0,0.5)',
}

// 赛博朋克场景颜色
export const CYBER_COLORS: ColorConfig = {
  fieldDark:   '#0D0D2B',
  fieldLight:  '#151540',
  lines:       '#00FFFF',
  background:  '#050510',
  goal:        '#FF00FF',
  goalNet:     '#FF00FF40',
  player1:     '#FF0055',
  player2:     '#00FFCC',
  playerStroke: '#00FFFF',
  arrowColor:  '#FFFF00',
  trailOpacity: 0.5,
  ball:        '#FFFF00',
  ballPattern: '#FF6600',
  text:        '#00FFFF',
  scoreBg:     'rgba(0,255,255,0.15)',
}

// 场地大小配置
// scale 越小，人物/球/速度越小，场地相对显得越大
export interface FieldSizeConfig {
  type: FieldSize
  label: string
  description: string
  entityScale: number  // 人物、球、速度的缩放比例（1=标准）
}

export const FIELD_SIZES: FieldSizeConfig[] = [
  { type: 'small',    label: '小场', description: '紧凑刺激', entityScale: 1.3 },
  { type: 'standard', label: '标准', description: '经典尺寸', entityScale: 1.0 },
  { type: 'large',    label: '大场', description: '宽广自由', entityScale: 0.65 },
]
