const CONFIG = {
    WIDTH: 400,
    HEIGHT: 600,
    GRID_SIZE: 20,
    FPS: 10, // Initial speed
    COLORS: {
        BACKGROUND: 0x000000,
        SNAKE_HEAD: 0x00FF00,
        SNAKE_BODY: 0x008800,
        FOOD: 0xFF0000,
        UI_TEXT: '#FFFFFF'
    },
    DIRECTIONS: {
        UP: { x: 0, y: -1 },
        DOWN: { x: 0, y: 1 },
        LEFT: { x: -1, y: 0 },
        RIGHT: { x: 1, y: 0 }
    },
    SKILL: {
        MAX_VALUE: 100,
        FOOD_GAIN: 20,
        DECAY_RATE: 0 // For now it stays until used
    },
    SKINS: {
        CLASSIC: {
            name: 'Classic',
            color: 0x00FF00,
            bodyColor: 0x008800,
            skillName: 'Turbo Dash',
            skillDuration: 2000,
            description: 'Sprint and become invincible'
        },
        DOMAIN_MASTER: {
            name: 'Domain Master',
            color: 0xFFFFFF,
            bodyColor: 0x333333,
            skillName: 'Infinite Domain',
            skillDuration: 5000,
            description: 'Wrap around walls and x2 Score'
        },
        NEON_WAVE: {
            name: 'Neon Wave',
            color: 0x00FFFF,
            bodyColor: 0x004444,
            skillName: 'Pulse Wave',
            skillDuration: 3000,
            description: 'Sucks food towards the snake'
        },
        SAGE_MODE: {
            name: 'Sage Mode',
            color: 0xFF4500,
            bodyColor: 0x8B0000,
            skillName: 'Rasenshuriken',
            skillDuration: 1000, // Instant burst
            description: 'Shoots a projectile forward'
        },
        GEAR_FIFTH: {
            name: 'Gear Fifth',
            color: 0xFFFFFF,
            bodyColor: 0xDDDDDD,
            skillName: "Nika's Laugh",
            skillDuration: 6000,
            description: 'Random movement, x3 Food Value'
        },
        ULTRA_INSTINCT: {
            name: 'Ultra Instinct',
            color: 0xE0E0E0,
            bodyColor: 0x555555,
            skillName: 'Autonomous Dodge',
            skillDuration: 8000,
            description: 'Automatically dodge 3 collisions'
        }
    }
};
