class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    init(data) {
        this.selectedSkin = data.skin || 'CLASSIC';
    }

    create() {
        this.sounds = new SoundManager();
        this.sounds.initBGM();
        this.snake = new Snake(this, this.selectedSkin);
        this.food = this.spawnFood();
        this.score = 0;
        this.skillValue = 0;
        this.lastUpdateTime = 0;
        this.gameStarted = true;
        this.projectiles = [];

        // UI - Score
        this.scoreText = this.add.text(10, 10, `Score: 0 | ${this.snake.skin.name}`, {
            fontSize: '16px',
            fill: CONFIG.COLORS.UI_TEXT,
            fontFamily: 'monospace'
        });

        // UI - Skill Bar
        const barWidth = 200;
        const barHeight = 15;
        const barX = (CONFIG.WIDTH - barWidth) / 2;
        const barY = CONFIG.HEIGHT - 40;
        this.add.rectangle(barX, barY, barWidth, barHeight, 0x333333).setOrigin(0);
        this.skillBar = this.add.rectangle(barX, barY, 0, barHeight, 0x00FFFF).setOrigin(0);
        this.skillText = this.add.text(CONFIG.WIDTH / 2, barY - 10, 'READY (SPACE/TAP)', {
            fontSize: '10px',
            fill: '#00FFFF',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setVisible(false);

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.setupMobileInput();

        // Events
        this.setupEvents();
    }

    setupEvents() {
        this.events.on('skillActivated', (data) => {
            this.sounds.playSkillActivate();
            this.sounds.setIntensity(true);
            this.skillValue = 0;
            this.updateSkillBar();
            this.cameras.main.shake(200, 0.01);

            if (data.skin === 'Domain Master') {
                this.cameras.main.setBackgroundColor(0x222222);
            } else if (data.skin === 'Gear Fifth') {
                this.cameras.main.flash(300, 255, 255, 255);
                this.tweens.add({ targets: this.cameras.main, zoom: 1.05, duration: 200, yoyo: true });
            } else if (data.skin === 'Ultra Instinct') {
                this.cameras.main.flash(500, 173, 216, 230);
                this.cameras.main.setAlpha(0.8);
            }
        });

        this.events.on('skillDeactivated', () => {
            this.sounds.setIntensity(false);
            this.cameras.main.setBackgroundColor(0x000000);
            this.cameras.main.setAlpha(1);
            this.cameras.main.setZoom(1);
        });

        this.events.on('dodge', () => {
            this.sounds.playDodge();
            this.cameras.main.flash(100, 255, 255, 255);
            const msg = this.add.text(this.snake.head.x * CONFIG.GRID_SIZE, this.snake.head.y * CONFIG.GRID_SIZE, 'DODGE!', { fontSize: '12px', fill: '#FFFFFF' });
            this.tweens.add({ targets: msg, y: msg.y - 20, alpha: 0, duration: 500, onComplete: () => msg.destroy() });
        });

        this.events.on('fireProjectile', (data) => {
            this.sounds.playDodge(); // Use dodge sound as projectile fire
            const graphics = this.add.graphics();
            graphics.fillStyle(0xFFFFFF, 1);
            graphics.fillCircle(0, 0, 5);
            const container = this.add.container(data.x * CONFIG.GRID_SIZE + 10, data.y * CONFIG.GRID_SIZE + 10, [graphics]);
            this.projectiles.push({ obj: container, dir: data.dir });
        });

        this.events.on('gameOver', () => {
            this.sounds.stopBGM();
            this.sounds.playGameOver();
            this.gameStarted = false;
            this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 'GAME OVER\nTap to Restart', {
                fontSize: '32px', fill: '#FF0000', align: 'center', fontFamily: 'monospace'
            }).setOrigin(0.5);
            this.input.once('pointerdown', () => this.scene.start('MenuScene'));
        });
    }

    update(time) {
        if (!this.gameStarted) return;
        this.handleInput();

        if (time >= this.lastUpdateTime + (1000 / CONFIG.FPS)) {
            this.snake.update();
            this.updateProjectiles();
            this.checkFoodCollision();
            if (this.snake.isSkillActive && this.snake.skin.name === 'Neon Wave') this.attractFood();
            this.lastUpdateTime = time;
        }
    }

    handleInput() {
        if (this.cursors.left.isDown) this.snake.setDirection(CONFIG.DIRECTIONS.LEFT);
        else if (this.cursors.right.isDown) this.snake.setDirection(CONFIG.DIRECTIONS.RIGHT);
        else if (this.cursors.up.isDown) this.snake.setDirection(CONFIG.DIRECTIONS.UP);
        else if (this.cursors.down.isDown) this.snake.setDirection(CONFIG.DIRECTIONS.DOWN);
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && this.skillValue >= CONFIG.SKILL.MAX_VALUE) this.snake.activateSkill();
    }

    updateProjectiles() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.obj.x += p.dir.x * CONFIG.GRID_SIZE; p.obj.y += p.dir.y * CONFIG.GRID_SIZE;
            const px = Math.floor(p.obj.x / CONFIG.GRID_SIZE), py = Math.floor(p.obj.y / CONFIG.GRID_SIZE);
            if (px === this.food.x && py === this.food.y) {
                this.score += 50; this.scoreText.setText(`Score: ${this.score} | ${this.snake.skin.name}`);
                this.food = this.spawnFood();
            }
            if (p.obj.x < 0 || p.obj.x > CONFIG.WIDTH || p.obj.y < 0 || p.obj.y > CONFIG.HEIGHT) {
                p.obj.destroy(); this.projectiles.splice(i, 1);
            }
        }
    }

    attractFood() {
        const dx = this.snake.head.x - this.food.x, dy = this.snake.head.y - this.food.y;
        if (Math.abs(dx) > 0) this.food.x += (dx > 0 ? 1 : -1);
        else if (Math.abs(dy) > 0) this.food.y += (dy > 0 ? 1 : -1);
        this.drawFood();
    }

    spawnFood() {
        const gridW = CONFIG.WIDTH / CONFIG.GRID_SIZE, gridH = CONFIG.HEIGHT / CONFIG.GRID_SIZE;
        let x, y;
        do { x = Phaser.Math.Between(0, gridW - 1); y = Phaser.Math.Between(0, gridH - 1); } while (this.snake.body.some(s => s.x === x && s.y === y));
        this.food = { x, y }; this.drawFood(); return this.food;
    }

    drawFood() {
        if (this.foodGraphic) this.foodGraphic.destroy();
        this.foodGraphic = this.add.graphics();
        this.foodGraphic.fillStyle(CONFIG.COLORS.FOOD, 1);
        this.foodGraphic.fillRect(this.food.x * CONFIG.GRID_SIZE + 2, this.food.y * CONFIG.GRID_SIZE + 2, CONFIG.GRID_SIZE - 4, CONFIG.GRID_SIZE - 4);
    }

    checkFoodCollision() {
        if (this.snake.head.x === this.food.x && this.snake.head.y === this.food.y) {
            this.sounds.playEat();
            this.snake.grow();
            this.food = this.spawnFood();
            
            let multiplier = this.snake.isSkillActive ? 2 : 1;
            if (this.snake.isSkillActive && this.snake.skin.name === 'Gear Fifth') multiplier = 3;
            
            this.score += 10 * multiplier;
            this.scoreText.setText(`Score: ${this.score} | ${this.snake.skin.name}`);
            this.sounds.updateTempo(this.score);
            
            if (this.skillValue < CONFIG.SKILL.MAX_VALUE) {
                this.skillValue = Math.min(CONFIG.SKILL.MAX_VALUE, this.skillValue + CONFIG.SKILL.FOOD_GAIN);
                this.updateSkillBar();
            }
            this.cameras.main.shake(100, 0.005);
        }
    }

    updateSkillBar() {
        const barWidth = 200;
        this.skillBar.width = barWidth * (this.skillValue / CONFIG.SKILL.MAX_VALUE);
        if (this.skillValue >= CONFIG.SKILL.MAX_VALUE) {
            if (!this.skillText.visible) this.sounds.playSkillReady();
            this.skillBar.setFillStyle(0xFFFFFF); this.skillText.setVisible(true);
        } else {
            this.skillBar.setFillStyle(0x00FFFF); this.skillText.setVisible(false);
        }
    }

    setupMobileInput() {
        this.input.on('pointerdown', (p) => {
            if (this.skillValue >= CONFIG.SKILL.MAX_VALUE) this.snake.activateSkill();
            this.touchStartX = p.x; this.touchStartY = p.y;
        });
        this.input.on('pointerup', (p) => {
            const dx = p.x - this.touchStartX, dy = p.y - this.touchStartY;
            if (Math.abs(dx) > Math.abs(dy)) {
                if (Math.abs(dx) > 30) this.snake.setDirection(dx > 0 ? CONFIG.DIRECTIONS.RIGHT : CONFIG.DIRECTIONS.LEFT);
            } else {
                if (Math.abs(dy) > 30) this.snake.setDirection(dy > 0 ? CONFIG.DIRECTIONS.DOWN : CONFIG.DIRECTIONS.UP);
            }
        });
    }
}

