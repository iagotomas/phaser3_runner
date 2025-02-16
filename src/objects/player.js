import Phaser, {Scene} from 'phaser'
import State from '../objects/state'
import StateMachine from '../objects/statemachine'
import CustomizationManager from '../objects/customization'

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
        //this.displayHeight = 320
        //this.input.hitArea = new Phaser.Geom.Rectangle(0, 0, 320, 320)
        this.setScale(0.6, 0.6)
        this.setBodySize(180, 180, false)
        this.setSizeToFrame(true)
        //this.setBodySize(170, 170)
        //this.setDisplaySize(120, 120)
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
            frames: anims.generateFrameNames(key, {prefix: 'little_girl_standing_',start:1, end: 3 }),
            frameRate: 5,
            repeat: -1
        }) 
        //this.setCollideWorldBounds(true)   
        this.setBounce(0.2)
        this.setGravityY(200)
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
        
        // Initialize cosmetics
        this.hat = null
        this.trail = null
        
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
            this.hat.setDepth(this.depth + 1)
        }
        
        // Apply trail if equipped
        if (equipped.trail) {
            const trailData = this.customization.findItem(equipped.trail)
            if (this.trail) this.trail.destroy()
            
            // Create new particle effect using Phaser 3.60+ syntax
            this.trail = this.scene.add.particles(0, 0, trailData.particle, {
                follow: this,
                frequency: 50,
                scale: { start: 0.5, end: 0 },
                alpha: { start: 0.6, end: 0 },
                lifespan: 1000,
                speed: { min: 0, max: 20 },
                angle: { min: 0, max: 360 },
                blendMode: 'ADD'
            })
            
            this.trail.setDepth(this.depth - 1) // Make sure trail appears behind player
        }
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
        }
    }

    step() {
        this.stateMachine.step()
    }
}


export class MoveState extends State {
  /**
   * 
   * @param {Scene} scene 
   * @param {Phaser.Physics.Arcade.Sprite} sprite 
   */
    enter(scene, sprite) {
      sprite.setVelocity(0);
      sprite.anims.play('idle');
    } 
    /**
     * 
     * @param {Scene} scene 
     * @param {Phaser.Physics.Arcade.Sprite} sprite 
     */
     execute(scene, sprite) {
       const {left, right, up, down, space} = scene.keys
       
       // Simplified jump check
       if (space.isDown) {
           this.stateMachine.transition('jump')
           return
       }
       
       sprite.setVelocity(0)
       if (left.isDown) {
         sprite.setVelocityX(-300)
         sprite.direction = 'walk'
         sprite.flipX = true
       } else if (right.isDown) {
         sprite.setVelocityX(300)
         sprite.direction = 'walk'
         sprite.flipX = false
       }
       
       sprite.anims.play(`${sprite.direction}`, true)
     }
   }
 
  export class IdleState extends State {
   /**
    * 
    * @param {Scene} scene 
    * @param {Phaser.Physics.Arcade.Sprite} sprite 
    */
     enter(scene, sprite) {
       sprite.setVelocity(0);
       sprite.anims.play('idle');
     }
     /**
      * 
      * @param {Scene} scene 
      * @param {Phaser.Physics.Arcade.Sprite} sprite 
      */
     execute(scene, sprite) {
       const {left, right, up, down, space} = scene.keys;
       
       // Simplified jump check
       if (space.isDown) {
           this.stateMachine.transition('jump');
           return;
       }
       
       // Transition to move if pressing a movement key
       if (left.isDown || right.isDown || up.isDown ) {
           this.stateMachine.transition('move');
           return;
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
        this.isJumping = true
        sprite.setVelocityY(-300)
        // Lock horizontal velocity at jump start
        this.initialVelocityX = sprite.body.velocity.x
        sprite.setVelocityX(this.initialVelocityX)
        
        sprite.anims.play('jump')
        sprite.once('animationcomplete_jump', () => {
          sprite.setVelocityY(600)
            this.isJumping = false
            this.stateMachine.transition('idle')
        })
    }

    execute(scene, sprite) {
      const {left, right, up, down, space} = scene.keys;
        // Keep the initial velocity locked during the entire jump
        if (this.isJumping) {
            sprite.setVelocityX(this.initialVelocityX)
            return
        }
        // Transition to move if pressing a movement key
        if (left.isDown || right.isDown || up.isDown ) {
            return;
        }
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