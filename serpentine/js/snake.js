class Snake {
    constructor(scene, skinKey = 'CLASSIC') {
        this.scene = scene;
        this.skin = CONFIG.SKINS[skinKey];
        this.body = [];
        this.head = { x: 5, y: 5 };
        this.direction = CONFIG.DIRECTIONS.RIGHT;
        this.nextDirection = CONFIG.DIRECTIONS.RIGHT;
        this.alive = true;
        this.size = 3;
        
        // Skill state
        this.isSkillActive = false;
        this.skillTimer = null;
        this.dodgeCharges = 0; // For Ultra Instinct

        // Initialize body
        for (let i = 0; i < this.size; i++) {
            this.body.push({ x: this.head.x - i, y: this.head.y });
        }

        this.graphics = scene.add.graphics();
    }

    setDirection(newDir) {
        if (this.direction.x + newDir.x === 0 && this.direction.y + newDir.y === 0) {
            return;
        }
        this.nextDirection = newDir;
    }

    activateSkill() {
        if (this.isSkillActive) return;
        
        this.isSkillActive = true;
        this.scene.events.emit('skillActivated', { name: this.skin.skillName, skin: this.skin.name });

        if (this.skin.name === 'ULTRA_INSTINCT') {
            this.dodgeCharges = 3;
        }

        if (this.skin.name === 'Sage Mode') {
            this.fireProjectile();
            // Sage Mode is an instant burst, so we deactivate quickly
            this.scene.time.delayedCall(500, () => {
                this.isSkillActive = false;
                this.scene.events.emit('skillDeactivated');
            });
            return;
        }

        if (this.skillTimer) this.skillTimer.remove();
        
        this.skillTimer = this.scene.time.delayedCall(this.skin.skillDuration, () => {
            this.isSkillActive = false;
            this.scene.events.emit('skillDeactivated');
        });
    }

    fireProjectile() {
        const projX = this.head.x + this.direction.x;
        const projY = this.head.y + this.direction.y;
        this.scene.events.emit('fireProjectile', { x: projX, y: projY, dir: this.direction });
    }

    update() {
        if (!this.alive) return;

        // Gear Fifth: Randomized "Bouncy" movement
        if (this.isSkillActive && this.skin.name === 'Gear Fifth') {
            if (Math.random() < 0.2) { // 20% chance to change direction randomly
                const dirs = Object.values(CONFIG.DIRECTIONS);
                const randomDir = dirs[Math.floor(Math.random() * dirs.length)];
                // Prevent 180 turn
                if (!(this.direction.x + randomDir.x === 0 && this.direction.y + randomDir.y === 0)) {
                    this.nextDirection = randomDir;
                }
            }
        }

        this.direction = this.nextDirection;

        let newHead = {
            x: this.head.x + this.direction.x,
            y: this.head.y + this.direction.y
        };

        const gridW = CONFIG.WIDTH / CONFIG.GRID_SIZE;
        const gridH = CONFIG.HEIGHT / CONFIG.GRID_SIZE;

        // Wall & Self Collision Check with Dodge logic
        let collision = false;
        
        // Wall Check
        if (newHead.x < 0 || newHead.x >= gridW || newHead.y < 0 || newHead.y >= gridH) {
            if (this.isSkillActive && this.skin.name === 'Domain Master') {
                if (newHead.x < 0) newHead.x = gridW - 1;
                else if (newHead.x >= gridW) newHead.x = 0;
                if (newHead.y < 0) newHead.y = gridH - 1;
                else if (newHead.y >= gridH) newHead.y = 0;
            } else {
                collision = true;
            }
        }

        // Self Check
        if (!collision && this.body.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
            collision = true;
        }

        if (collision) {
            if (this.isSkillActive && this.skin.name === 'Ultra Instinct' && this.dodgeCharges > 0) {
                this.dodgeCharges--;
                this.scene.events.emit('dodge');
                // Simple dodge: just stay in place for one tick or try to turn
                return; 
            } else {
                this.die();
                return;
            }
        }

        this.body.unshift(newHead);
        this.head = newHead;

        if (this.body.length > this.size) {
            this.body.pop();
        }

        this.draw();
    }

    grow() {
        this.size++;
    }

    die() {
        this.alive = false;
        if (this.skillTimer) this.skillTimer.remove();
        this.scene.events.emit('gameOver');
    }

    draw() {
        this.graphics.clear();
        
        this.body.forEach((segment, index) => {
            let color = index === 0 ? this.skin.color : this.skin.bodyColor;
            
            // Skill visual effects
            if (this.isSkillActive) {
                if (this.skin.name === 'Domain Master') {
                    // Cursed Energy noise effect
                    color = Math.random() > 0.5 ? 0xFFFFFF : 0x000000;
                }
            }

            this.graphics.fillStyle(color, 1);
            this.graphics.fillRect(
                segment.x * CONFIG.GRID_SIZE + 1,
                segment.y * CONFIG.GRID_SIZE + 1,
                CONFIG.GRID_SIZE - 2,
                CONFIG.GRID_SIZE - 2
            );
        });
    }
}
