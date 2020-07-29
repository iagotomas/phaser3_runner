import { Scene } from 'phaser'
import StateMachine from '../objects/statemachine'
import Player from '../objects/player'

export default class Game extends Scene { 
    constructor() {
        super('game')
        this.player = null;
    }

    preload() {}

    create() {
        console.log('game started')

        this.bg_0 = this.background('sky')
        this.bg_1 = this.background('bg-2')
        this.bg_2 = this.background('bg-3')
        this.bg_3 = this.background('bg-4')
        this.bg_4 = this.background('bg-5')
        this.bg_5 = this.background('bg-6')
        this.bg_6 = this.background('bg-7')
        this.bg_7 = this.background('bg-8')
        this.bg_8 = this.background('bg-9')
        this.bg_9 = this.background('bg-10')
        this.bg_10 = this.background('bg-11')

        this.ground = this.add.tileSprite(0, 0, this.game.config.width * 5, 10, "platform");
        this.ground.setOrigin(0, 0);
        this.ground.setScrollFactor(0);
        // sinc this tile is shorter I positioned it at the bottom of he screen
        this.ground.y = 758;


        const platforms = this.physics.add.staticGroup()
    
        platforms.add(this.ground)
    
        /*platforms.create(600, 400, 'ground')
        platforms.create(50, 250, 'ground')
        platforms.create(750, 220, 'ground')*/


        this.stars = this.physics.add.staticGroup()

        let startX = 400
        for(let i = 0; i < 10; i++) {

            const star = this.stars.create(startX, 720, 'star')
            star.setOrigin(0)
            startX += 100

        }

        this.player = new Player(this, 60, 600, 'cutegirl')
        this.physics.add.collider([this.player, this.stars], platforms)
        this.physics.add.overlap(this.player, this.stars, this.starCollect, null, this)

        this.keys = this.input.keyboard.createCursorKeys()

        // set workd bounds to allow camera to follow the player
        this.cam = this.cameras.main
        this.cam.setBounds(0, 0, this.game.config.width * 3, this.game.config.height)


        // making the camera follow the player
        this.cam.startFollow(this.player)
        this.input.on('pointerup', () => {
            this.scale.startFullscreen()
        }, this)

        this.coinScore = 0
        this.coinCounter = this.add.text(980, 70, `${this.coinScore}`, {
            fontSize: '20px',
            fonetWeight: 'bold',
            fill: '#ffffff'
          })
        this.coinCounter.setScrollFactor(0);
        
    }

    /**
     * 
     * @param {Player} player 
     * @param {Phaser.Physics.Arcade.Sprite} star 
     */
    starCollect(player, star){
        star.destroy(false)
        console.log("collected star")
        this.coinScore ++
        this.coinCounter.setText(`${this.coinScore}`)
    }

    background(frame){
        const bg = this.add.tileSprite(0, 0, this.game.config.width, this.game.config.height, frame)
        bg.setOrigin(0, 0)
        bg.setScrollFactor(0)
        return bg
    }

    update(){
        this.player.step()


        // scroll the texture of the tilesprites proportionally to the camera scroll
        this.bg_1.tilePositionX = this.cam.scrollX * .1
        this.bg_1.tilePositionX = this.cam.scrollX * .3
        this.bg_2.tilePositionX = this.cam.scrollX * .5
        this.bg_3.tilePositionX = this.cam.scrollX * .5
        this.bg_4.tilePositionX = this.cam.scrollX * .6
        this.bg_5.tilePositionX = this.cam.scrollX * .6
        this.bg_6.tilePositionX = this.cam.scrollX * .7
        this.bg_7.tilePositionX = this.cam.scrollX * .7
        this.bg_8.tilePositionX = this.cam.scrollX * .7
        this.bg_9.tilePositionX = this.cam.scrollX * .9
        this.bg_10.tilePositionX = this.cam.scrollX * .9
        this.ground.tilePositionX = this.cam.scrollX
    }
}