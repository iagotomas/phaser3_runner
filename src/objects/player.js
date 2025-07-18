import Phaser, {Scene} from 'phaser'
import State from '../objects/state'
import StateMachine from '../objects/statemachine'
import CustomizationManager from '../objects/customization'
import BallInventory from '../objects/ballInventory'

export default class Player extends Phaser.Physics.Arcade.Sprite {
  /**
   * 
   * @param {Scene} scene 
   * @param {number} x 
   * @param {number} y 
   * @param {string} texture 
   * @param {number|string} frame 
   */
    constructor(scene, x, y, texture, frame) {
        super(scene, x, y, texture, frame)
        this.scene = scene
        scene.add.existing(this)
        scene.physics.add.existing(this)
        // Set default size (320x320)
        const targetWidth = 310
        const targetHeight = 310
        // Adjust physics body size (make it smaller than visual size)
        this.body.setSize(targetWidth * 0.6, targetHeight * 0.5)
        this.body.setOffset(targetWidth * 0.05, targetHeight * 0.18)

        const anims = scene.anims
        const key = texture
        anims.create({
            key: 'dead',
            frames: anims.generateFrameNames(key, {prefix: 'little_girl_riding_',start:1, end: 12, zeroPad: 2 }),
            frameRate: 6,
            repeat: 0
        })
        anims.create({
            key: 'walk',
            frames: anims.generateFrameNames(key, { prefix: 'little_girl_riding_',start:1, end: 12, zeroPad: 2  }),
            frameRate: 10,
            repeat: -1
        })
        anims.create({
            key: 'jump',
            frames: anims.generateFrameNames('ponygirl-jump', {prefix: 'little_girl_riding_jump_',start:1, end: 6, zeroPad: 2 }),
            frameRate: 8,
            repeat: 0
        })
        anims.create({
            key: 'idle',
            frames: anims.generateFrameNames(key, {prefix: 'little_girl_standing_',start:2, end: 5 }),
            frameRate: 1,
            repeat: -1
        }) 
        //this.setCollideWorldBounds(true)   
        this.setBounce(0.5)
        this.setGravityY(300)
        this.direction = 'idle'

        this.on('animationcomplete', (anim, frame) => {
          this.emit('animationcomplete_' + anim.key, anim, frame);
        }, this)


        this.stateMachine = new StateMachine('idle',{
                idle: new IdleState(),
                move: new MoveState(),
                jump: new JumpState(),
                dead: new DeadState(),
            }, [scene, this]) 

        // Add customization manager
        this.customization = new CustomizationManager()
        
        // Initialize ball inventory for ammunition management
        this.ballInventory = new BallInventory(scene)
        
        // Initialize cosmetics
        this.hat = null
        this.trail = null
        
        // Store player depth for reference
        this.baseDepth = this.depth
        
        // Apply equipped items
        this.applyCosmetics()
    }

    applyCosmetics() {
        const equipped = this.customization.getEquippedItems()
        
        // Apply hat if equipped
        if (equipped.hat) {
            const hatData = this.customization.findItem(equipped.hat)
            if (this.hat) this.hat.destroy()
            this.hat = this.scene.add.image(
                this.x + hatData.offset.x, 
                this.y + hatData.offset.y, 
                hatData.sprite
            )
            this.hat.setRotation(hatData.rotation)
            this.hat.setDepth(this.baseDepth + 1)
        }
        
        // Apply trail if equipped
        if (equipped.trail) {
            const trailData = this.customization.findItem(equipped.trail)
            if (this.trail) this.trail.destroy()
            
            // Create new particle effect using Phaser 3.60+ syntax
            this.trail = this.scene.add.particles(-50, 50, trailData.particle, {
                follow: this,
                frequency: 50,
                scale: { start: 1.5, end: 0 },
                alpha: { start: 0.6, end: 0 },
                lifespan: 1000,
                speed: { min: 0, max: 20 },
                angle: { min: 0, max: 360 },
                blendMode: Phaser.BlendModes.ADD
            })
            
            this.trail.setDepth(this.baseDepth - 1) // Make sure trail appears behind player
        }
    }

    setDepth(value) {
        super.setDepth(value)
        this.baseDepth = value
        
        // Update cosmetics depths
        if (this.hat) {
            this.hat.setDepth(this.baseDepth + 1)
        }
        if (this.trail) {
            this.trail.setDepth(this.baseDepth - 1)
        }
        return this
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta)
        
