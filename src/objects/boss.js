import Phaser from 'phaser'

/**
 * Boss class for end-of-level encounters.
 * Extends Phaser.Physics.Arcade.Sprite.
 */
export default class Boss extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, frame, config = {}) {
        // Mocking super call for testing if scene is not a full Phaser scene
        if (scene && scene.add) {
            super(scene, x, y, texture, frame)
        } else {
            // Fallback for testing
            super(scene, x, y, texture, frame)
        }
        
        this.scene = scene
        if (scene && scene.add) {
            scene.add.existing(this)
            scene.physics.add.existing(this)
        }
        
        this.maxHealth = config.health || 50
        this.health = this.maxHealth
        this.damage = config.damage || 5
        this.phases = config.phases || 2
        this.currentPhase = 1
        
        if (scene && scene.physics) {
            this.setCollideWorldBounds(true)
            this.setGravityY(0)
        }
        
        // UI: Health Bar
        if (scene && scene.add) {
            this.healthBar = this.createHealthBar()
            this.setDepth(25)
        }
        
        console.log(`Boss spawned with ${this.health} health`)
    }

    createHealthBar() {
        const barWidth = 400
        const barHeight = 30
        const x = this.scene.scale.width / 2 - barWidth / 2
        const y = 50
        
        const container = this.scene.add.container(x, y)
        const bg = this.scene.add.rectangle(0, 0, barWidth, barHeight, 0x333333)
        const bar = this.scene.add.rectangle(-barWidth / 2, 0, barWidth, barHeight, 0xff0000)
        bar.setOrigin(0, 0.5)
        
        container.add([bg, bar])
        container.setScrollFactor(0)
        container.setDepth(1000)
        
        this.healthBarRect = bar
        this.healthBarWidth = barWidth
        
        return container
    }

    updateHealthBar() {
        const percentage = this.health / this.maxHealth
        this.healthBarRect.width = this.healthBarWidth * percentage
    }

    takeDamage(amount) {
        this.health -= amount
        this.updateHealthBar()
        
        if (this.health <= 0) {
            this.die()
        } else {
            this.checkPhaseChange()
        }
    }

    checkPhaseChange() {
        const healthPercentage = this.health / this.maxHealth
        if (this.currentPhase === 1 && healthPercentage <= 0.5) {
            this.currentPhase = 2
            console.log("Boss entered Phase 2")
            // Trigger phase 2 behavior changes here
        }
    }

    die() {
        this.healthBar.destroy()
        this.scene.events.emit('bossDefeated')
        this.destroy()
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta)
        // Boss movement and attack patterns logic
    }
}
