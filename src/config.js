import Boot from './scenes/boot'
import Preload from './scenes/preload'
import Game from './scenes/game'
import MazeChallenge from './scenes/minigames/mazeChallenge'
import PuzzleChallenge from './scenes/minigames/puzzleChallenge'
import HangmanChallenge from './scenes/minigames/hangmanChallenge'
import MemoryChallenge from './scenes/minigames/memoryChallenge'
import SpaceLevel from './scenes/spaceLevel'
import Phaser from 'phaser'

// Reference resolution (design size)
const GAME_WIDTH = 1920//window.innerWidth>window.innerHeight?window.innerWidth:window.innerHeight//1280
const GAME_HEIGHT = 1080//window.innerWidth>window.innerHeight?window.innerHeight:window.innerWidth //820

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
        min: {
            width: 360,
            height: 240
        },
        max: {
            width: 1920,
            height: 1080
        }
    },
    pixelArt: true,
    backgroundColor: 'rgb(0, 0, 0)',
    fps: {
        target: 30,
        forceSetTimeOut: false
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false,
            fps: 30
        }
    },
    render: {
        powerPreference: 'high-performance',
        antialias: false,
        pixelArt: true
    },
    scene: [ Boot, Preload, Game, SpaceLevel, MazeChallenge, PuzzleChallenge, HangmanChallenge, MemoryChallenge ]
}