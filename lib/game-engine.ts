import {
  type Position,
  type Direction,
  type Particle,
  type Projectile,
  type GameState,
  type SkinConfig,
  GRID_SIZE,
  GAME_WIDTH,
  GAME_HEIGHT,
  COLS,
  ROWS,
  MAX_SKILL,
  SKILL_GAIN,
  BASE_FPS,
  DIRECTIONS,
  SKINS,
} from "./game-types";
import { SoundEngine } from "./sound-engine";

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  sound: SoundEngine;

  // Snake state
  body: Position[] = [];
  head: Position = { x: 5, y: 5 };
  direction: Direction = DIRECTIONS.RIGHT;
  nextDirection: Direction = DIRECTIONS.RIGHT;
  size = 3;
  alive = true;

  // Skill state
  isSkillActive = false;
  skillTimer: ReturnType<typeof setTimeout> | null = null;
  dodgeCharges = 0;

  // Game state
  state: GameState = {
    phase: "menu",
    score: 0,
    highScore: 0,
    skillValue: 0,
    selectedSkin: "CLASSIC",
    combo: 0,
    comboTimer: 0,
  };

  skin: SkinConfig = SKINS.CLASSIC;
  food: Position = { x: 10, y: 10 };
  particles: Particle[] = [];
  projectiles: Projectile[] = [];
  screenShake = 0;
  screenFlash = 0;
  screenFlashColor = "#ffffff";
  gridPulse = 0;
  foodPulseTime = 0;
  trailPositions: { pos: Position; alpha: number }[] = [];

  lastUpdateTime = 0;
  animFrame = 0;
  fps = BASE_FPS;
  onStateChange?: (state: GameState) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.canvas.width = GAME_WIDTH;
    this.canvas.height = GAME_HEIGHT;
    this.ctx = canvas.getContext("2d")!;
    this.sound = new SoundEngine();

    const hs = typeof window !== "undefined" ? localStorage.getItem("serpentine_hs") : null;
    if (hs) this.state.highScore = parseInt(hs, 10);
  }

  startGame(skinKey: string) {
    this.sound.init();
    this.sound.initBGM();

    this.skin = SKINS[skinKey];
    this.state = {
      ...this.state,
      phase: "playing",
      score: 0,
      skillValue: 0,
      selectedSkin: skinKey,
      combo: 0,
      comboTimer: 0,
    };
    this.body = [];
    this.head = { x: 5, y: 15 };
    this.direction = DIRECTIONS.RIGHT;
    this.nextDirection = DIRECTIONS.RIGHT;
    this.size = 3;
    this.alive = true;
    this.isSkillActive = false;
    this.dodgeCharges = 0;
    this.particles = [];
    this.projectiles = [];
    this.trailPositions = [];
    this.fps = BASE_FPS;
    this.screenShake = 0;
    this.screenFlash = 0;

    for (let i = 0; i < this.size; i++) {
      this.body.push({ x: this.head.x - i, y: this.head.y });
    }
    this.food = this.spawnFood();
    this.lastUpdateTime = 0;
    this.emitState();
    this.loop(0);
  }

  private emitState() {
    this.onStateChange?.({ ...this.state });
  }

  setDirection(dir: Direction) {
    if (this.direction.x + dir.x === 0 && this.direction.y + dir.y === 0) return;
    this.nextDirection = dir;
  }

  activateSkill() {
    if (this.isSkillActive || this.state.skillValue < MAX_SKILL) return;

    this.isSkillActive = true;
    this.state.skillValue = 0;
    this.sound.playSkillActivate();
    this.sound.setIntensity(true);
    this.screenShake = 15;
    this.gridPulse = 1;

    // Spawn burst particles
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30;
      this.particles.push({
        x: this.head.x * GRID_SIZE + GRID_SIZE / 2,
        y: this.head.y * GRID_SIZE + GRID_SIZE / 2,
        vx: Math.cos(angle) * (3 + Math.random() * 4),
        vy: Math.sin(angle) * (3 + Math.random() * 4),
        life: 40,
        maxLife: 40,
        color: this.skin.color,
        size: 3 + Math.random() * 3,
      });
    }

    if (this.skin.key === "DOMAIN_MASTER") {
      this.screenFlash = 10;
      this.screenFlashColor = "#ffffff";
    } else if (this.skin.key === "GEAR_FIFTH") {
      this.screenFlash = 15;
      this.screenFlashColor = "#ffffff";
    } else if (this.skin.key === "ULTRA_INSTINCT") {
      this.dodgeCharges = 3;
      this.screenFlash = 20;
      this.screenFlashColor = "#c0c0ff";
    }

    if (this.skin.key === "SAGE_MODE") {
      this.fireProjectile();
      setTimeout(() => {
        this.isSkillActive = false;
        this.sound.setIntensity(false);
        this.emitState();
      }, 500);
      this.emitState();
      return;
    }

    if (this.skin.key === "CLASSIC") {
      this.fps = 20;
    }

    this.skillTimer = setTimeout(() => {
      this.isSkillActive = false;
      this.sound.setIntensity(false);
      if (this.skin.key === "CLASSIC") {
        this.fps = BASE_FPS;
      }
      this.emitState();
    }, this.skin.skillDuration);

    this.emitState();
  }

  private fireProjectile() {
    this.projectiles.push({
      x: (this.head.x + this.direction.x) * GRID_SIZE + GRID_SIZE / 2,
      y: (this.head.y + this.direction.y) * GRID_SIZE + GRID_SIZE / 2,
      dir: { ...this.direction },
      life: 30,
    });
    this.sound.playDodge();
  }

  private spawnFood(): Position {
    let x: number, y: number;
    do {
      x = Math.floor(Math.random() * COLS);
      y = Math.floor(Math.random() * ROWS);
    } while (this.body.some((s) => s.x === x && s.y === y));
    return { x, y };
  }

  private update() {
    if (!this.alive || this.state.phase !== "playing") return;

    // Combo decay
    if (this.state.comboTimer > 0) {
      this.state.comboTimer--;
      if (this.state.comboTimer <= 0) {
        this.state.combo = 0;
      }
    }

    // Gear Fifth random direction
    if (this.isSkillActive && this.skin.key === "GEAR_FIFTH") {
      if (Math.random() < 0.2) {
        const dirs = Object.values(DIRECTIONS);
        const d = dirs[Math.floor(Math.random() * dirs.length)];
        if (!(this.direction.x + d.x === 0 && this.direction.y + d.y === 0)) {
          this.nextDirection = d;
        }
      }
    }

    this.direction = this.nextDirection;

    const newHead: Position = {
      x: this.head.x + this.direction.x,
      y: this.head.y + this.direction.y,
    };

    let collision = false;

    // Wall check
    if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) {
      if (this.isSkillActive && this.skin.key === "DOMAIN_MASTER") {
        if (newHead.x < 0) newHead.x = COLS - 1;
        else if (newHead.x >= COLS) newHead.x = 0;
        if (newHead.y < 0) newHead.y = ROWS - 1;
        else if (newHead.y >= ROWS) newHead.y = 0;
      } else {
        collision = true;
      }
    }

    // Self check
    if (!collision && this.body.some((s) => s.x === newHead.x && s.y === newHead.y)) {
      // Turbo Dash invincibility
      if (this.isSkillActive && this.skin.key === "CLASSIC") {
        // pass through self
      } else {
        collision = true;
      }
    }

    if (collision) {
      if (this.isSkillActive && this.skin.key === "ULTRA_INSTINCT" && this.dodgeCharges > 0) {
        this.dodgeCharges--;
        this.sound.playDodge();
        this.screenFlash = 5;
        this.screenFlashColor = "#ffffff";
        // Dodge particle
        for (let i = 0; i < 8; i++) {
          this.particles.push({
            x: this.head.x * GRID_SIZE + GRID_SIZE / 2,
            y: this.head.y * GRID_SIZE + GRID_SIZE / 2,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 20,
            maxLife: 20,
            color: "#c0c0ff",
            size: 2,
          });
        }
        this.emitState();
        return;
      }
      this.die();
      return;
    }

    // Trail for visual
    this.trailPositions.push({ pos: { ...this.head }, alpha: 0.6 });
    if (this.trailPositions.length > 8) this.trailPositions.shift();
    this.trailPositions.forEach((t) => (t.alpha *= 0.85));

    this.body.unshift(newHead);
    this.head = newHead;
    if (this.body.length > this.size) this.body.pop();

    // Food collision
    if (this.head.x === this.food.x && this.head.y === this.food.y) {
      this.sound.playEat();
      this.size++;

      // Combo
      this.state.combo++;
      this.state.comboTimer = 30; // ~3 seconds
      if (this.state.combo > 1) this.sound.playCombo();

      let mult = this.isSkillActive ? 2 : 1;
      if (this.isSkillActive && this.skin.key === "GEAR_FIFTH") mult = 3;
      const comboMult = Math.min(this.state.combo, 5);
      this.state.score += 10 * mult * comboMult;

      this.sound.updateTempo(this.state.score);

      if (this.state.skillValue < MAX_SKILL) {
        this.state.skillValue = Math.min(MAX_SKILL, this.state.skillValue + SKILL_GAIN);
        if (this.state.skillValue >= MAX_SKILL) this.sound.playSkillReady();
      }

      // Food eat particles
      for (let i = 0; i < 12; i++) {
        this.particles.push({
          x: this.food.x * GRID_SIZE + GRID_SIZE / 2,
          y: this.food.y * GRID_SIZE + GRID_SIZE / 2,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5,
          life: 25,
          maxLife: 25,
          color: "#ff3366",
          size: 2 + Math.random() * 2,
        });
      }
      this.screenShake = 4;
      this.food = this.spawnFood();
    }

    // Neon Wave attract food
    if (this.isSkillActive && this.skin.key === "NEON_WAVE") {
      const dx = this.head.x - this.food.x;
      const dy = this.head.y - this.food.y;
      if (Math.abs(dx) > 0) this.food.x += dx > 0 ? 1 : -1;
      else if (Math.abs(dy) > 0) this.food.y += dy > 0 ? 1 : -1;
    }

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.dir.x * GRID_SIZE;
      p.y += p.dir.y * GRID_SIZE;
      p.life--;

      // Projectile trail particles
      this.particles.push({
        x: p.x,
        y: p.y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 10,
        maxLife: 10,
        color: "#ff6633",
        size: 2,
      });

      const gx = Math.floor(p.x / GRID_SIZE);
      const gy = Math.floor(p.y / GRID_SIZE);
      if (gx === this.food.x && gy === this.food.y) {
        this.state.score += 50;
        this.food = this.spawnFood();
      }

      if (p.life <= 0 || p.x < 0 || p.x > GAME_WIDTH || p.y < 0 || p.y > GAME_HEIGHT) {
        this.projectiles.splice(i, 1);
      }
    }

    this.emitState();
  }

  private die() {
    this.alive = false;
    this.state.phase = "gameover";
    this.sound.stopBGM();
    this.sound.playGameOver();

    if (this.state.score > this.state.highScore) {
      this.state.highScore = this.state.score;
      if (typeof window !== "undefined") {
        localStorage.setItem("serpentine_hs", String(this.state.highScore));
      }
    }

    // Death explosion particles
    this.body.forEach((s) => {
      for (let i = 0; i < 4; i++) {
        this.particles.push({
          x: s.x * GRID_SIZE + GRID_SIZE / 2,
          y: s.y * GRID_SIZE + GRID_SIZE / 2,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          life: 40,
          maxLife: 40,
          color: this.skin.color,
          size: 2 + Math.random() * 3,
        });
      }
    });

    this.screenShake = 20;
    if (this.skillTimer) clearTimeout(this.skillTimer);
    this.emitState();
  }

  private render() {
    const ctx = this.ctx;
    const shakeX = this.screenShake > 0 ? (Math.random() - 0.5) * this.screenShake : 0;
    const shakeY = this.screenShake > 0 ? (Math.random() - 0.5) * this.screenShake : 0;
    if (this.screenShake > 0) this.screenShake *= 0.85;
    if (this.screenShake < 0.5) this.screenShake = 0;

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Background
    ctx.fillStyle = this.isSkillActive && this.skin.key === "DOMAIN_MASTER" ? "#111118" : "#050a0e";
    ctx.fillRect(-5, -5, GAME_WIDTH + 10, GAME_HEIGHT + 10);

    // Animated grid
    this.gridPulse *= 0.97;
    const gridAlpha = 0.04 + this.gridPulse * 0.1;
    ctx.strokeStyle = `rgba(0, 255, 204, ${gridAlpha})`;
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= GAME_WIDTH; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GAME_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= GAME_HEIGHT; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GAME_WIDTH, y);
      ctx.stroke();
    }

    // Border glow
    const borderColor = this.isSkillActive ? this.skin.color : "#00ffcc";
    ctx.shadowColor = borderColor;
    ctx.shadowBlur = 10 + this.gridPulse * 20;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.shadowBlur = 0;

    // Trail
    this.trailPositions.forEach((t) => {
      if (t.alpha > 0.05) {
        ctx.fillStyle = this.skin.glowColor;
        ctx.globalAlpha = t.alpha * 0.3;
        ctx.fillRect(
          t.pos.x * GRID_SIZE + 2,
          t.pos.y * GRID_SIZE + 2,
          GRID_SIZE - 4,
          GRID_SIZE - 4
        );
      }
    });
    ctx.globalAlpha = 1;

    // Snake body
    this.body.forEach((seg, i) => {
      const isHead = i === 0;
      let color = isHead ? this.skin.color : this.skin.bodyColor;

      if (this.isSkillActive && this.skin.key === "DOMAIN_MASTER") {
        color = Math.random() > 0.5 ? "#ffffff" : "#222222";
      }

      if (this.isSkillActive && this.skin.key === "NEON_WAVE") {
        const wave = Math.sin(this.animFrame * 0.2 + i * 0.5);
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        const mod = Math.floor(wave * 40);
        color = `rgb(${Math.max(0, Math.min(255, r + mod))},${Math.max(0, Math.min(255, g + mod))},${Math.max(0, Math.min(255, b + mod))})`;
      }

      // Glow for head
      if (isHead) {
        ctx.shadowColor = this.skin.color;
        ctx.shadowBlur = this.isSkillActive ? 20 : 8;
      }

      const padding = isHead ? 1 : 2;
      const cornerRadius = isHead ? 4 : 2;
      const x = seg.x * GRID_SIZE + padding;
      const y = seg.y * GRID_SIZE + padding;
      const w = GRID_SIZE - padding * 2;
      const h = GRID_SIZE - padding * 2;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, cornerRadius);
      ctx.fill();

      if (isHead) {
        ctx.shadowBlur = 0;
        // Eyes
        const eyeSize = 3;
        const eyeOffset = 5;
        ctx.fillStyle = "#000000";
        if (this.direction.x !== 0) {
          ctx.beginPath();
          ctx.arc(
            x + w / 2 + this.direction.x * 3,
            y + h / 2 - eyeOffset / 2,
            eyeSize,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.beginPath();
          ctx.arc(
            x + w / 2 + this.direction.x * 3,
            y + h / 2 + eyeOffset / 2,
            eyeSize,
            0,
            Math.PI * 2
          );
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(
            x + w / 2 - eyeOffset / 2,
            y + h / 2 + this.direction.y * 3,
            eyeSize,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.beginPath();
          ctx.arc(
            x + w / 2 + eyeOffset / 2,
            y + h / 2 + this.direction.y * 3,
            eyeSize,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }

        // Eye shine
        ctx.fillStyle = "#ffffff";
        if (this.direction.x !== 0) {
          ctx.beginPath();
          ctx.arc(x + w / 2 + this.direction.x * 3 + 1, y + h / 2 - eyeOffset / 2 - 1, 1, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(x + w / 2 - eyeOffset / 2 + 1, y + h / 2 + this.direction.y * 3 - 1, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Body gradient fade
      if (!isHead) {
        const fade = i / this.body.length;
        ctx.fillStyle = `rgba(0,0,0,${fade * 0.4})`;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, cornerRadius);
        ctx.fill();
      }
    });

    // Food with pulse
    this.foodPulseTime += 0.08;
    const pulse = Math.sin(this.foodPulseTime) * 0.3 + 1;
    const foodX = this.food.x * GRID_SIZE + GRID_SIZE / 2;
    const foodY = this.food.y * GRID_SIZE + GRID_SIZE / 2;
    const foodR = (GRID_SIZE / 2 - 3) * pulse;

    // Food glow
    ctx.shadowColor = "#ff3366";
    ctx.shadowBlur = 15 + Math.sin(this.foodPulseTime * 2) * 5;
    ctx.fillStyle = "#ff3366";
    ctx.beginPath();
    ctx.arc(foodX, foodY, foodR, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Food inner highlight
    ctx.fillStyle = "#ff6699";
    ctx.beginPath();
    ctx.arc(foodX - 2, foodY - 2, foodR * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Projectiles
    this.projectiles.forEach((p) => {
      ctx.shadowColor = "#ff6633";
      ctx.shadowBlur = 15;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ff6633";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life--;

      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (p.life <= 0) this.particles.splice(i, 1);
    }
    ctx.globalAlpha = 1;

    // Skill active aura around edges
    if (this.isSkillActive) {
      const auraAlpha = 0.1 + Math.sin(this.animFrame * 0.1) * 0.05;
      const grad = ctx.createRadialGradient(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        Math.min(GAME_WIDTH, GAME_HEIGHT) * 0.3,
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        Math.max(GAME_WIDTH, GAME_HEIGHT) * 0.7
      );
      grad.addColorStop(0, "transparent");
      grad.addColorStop(1, this.skin.glowColor);
      ctx.globalAlpha = auraAlpha;
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.globalAlpha = 1;
    }

    // Dodge charges indicator
    if (this.isSkillActive && this.skin.key === "ULTRA_INSTINCT") {
      for (let i = 0; i < this.dodgeCharges; i++) {
        ctx.fillStyle = "#c0c0ff";
        ctx.shadowColor = "#c0c0ff";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(GAME_WIDTH / 2 - 15 + i * 15, 50, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Screen flash
    if (this.screenFlash > 0) {
      ctx.globalAlpha = this.screenFlash / 20;
      ctx.fillStyle = this.screenFlashColor;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.globalAlpha = 1;
      this.screenFlash--;
    }

    // Combo display
    if (this.state.combo > 1) {
      ctx.fillStyle = "#00ffcc";
      ctx.shadowColor = "#00ffcc";
      ctx.shadowBlur = 10;
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`x${this.state.combo} COMBO`, GAME_WIDTH / 2, 75);
      ctx.shadowBlur = 0;
    }

    // Game over overlay
    if (this.state.phase === "gameover") {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      ctx.shadowColor = "#ff3366";
      ctx.shadowBlur = 20;
      ctx.fillStyle = "#ff3366";
      ctx.font = "bold 36px monospace";
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30);
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#e0e6ed";
      ctx.font = "16px monospace";
      ctx.fillText(`Score: ${this.state.score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);

      if (this.state.score >= this.state.highScore && this.state.score > 0) {
        ctx.fillStyle = "#00ffcc";
        ctx.font = "14px monospace";
        ctx.fillText("NEW HIGH SCORE!", GAME_WIDTH / 2, GAME_HEIGHT / 2 + 35);
      }

      ctx.fillStyle = "#6b8299";
      ctx.font = "12px monospace";
      ctx.fillText("Click or press ENTER to restart", GAME_WIDTH / 2, GAME_HEIGHT / 2 + 65);
    }

    ctx.restore();
    this.animFrame++;
  }

  private loop = (time: number) => {
    if (this.state.phase === "playing" || this.state.phase === "gameover") {
      if (time >= this.lastUpdateTime + 1000 / this.fps) {
        if (this.state.phase === "playing") {
          this.update();
        }
        this.lastUpdateTime = time;
      }
      this.render();
      requestAnimationFrame(this.loop);
    }
  };

  destroy() {
    this.state.phase = "menu";
    this.sound.stopBGM();
    if (this.skillTimer) clearTimeout(this.skillTimer);
  }
}
