import Phaser from 'phaser'

/**
 * Basic Enemy class for testing projectile collision system
 * Follows the established patterns from Player and other game objects
 */
export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    /**
     * Creates a new Enemy instance
     * @param {Phaser.Scene} scene - The scene this enemy belongs to
     * @param {number} x - Initial X position
     * @param {number} y - Initial Y position
     * @param {string} texture - Texture key for the enemy sprite
     * @param {number|string} frame - Frame for the enemy sprite
     * @param {Object} config - Configuration options
     */
    constructor(scene, x, y, texture = 'ponygirl', frame = 'castle_unicorn', config = {}) {
        super(scene, x, y, texture, frame)
        
        this.scene = scene
        
        // Add to scene and physics
        scene.add.existing(this)
        scene.physics.add.existing(this)
        
        // Enemy configuration with defaults
        this.maxHealth = config.health || 3
        this.health = this.maxHealth
        this.enemyType = config.type || 'basic'
        this.damage = config.damage || 1
        
        // Set up physics properties
        this.setCollideWorldBounds(true)
        this.setBounce(0.2)
        this.setGravityY(300)
        
        // Set appropriate size for collision detection
        const targetWidth = 100
        const targetHeight = 100
        this.body.setSize(targetWidth * 0.8, targetHeight * 0.8)
        this.body.setOffset(targetWidth * 0.1, targetHeight * 0.1)
        
        // Set depth according to design specification (depth 16)
        this.setDepth(16)
        
        // Scale the enemy to appropriate size
        this.setScale(0.5)
        
        // Movement properties for basic AI
        this.moveSpeed = config.moveSpeed || 50
        this.moveDirection = 1
        this.lastDirectionChange = 0
        this.directionChangeInterval = 2000 // Change direction every 2 seconds
        
        // Visual feedback properties
        this.isFlashing = false
        this.originalTint = 0xffffff
        
        // Generate unique ID for this enemy
        this.enemyId = `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        console.log(`Enemy created: ${this.enemyId} at (${x}, ${y}) with ${this.health} health`)
    }
    
    /**
     * Called every frame to update enemy behavior
     * @param {number} time - Current game time
     * @param {number} delta - Time since last frame
     */
    preUpdate(time, delta) {
        super.preUpdate(time, delta)
        
        // Simple AI: move back and forth
        this.updateMovement(time)
    }
    
    /**
     * Updates enemy movement with simple AI
     * @param {number} time - Current game time
     */
    updateMovement(time) {
        // Change direction periodically
        if (time - this.lastDirectionChange > this.directionChangeInterval) {
            this.moveDirection *= -1
            this.lastDirectionChange = time
        }
        
        // Apply movement
        this.setVelocityX(this.moveSpeed * this.moveDirection)
        
        // Flip sprite based on movement direction
        this.setFlipX(this.moveDirection < 0)
    }
    
    /**
     * Handles damage taken by the enemy
     * @param {number} amount - Amount of damage to take
     * @returns {boolean} - True if enemy was destroyed, false otherwise
     */
    takeDamage(amount = 1) {
        if (this.health <= 0) {
            return false // Already dead
        }
        
        this.health -= amount
        console.log(`Enemy ${this.enemyId} took ${amount} damage. Health: ${this.health}/${this.maxHealth}`)
        
        // Visual feedback for taking damage
        this.flashRed()
        
        // Check if enemy should be destroyed
        if (this.health <= 0) {
            this.destroyEnemy()
            return true
        }
        
        return false
    }
    
    /**
     * Provides visual feedback when enemy takes damage
     */
    flashRed() {
        if (this.isFlashing) return
        
        this.isFlashing = true
        this.setTint(0xff0000) // Red tint
        
        // Return to normal color after brief flash
        this.scene.time.delayedCall(150, () => {
            this.setTint(this.originalTint)
            this.isFlashing = false
        })
    }
    
    /**
     * Destroys the enemy with visual effects
     */
    destroyEnemy() {
        console.log(`Enemy ${this.enemyId} destroyed`)
        
        // Create destruction effect (simple scale down)
        this.scene.tweens.add({
            targets: this,
            scaleX: 0,
            scaleY: 0,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                this.destroy()
            }
        })
        
        // Emit event for game scene to handle (scoring, etc.)
        this.scene.events.emit('enemyDestroyed', {
            enemyId: this.enemyId,
            enemyType: this.enemyType,
            position: { x: this.x, y: this.y }
        })
    }
    
    /**
     * Gets current enemy status information
     * @returns {Object} - Enemy status data
     */
    getStatus() {
        return {
            id: this.enemyId,
            health: this.health,
            maxHealth: this.maxHealth,
            type: this.enemyType,
            position: { x: this.x, y: this.y },
            isAlive: this.health > 0
        }
    }
    
    /**
     * Checks if enemy is still alive
     * @returns {boolean} - True if enemy has health remaining
     */
    isAlive() {
        return this.health > 0
    }
    
    /**
     * Gets the damage this enemy deals to the player
     * @returns {number} - Damage amount
     */
    getDamage() {
        return this.damage
    }
}