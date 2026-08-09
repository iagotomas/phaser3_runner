import Phaser from 'phaser'

export const OBSTACLE_TYPES = { STATIC: 'static', MOVING: 'moving' }

export default class Obstacle extends Phaser.Physics.Arcade.Image {
    constructor(scene, x, y, config = {}) {
        const type = config.type || 'static'
        const width = config.width !== undefined ? config.width : 60
        const height = config.height !== undefined ? config.height : 60
        const color = config.color !== undefined ? config.color : 0x8B4513

        const key = `obstacle_tex_${width}_${height}_${color}`
        if (!scene.textures.exists(key)) {
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
        scene.physics.add.existing(this, type === 'static')

        this.setImmovable(true)
        this.setDisplaySize(width, height)
        this.setDepth(config.depth !== undefined ? config.depth : 10)

        if (type === 'static') {
            this.refreshBody()
        } else {
            this.body.setAllowGravity(false)
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
