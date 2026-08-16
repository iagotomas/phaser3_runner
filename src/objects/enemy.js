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
    constructor(scene, x, y, texture = 'unicorn_enemy', frame = 'unicorn_enemy_0', config = {}) {
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
        this.body.setOffset(targetWidth *  0.05, targetHeight * 2.5)
        
        // Set depth according to design specification (depth 16)
        this.setDepth(16)
        
        // Scale the enemy to appropriate size
        this.setScale(0.5)
        
        // Movement properties for basic AI
        this.moveSpeed = config.moveSpeed || 50
        this.moveDirection = 1
        this.lastDirectionChange = 0
        this.directionChangeInterval = config.directionChangeInterval || 2000
        this.nextDirectionChange = this.directionChangeInterval
        this.pauseChance = config.pauseChance !== undefined ? config.pauseChance : 0.15
        this.isPaused = false
        this.pauseUntil = 0

        // AI type properties
        this.aiType = config.aiType || 'patrol'
        this.target = config.target || null
        this.chaseRange = config.detectionRadius !== undefined
            ? config.detectionRadius
            : (config.chaseRange !== undefined ? config.chaseRange : 300)
        this.attackRange = config.attackRange !== undefined ? config.attackRange : 400
        this.attackInterval = config.attackInterval !== undefined ? config.attackInterval : 2000
        this.lastAttackTime = 0
        
        // Visual feedback properties
        this.isFlashing = false
        this.originalTint = 0xffffff
        
        // Generate unique ID for this enemy
        this.enemyId = `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        const anims = scene.anims
        
        if (!anims.exists('dead_enemy')) {
            anims.create({
                key: 'dead_enemy',
                frames: anims.generateFrameNames(texture, {prefix: 'unicorn_enemy_',start:1, end: 8, zeroPad: 0 }),
                frameRate: 12,
                repeat: 0
            })
        }
        if (!anims.exists('walk_enemy')) {
            anims.create({
                key: 'walk_enemy',
                frames: anims.generateFrameNames(texture, { prefix: 'unicorn_enemy_',start:0, end: 7, zeroPad: 0  }),
                frameRate: 10,
                repeat: -1
            })
        }
        if (!anims.exists('idle_enemy')) {
            anims.create({
                key: 'idle_enemy',
                frames: anims.generateFrameNames(texture, { prefix: 'unicorn_enemy_',start:0, end: 2, zeroPad: 0  }),
                frameRate: 3,
                repeat: -1
            })
        }
        if (!anims.exists('attack_enemy')) {
            anims.create({
                key: 'attack_enemy',
                frames: anims.generateFrameNames(texture, { prefix: 'unicorn_enemy_',start:0, end: 5, zeroPad: 0  }),
                frameRate: 8,
                repeat: 0
            })
        }
        console.log(`Enemy created: ${this.enemyId} at (${x}, ${y}) with ${this.health} health`)
        this.anims.play('walk_enemy')
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
        if (this.aiType === 'chase') {
            this._updateChaseAI(time)
        } else if (this.aiType === 'ranged') {
            this._updateRangedAI(time)
        } else {
            this._updatePatrolAI(time)
        }
    }

    _updatePatrolAI(time) {
        // Change direction periodically
        if (this.isPaused) {
            this.setVelocityX(0)
            if (this.anims.currentAnim.key !== 'idle_enemy') {
                this.anims.play('idle_enemy')
            }
            if (time >= this.pauseUntil) {
                this.isPaused = false
                this.anims.play('walk_enemy')
            } else {
                return
            }
        }

        if (time - this.lastDirectionChange >= this.nextDirectionChange) {
            this.moveDirection *= -1
            this.lastDirectionChange = time
            this.nextDirectionChange = this.directionChangeInterval * (0.7 + Math.random() * 0.8)
            if (Math.random() < this.pauseChance) {
                this.isPaused = true
                this.pauseUntil = time + 250 + Math.random() * 500
                this.setVelocityX(0)
                this.anims.play('idle_enemy')
                return
            }
        }
        
        // Apply movement
        const variedSpeed = this.moveSpeed * (0.8 + Math.random() * 0.4)
        this.setVelocityX(variedSpeed * this.moveDirection)
        
        if (this.anims.currentAnim.key !== 'walk_enemy') {
            this.anims.play('walk_enemy')
        }
        
        // Flip sprite based on movement direction
        this.setFlipX(this.moveDirection < 0)
    }

    _updateChaseAI(time) {
        if (this.target) {
            const dx = this.target.x - this.x
            const distance = Math.abs(dx)
            if (distance <= this.chaseRange) {
                const direction = dx > 0 ? 1 : -1
                this.setVelocityX(this.moveSpeed * direction)
                this.setFlipX(direction < 0)
                return
            }
        }
        this._updatePatrolAI(time)
    }

    _updateRangedAI(time) {
        if (this.target) {
            const dx = this.target.x - this.x
            const dy = this.target.y - this.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            if (distance <= this.attackRange) {
                this.setVelocityX(0)
                if (this.anims.currentAnim.key !== 'attack_enemy') {
                    this.anims.play('attack_enemy')
                }
                if (time - this.lastAttackTime >= this.attackInterval) {
                    this.lastAttackTime = time
                    this.scene.events.emit('enemyRangedAttack', {
                        enemy: this,
                        targetX: this.target.x,
                        targetY: this.target.y
                    })
                }
                return
            }
        }
        this._updatePatrolAI(time)
    }

    getAiType() {
        return this.aiType
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
        
        this.anims.play('dead_enemy')
        
        // Create destruction effect (simple scale down)
        this.scene.tweens.add({
            targets: this,
            scaleX: 0,
            scaleY: 0,
            alpha: 0,
            duration: 500,
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