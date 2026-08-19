import Phaser from 'phaser'

export const OBSTACLE_TYPES = { STATIC: 'static', MOVING: 'moving' }
const STATIC_OBSTACLE_TEXTURE = 'puddle-water'
const STATIC_OBSTACLE_CROP = { x: 145, y: 160, width: 565, height: 315 }

export default class Obstacle extends Phaser.Physics.Arcade.Image {
    constructor(scene, x, y, config = {}) {
        const type = config.type || 'static'
        const defaultWidth = type === OBSTACLE_TYPES.STATIC ? 120 : 60
        const defaultHeight = type === OBSTACLE_TYPES.STATIC ? 68 : 60
        const width = config.width !== undefined ? config.width : defaultWidth
        const height = config.height !== undefined ? config.height : defaultHeight
        const color = config.color !== undefined ? config.color : 0x8B4513

        const key = type === OBSTACLE_TYPES.STATIC
            ? STATIC_OBSTACLE_TEXTURE
            : `obstacle_tex_${width}_${height}_${color}`
        if (type !== OBSTACLE_TYPES.STATIC && !scene.textures.exists(key)) {
            const gfx = scene.add.graphics()
            gfx.fillStyle(color, 1)
            gfx.fillRect(0, 0, width, height)
            gfx.generateTexture(key, width, height)
            gfx.destroy()
        }

        super(scene, x, y, key)

        this.obstacleType = type
        this.obstacleWidth = width
        this.obstacleHeight = height

        scene.add.existing(this)
        // ObstacleManager stores all obstacles in a dynamic physics group.
        // Using a static body here causes Phaser group callbacks to fail.
        scene.physics.add.existing(this, false)

        this.setImmovable(true)
        if (type === OBSTACLE_TYPES.STATIC) {
            this.body.setAllowGravity(false)
            this.setCrop(
                STATIC_OBSTACLE_CROP.x,
                STATIC_OBSTACLE_CROP.y,
                STATIC_OBSTACLE_CROP.width,
                STATIC_OBSTACLE_CROP.height
            )
            
        } else {
            // Moving obstacles: disable gravity
            this.body.setAllowGravity(false)
        }
        this.setDisplaySize(width, height)
        this.setDepth(config.depth !== undefined ? config.depth : 10)

        if (type !== OBSTACLE_TYPES.STATIC) {
            const moveAxis = config.moveAxis || 'horizontal'
            const moveDistance = config.moveDistance !== undefined ? config.moveDistance : 150
            const moveSpeed = config.moveSpeed !== undefined ? config.moveSpeed : 80
            const duration = (moveDistance / moveSpeed) * 1000

            const tweenConfig = {
                targets: this,
                duration: duration,
                ease: 'Linear',
                yoyo: true,
                repeat: -1
            }
            if (moveAxis === 'horizontal') {
                tweenConfig.x = x + moveDistance
            } else {
                tweenConfig.y = y + moveDistance
            }
            scene.tweens.add(tweenConfig)
        }
    }

    update() {
        // tween handles moving; nothing to do for static
    }
}