        // Update hat position if equipped
        if (this.hat) {
            const hatData = this.customization.findItem(this.customization.getEquippedItems().hat)
            this.hat.setPosition(
                this.x + (this.flipX ? -hatData.offset.x : hatData.offset.x), 
                this.y + hatData.offset.y
            )
            this.hat.setFlipX(this.flipX)
            // Ensure hat depth stays correct
            this.hat.setDepth(this.baseDepth + 1)
        }
    }

    step() {
        this.stateMachine.step()
    }

    // Ball inventory access methods
    
    /**
     * Gets the player's ball inventory instance
     * @returns {BallInventory} - The player's ball inventory
     */
    getInventory() {
        return this.ballInventory
    }

    /**
     * Adds a ball to the player's inventory
     * @returns {boolean} - True if ball was successfully added, false if inventory is full
     */
    addBall() {
        return this.ballInventory.addBall()
    }

    /**
     * Removes a ball from the player's inventory
     * @returns {boolean} - True if ball was successfully removed, false if inventory is empty
     */
    removeBall() {
        return this.ballInventory.removeBall()
    }

    /**
     * Gets the current ball count in the player's inventory
     * @returns {number} - Current number of balls in inventory
     */
    getBallCount() {
        return this.ballInventory.getCount()
    }

    /**
     * Checks if the player's inventory is full
     * @returns {boolean} - True if inventory is at maximum capacity
     */
    isInventoryFull() {
        return this.ballInventory.isFull()
    }

    /**
     * Checks if the player's inventory is empty
     * @returns {boolean} - True if inventory has no balls
     */
    isInventoryEmpty() {
        return this.ballInventory.isEmpty()
    }
}


export class MoveState extends State {
    enter(scene, sprite) {
        sprite.anims.play('walk')
    }

    execute(scene, sprite) {
        const {space} = scene.keys
        
        // Check for jump
        if (space.isDown) {
            this.stateMachine.transition('jump')
            return
        }
        
        // Point and click movement
        if (scene.moveTarget) {
            const distanceToTarget = scene.moveTarget - sprite.x
            const STOP_THRESHOLD = 10
            
            if (Math.abs(distanceToTarget) > STOP_THRESHOLD) {
                // Move towards target
                if (distanceToTarget > 0) {
                    sprite.setVelocityX(300)
                    sprite.flipX = false
                } else {
                    sprite.setVelocityX(-300)
                    sprite.flipX = true
                }
                sprite.direction = 'walk'
            } else {
                // Stop at target
                sprite.setVelocityX(0)
                sprite.direction = 'idle'
                scene.moveTarget = null
                this.stateMachine.transition('idle')
            }
        } else {
            // No target, stop moving
            sprite.setVelocityX(0)
            sprite.direction = 'idle'
            this.stateMachine.transition('idle')
        }
        
        sprite.anims.play(`${sprite.direction}`, true)
    }
}

export class IdleState extends State {
    enter(scene, sprite) {
        sprite.setVelocityX(0)
        sprite.anims.play('idle')
    }

    execute(scene, sprite) {
        const {space} = scene.keys
        
        // Check for jump
        if (space.isDown) {
            this.stateMachine.transition('jump')
            return
        }
        
        // Check for movement target
        if (scene.moveTarget) {
            const distanceToTarget = scene.moveTarget - sprite.x
            if (Math.abs(distanceToTarget) > 10) {
                this.stateMachine.transition('move')
                return
            }
        }
    }
}

export class JumpState extends State {
    /**
     * 
     * @param {Scene} scene 
     * @param {Phaser.Physics.Arcade.Sprite} sprite 
     */
     enter(scene, sprite) {
        // Initial jump
        sprite.setVelocityY(-400)
        
        // Lock horizontal velocity at jump start
        this.initialVelocityX = sprite.body.velocity.x
        sprite.setVelocityX(this.initialVelocityX)
        
        // Play jump animation
        sprite.anims.play('jump')
        
        // Initialize state flags
        this.hasDoubleJumped = false
        this.isJumping = true
        this.wasInAir = false
        
        // Track space key release for double jump control
        this.spaceKeyReleased = false
        
        // Listen for animation completion
        sprite.once('animationcomplete_jump', () => {
            this.isJumping = false
        })
    }

    execute(scene, sprite) {
        const {space} = scene.keys
        
        // Track if space key has been released (needed for double jump)
        if (!space.isDown) {
            this.spaceKeyReleased = true
        }
        
        // Check for double jump
        if (space.isDown && this.spaceKeyReleased && !this.hasDoubleJumped && !this.isJumping) {
            sprite.setVelocityY(-300) // Slightly weaker second jump
            this.hasDoubleJumped = true
            sprite.anims.play('jump', true) // Play jump animation again
            return
        }
        
        // Lock horizontal velocity during jump
        sprite.setVelocityX(this.initialVelocityX)
        
        // Landing detection
        if (sprite.body.velocity.y > 0) {
            this.wasInAir = true
        }
        
        // Check for landing only if we were in the air
        if (this.wasInAir && (sprite.body.blocked.down || sprite.body.touching.down)) {
            // Transition to appropriate state based on initial velocity
            if (Math.abs(this.initialVelocityX) > 0) {
                this.stateMachine.transition('move')
            } else {
                this.stateMachine.transition('idle')
            }
        }
    }

    exit(scene, sprite) {
        // Reset all state flags on exit
        this.hasDoubleJumped = false
        this.isJumping = false
        this.wasInAir = false
        this.spaceKeyReleased = false
    }
}

export class DeadState extends State {
    /**
     * 
     * @param {Scene} scene 
     * @param {Phaser.Physics.Arcade.Sprite} sprite 
     */
    enter(scene, sprite){
        //hero.anims.stop()
        sprite.setVelocity(0)
        sprite.anims.play('dead', true)
    }
    /**
     * 
     * @param {Scene} scene 
     * @param {Phaser.Physics.Arcade.Sprite} sprite 
     */
    execute(scene, sprite){
        //console.log("Dead state")
    }
}