export interface Position {
  x: number;
  y: number;
}

export interface Direction {
  x: number;
  y: number;
}

export interface SkinConfig {
  name: string;
  key: string;
  color: string;
  bodyColor: string;
  glowColor: string;
  skillName: string;
  skillDuration: number;
  description: string;
  icon: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Projectile {
  x: number;
  y: number;
  dir: Direction;
  life: number;
}

export interface GameState {
  phase: "menu" | "playing" | "paused" | "gameover";
  score: number;
  highScore: number;
  skillValue: number;
  selectedSkin: string;
  combo: number;
  comboTimer: number;
}

export const GRID_SIZE = 20;
export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 600;
export const COLS = GAME_WIDTH / GRID_SIZE;
export const ROWS = GAME_HEIGHT / GRID_SIZE;
export const MAX_SKILL = 100;
export const SKILL_GAIN = 20;
export const BASE_FPS = 10;

export const DIRECTIONS: Record<string, Direction> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

export const SKINS: Record<string, SkinConfig> = {
  CLASSIC: {
    name: "Classic",
    key: "CLASSIC",
    color: "#00ff88",
    bodyColor: "#008844",
    glowColor: "#00ff8840",
    skillName: "Turbo Dash",
    skillDuration: 2000,
    description: "Sprint and become invincible",
    icon: "Zap",
  },
  DOMAIN_MASTER: {
    name: "Domain Master",
    key: "DOMAIN_MASTER",
    color: "#ffffff",
    bodyColor: "#444444",
    glowColor: "#ffffff30",
    skillName: "Infinite Domain",
    skillDuration: 5000,
    description: "Wrap around walls, x2 Score",
    icon: "Shield",
  },
  NEON_WAVE: {
    name: "Neon Wave",
    key: "NEON_WAVE",
    color: "#00ffff",
    bodyColor: "#004466",
    glowColor: "#00ffff40",
    skillName: "Pulse Wave",
    skillDuration: 3000,
    description: "Sucks food towards you",
    icon: "Waves",
  },
  SAGE_MODE: {
    name: "Sage Mode",
    key: "SAGE_MODE",
    color: "#ff6633",
    bodyColor: "#991100",
    glowColor: "#ff663340",
    skillName: "Rasenshuriken",
    skillDuration: 1000,
    description: "Shoots a projectile forward",
    icon: "Flame",
  },
  GEAR_FIFTH: {
    name: "Gear Fifth",
    key: "GEAR_FIFTH",
    color: "#ffffff",
    bodyColor: "#dddddd",
    glowColor: "#ffffff30",
    skillName: "Nika's Laugh",
    skillDuration: 6000,
    description: "Random movement, x3 Food",
    icon: "Laugh",
  },
  ULTRA_INSTINCT: {
    name: "Ultra Instinct",
    key: "ULTRA_INSTINCT",
    color: "#c0c0ff",
    bodyColor: "#555588",
    glowColor: "#c0c0ff40",
    skillName: "Autonomous Dodge",
    skillDuration: 8000,
    description: "Auto dodge 3 collisions",
    icon: "Eye",
  },
};
