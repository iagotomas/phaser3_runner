import Phaser from 'phaser'
import Enemy from './enemy'

/**
 * Boss class extending Enemy to provide a climactic challenge
 */
export default class Boss extends Enemy {
    constructor(scene, x, y, texture = 'unicorn_enemy', frame = 'unicorn_enemy_0', config = {}) {
        // Bosses have more health by default
        const bossConfig = {
            ...config,
            health: config.health || 20,
            type: 'boss'
        }
        
        super(scene, x, y, texture, frame, bossConfig)
        
        this.phase = 1
        this.maxPhases = 3
        this.healthThresholds = [0.66, 0.33] // Phase changes at 66% and 33% health
        
        // Boss specific properties
        this.setScale(1.5) // Bosses are bigger
        this.setDepth(20) // Bosses are on top
        
        // Boss health bar
        if (this.scene.add) {
            this.createHealthBar()
        }
    }

    createHealthBar() {
        this.healthBar = this.scene.add.graphics()
        this.updateHealthBar()
    }

    updateHealthBar() {
        if (!this.healthBar) return
        this.healthBar.clear()
        this.healthBar.fillStyle(0x000000, 0.5)
        this.healthBar.fillRect(this.x - 50, this.y - 100, 100, 10)
        
        const healthPercentage = this.health / this.maxHealth
        this.healthBar.fillStyle(0xff0000, 1)
        this.healthBar.fillRect(this.x - 50, this.y - 100, 100 * healthPercentage, 10)
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta)
        this.updateHealthBar()
        
        // Boss specific AI logic
        this.updateBossAI(time)
    }

    updateBossAI(time) {
        // Boss behavior changes based on phase
        switch(this.phase) {
            case 1:
                // Phase 1: Melee/Patrol
                this._updatePatrolAI(time)
                break
            case 2:
                // Phase 2: Ranged attacks
                this._updateRangedAI(time)
                break
            case 3:
                // Phase 3: Aggressive/Fast
                this.moveSpeed = 150
                this._updateChaseAI(time)
                break
        }
    }

    takeDamage(amount = 1) {
        const dead = super.takeDamage(amount)
        
        if (!dead) {
            this.checkPhaseChange()
        }
        
        return dead
    }

    checkPhaseChange() {
        const healthPercentage = this.health / this.maxHealth
        
        if (this.phase === 1 && healthPercentage <= this.healthThresholds[0]) {
            this.phase = 2
            console.log("Boss entered Phase 2")
        } else if (this.phase === 2 && healthPercentage <= this.healthThresholds[1]) {
            this.phase = 3
            console.log("Boss entered Phase 3")
        }
    }

    destroyEnemy() {
        if (this.healthBar) {
            this.healthBar.destroy()
        }
        
        // Emit boss defeat event
        this.scene.events.emit('bossDefeated', {
            bossId: this.enemyId
        })
        
        super.destroyEnemy()
    }
}
