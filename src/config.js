import Boot from './scenes/boot'
import Preload from './scenes/preload'
import Game from './scenes/game'
import Phaser from 'phaser'

// Get initial window dimensions
const maxHeight = 820
const width = window.innerWidth
const height = window.innerHeight > maxHeight ? maxHeight : window.innerHeight

export default {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        parent: 'game',
        width: width,        // Use actual pixels instead of percentage
        height: height,      // Use actual pixels instead of percentage
        autoCenter: Phaser.Scale.CENTER_BOTH,
        min: {
            width: 320,
            height: 240
        },
        max: {
            width: 1600,
            height: maxHeight
        },
        zoom: 1
    },
    pixelArt: true,
    backgroundColor: 'rgb(0, 0, 0)',
    fps: {
        target: 60,
        forceSetTimeOut: false
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false,
            fps: 60
        }
    },
    render: {
        powerPreference: 'high-performance',
        antialias: false,
        pixelArt: true
    },
    scene: [ Boot, Preload, Game ]
}