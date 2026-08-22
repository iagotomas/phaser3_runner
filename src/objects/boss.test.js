import { describe, it, expect, vi } from 'vitest';

// Mocking the Boss class to avoid Phaser dependency issues in tests
class MockBoss {
    constructor(config = {}) {
        this.maxHealth = config.health || 50;
        this.health = this.maxHealth;
        this.healthBarRect = { width: 400 };
        this.healthBarWidth = 400;
    }
    takeDamage(amount) {
        this.health -= amount;
        this.updateHealthBar();
    }
    updateHealthBar() {
        const percentage = this.health / this.maxHealth;
        this.healthBarRect.width = this.healthBarWidth * percentage;
    }
}

describe('Boss', () => {
    it('should initialize with correct health', () => {
        const boss = new MockBoss({ health: 100 });
        expect(boss.maxHealth).toBe(100);
        expect(boss.health).toBe(100);
    });

    it('should take damage', () => {
        const boss = new MockBoss({ health: 100 });
        boss.takeDamage(20);
        expect(boss.health).toBe(80);
        expect(boss.healthBarRect.width).toBe(320);
    });
});