class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }
    create() {
        this.add.text(CONFIG.WIDTH/2, 60, 'SERPENTINE', { fontSize: '40px', fill: '#00FF00', fontFamily: 'monospace' }).setOrigin(0.5);
        this.add.text(CONFIG.WIDTH/2, 100, 'Select Your Character', { fontSize: '14px', fill: '#FFFFFF', fontFamily: 'monospace' }).setOrigin(0.5);
        
        const skins = Object.keys(CONFIG.SKINS);
        skins.forEach((key, i) => {
            const skin = CONFIG.SKINS[key];
            const btn = this.add.container(CONFIG.WIDTH/2, 160 + (i * 55));
            const bg = this.add.rectangle(0, 0, 260, 45, 0x333333).setInteractive();
            const txt = this.add.text(0, -8, skin.name, { fontSize: '18px', fill: '#FFFFFF' }).setOrigin(0.5);
            const desc = this.add.text(0, 12, skin.description, { fontSize: '10px', fill: '#00FFFF' }).setOrigin(0.5);
            btn.add([bg, txt, desc]);
            
            bg.on('pointerdown', () => this.scene.start('MainScene', { skin: key }));
            bg.on('pointerover', () => { bg.setFillStyle(0x555555); btn.setScale(1.05); });
            bg.on('pointerout', () => { bg.setFillStyle(0x333333); btn.setScale(1); });
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: CONFIG.WIDTH,
    height: CONFIG.HEIGHT,
    parent: 'game-container',
    backgroundColor: '#000000',
    scene: [MenuScene, MainScene]
};
const game = new Phaser.Game(config);
