import Boot from './scenes/boot'
import Preload from './scenes/preload'
import Game from './scenes/game'
import Phaser from 'phaser'

export default {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    pixelArt: true,
    backgroundColor: 'rgb(0, 0, 0)',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: [ Boot, Preload, Game ]
}