import Phaser from 'phaser'
import Obstacle from './obstacle'

export default class ObstacleManager {
    constructor(scene, platformGroup) {
        this.scene = scene
        this.platformGroup = platformGroup
        this.obstacleGroup = scene.physics.add.group({
            immovable: true,        // ✅ All obstacles are immovable
            allowGravity: false,     // ✅ None should fall with gravity
            checkCollision: {        // ✅ Fine-tune collision checks
                up: true,
                down: true,
                left: true,
                right: true
            }
        })
        scene.physics.add.collider(this.obstacleGroup, platformGroup)
    }

    spawnInitialObstacles(totalWidth, groundY) {
        // Vary spacing so obstacle patterns are not predictable.
        let x = 500
        while (x < totalWidth) {
            this.createStaticObstacle(x, groundY)
            x += Phaser.Math.Between(550, 850)
        }

        x = 900
        while (x < totalWidth) {
            this.createMovingObstacle(x, groundY - 60)
            x += Phaser.Math.Between(950, 1450)
        }
    }

    createStaticObstacle(x, y) {
        const obs = new Obstacle(this.scene, x, y-30, { type: 'static' })
        this.obstacleGroup.add(obs)
        return obs
    }

    createMovingObstacle(x, y) {
        const obs = new Obstacle(this.scene, x, y, { type: 'moving', color: 0x4169E1 })
        this.obstacleGroup.add(obs)
        return obs
    }

    setupPlayerCollision(player) {
        this.scene.physics.add.collider(player, this.obstacleGroup)
    }

    getObstacleGroup() {
        return this.obstacleGroup
    }

    getCount() {
        return this.obstacleGroup.getLength()
    }
}
