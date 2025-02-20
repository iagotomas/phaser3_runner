import Boot from './scenes/boot'
import Preload from './scenes/preload'
import Game from './scenes/game'
import JumpChallenge from './scenes/minigames/jumpChallenge'
import Phaser from 'phaser'

// Reference resolution (design size)
const GAME_WIDTH = 1280
const GAME_HEIGHT = 820

// Get initial window dimensions
const width = window.innerWidth
const height = window.innerHeight

// Calculate zoom factor
const zoom = Math.min(width / GAME_WIDTH, height / GAME_HEIGHT)

export default {
    type: Phaser.CANVAS,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    scale: {
        mode: Phaser.Scale.FIT,
        parent: 'game',
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        orientation: Phaser.Scale.LANDSCAPE,
        lockOrientation: true,
        min: {
            width: 480,
            height: 270
        },
        max: {
            width: 1920,
            height: 1080
        },
        zoom: zoom
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
    scene: [ Boot, Preload, Game, JumpChallenge ]
}