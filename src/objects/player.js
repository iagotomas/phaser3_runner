import Phaser, {Scene} from 'phaser'
import State from '../objects/state'
import StateMachine from '../objects/statemachine'

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
        scene.add.existing(this)
        scene.physics.add.existing(this)
        const anims = scene.anims
        const key = 'cutegirl'
        anims.create({
            key: 'dead',
            frames: anims.generateFrameNames(key, {prefix: 'Dead_', end: 30 }),
            frameRate: 15,
            repeat: 0
        })
        anims.create({
            key: 'walk',
            frames: anims.generateFrameNames(key, { prefix: 'Run_', end: 20 }),
            frameRate: 15,
            repeat: -1
        })
        anims.create({
            key: 'jump',
            frames: anims.generateFrameNames(key, {prefix: 'Jump_', end: 30 }),
            frameRate: 15,
            repeat: 0
        })
        anims.create({
            key: 'idle',
            frames: anims.generateFrameNames(key, {prefix: 'Idle_', end: 20 }),
            frameRate: 15,
            repeat: -1
        }) 
        //this.setCollideWorldBounds(true)   
        this.setBounce(0.2)
        this.setGravityY(10)
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
     execute(scene, sprite) {
       const {left, right, up, down, space} = scene.keys
       // Transition to jump if pressing space
       if (space.isDown) {
         this.stateMachine.transition('jump')
         return
       }
       // Transition to dead if pressing down
       if (down.isDown) {
         this.stateMachine.transition('dead')
         return
       }
       
       // Transition to idle if not pressing movement keys
       if (!(left.isDown || right.isDown || up.isDown)) {
         this.stateMachine.transition('idle')
         return
       }
       
       sprite.setVelocity(0)
       if (down.isDown) {
         sprite.direction = 'dead'
       }
       if(up.isDown) {
         sprite.direction = 'jump'
         sprite.setVelocityY(100)
       }
       if (left.isDown) {
         sprite.setVelocityX(-100)
         sprite.direction = 'walk'
         sprite.flipX = true
       } else if (right.isDown) {
         sprite.setVelocityX(100)
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
       //hero.anims.stop();
     }
     /**
      * 
      * @param {Scene} scene 
      * @param {Phaser.Physics.Arcade.Sprite} sprite 
      */
     execute(scene, sprite) {
       const {left, right, up, down, space} = scene.keys;
       
       // Transition to swing if pressing space
       if (space.isDown) {
         this.stateMachine.transition('jump');
         return;
       }
       
       // Transition to dead if pressing down
       if (down.isDown) {
         this.stateMachine.transition('dead');
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
       //sprite.setVelocity(0)
       //sprite.anims.stop()
       //hero.setVelocityY(100)
       sprite.setVelocityY(-300)
       sprite.anims.play('jump', true)
       const stateMachine = this.stateMachine
       sprite.on('animationcomplete_jump', () => {
          stateMachine.transition('idle')
       })
     }
     /**
      * 
      * @param {Scene} scene 
      * @param {Phaser.Physics.Arcade.Sprite} sprite 
      */
     execute(scene, sprite) {
       const {left, right, up, down, space} = scene.keys
 
       
       
       // Transition to dead if pressing down
       /*if (down.isDown) {
         this.stateMachine.transition('dead')
         return
       }*/
 
       // Transition to move if pressing a movement key
       /*if (left.isDown || right.isDown || up.isDown) {
         this.stateMachine.transition('move')
         return
       }*/
       
       // Transition to idle if not pressing movement keys
       /*if (!(left.isDown || right.isDown || up.isDown )) {
         this.stateMachine.transition('idle')
         return
       }*/
 
       //hero.setVelocity(0)
      /* 
       sprite.anims.play('jump')
       hero.setVelocityY(400)
       hero.anims.play('jump', true)
       if(space.isDown){
       }*/
 
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