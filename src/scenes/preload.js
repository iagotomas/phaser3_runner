import { Scene } from 'phaser'

export default class Preload extends Scene {
    constructor() {
        super('preload')
    }

    preload() {

        this.load.image('sky', 'assets/sky.png')
        this.load.image('star', 'assets/star.png')
        this.load.image('bomb', 'assets/bomb.png')
        this.load.atlas('world', 'assets/tileset.png', 'assets/tileset.json')
        //this.load.atlas('cutegirl', 'assets/cutegirl_spritesheet.png', 'assets/cutegirl_spritesheet.json')
        this.load.atlas('ponygirl', 'assets/game_sprites.png', 'assets/game_sprites.json')
        this.load.atlas('ponygirl-jump', 'assets/girl_jumping.png', 'assets/girl_jumping.json')
        //this.load.atlas('dino', 'assets/dino.png', 'assets/dino.json')
        this.load.image('tiles', 'assets/tileset.png')
        this.load.image('bg-11', 'assets/background/Layer_0000_9.png')
        this.load.image('bg-10', 'assets/background/Layer_0001_8.png')
        this.load.image('bg-9', 'assets/background/Layer_0002_7.png')
        this.load.image('bg-8', 'assets/background/Layer_0003_6.png')
        this.load.image('bg-7', 'assets/background/Layer_0004_Lights.png')
        this.load.image('bg-6', 'assets/background/Layer_0005_5.png')
        this.load.image('bg-5', 'assets/background/Layer_0006_4.png')
        this.load.image('bg-4', 'assets/background/Layer_0007_Lights.png')
        this.load.image('bg-3', 'assets/background/Layer_0008_3.png')
        this.load.image('bg-2', 'assets/background/Layer_0009_2.png')
        this.load.image('bg-1', 'assets/background/Layer_0010_1.png')
        this.load.image('ground', 'assets/background/ground.png')
        this.load.image('platform', 'assets/platform.png')
        this.load.spritesheet('engineer', 'assets/Engineer.png', { frameWidth: 32, frameHeight: 32, endFrame: 16 })
        
        // Load cosmetic items
        this.load.image('hat1', 'assets/cosmetics/party-hat.png')
        //this.load.image('hat2', 'assets/cosmetics/crown.png')
        //this.load.image('hat3', 'assets/cosmetics/wizard-hat.png')
        //this.load.image('sparkle', 'assets/particles/sparkle.png')
        //this.load.image('rainbow', 'assets/particles/rainbow.png')
        this.load.image('star', 'assets/particles/star.png')
    }

    create() {
        console.log('preload started')
        this.scene.start('game')
    }
}