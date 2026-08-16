import Phaser from 'phaser'
import Enemy from './enemy'

/**
 * Boss class extending Enemy
 */
export default class Boss extends Enemy {
    constructor(scene, x, y, texture = 'unicorn_enemy', frame = 'unicorn_enemy_0', config = {}) {
        super(scene, x, y, texture, frame, {
            ...config,
            health: config.health || 20,
            type: 'boss'
        })

        this.bossConfig = config
        this.phase = 1
        this.maxHealth = config.health || 20
        this.health = this.maxHealth
        
        // Boss specific setup
        this.setScale(1.5)
        this.setDepth(17)
        
        // Boss health bar
        this.createHealthBar()
    }

    createHealthBar() {
        this.healthBar = this.scene.add.graphics()
        this.updateHealthBar()
    }

    updateHealthBar() {
        this.healthBar.clear()
        
        // Background
        this.healthBar.fillStyle(0x000000, 0.8)
        this.healthBar.fillRect(this.scene.scale.width / 2 - 200, 50, 400, 20)
        
        // Health
        const healthPercentage = this.health / this.maxHealth
        this.healthBar.fillStyle(0xff0000, 1)
        this.healthBar.fillRect(this.scene.scale.width / 2 - 200, 50, 400 * healthPercentage, 20)
        
        this.healthBar.setScrollFactor(0)
        this.healthBar.setDepth(1000)
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta)
        this.updateHealthBar()
        this.checkPhases()
    }

    checkPhases() {
        if (this.phase === 1 && this.health < this.maxHealth * 0.5) {
            this.phase = 2
            this.moveSpeed *= 1.5
            console.log('Boss entered Phase 2')
        }
    }

    takeDamage(amount = 1) {
        const destroyed = super.takeDamage(amount)
        if (destroyed) {
            this.healthBar.destroy()
            this.scene.events.emit('bossDefeated')
        }
        return destroyed
    }
}
