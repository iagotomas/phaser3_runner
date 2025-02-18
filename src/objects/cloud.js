import Phaser, {Scene} from 'phaser'

export default class CloudManager {
    constructor(scene, config) {
        this.scene = scene
        this.config = {
            cloudCount: config.cloudCount || 10,
            minDropDelay: config.minDropDelay || 1000,
            maxDropDelay: config.maxDropDelay || 2000,
            groundDelay: 8000, // Time to wait on ground before disappearing
            onBallCollect: config.onBallCollect || null,
            depth: config.depth || 15,
            ...config
        }

        this.cloudGroup = scene.physics.add.staticGroup()
        this.ballGroup = scene.physics.add.group({
            maxSize: Phaser.Math.Between(3, 5),
            runChildUpdate: true,
            bounceX: 0.8,
            bounceY: 0.8,
            dragX: -20
        })
        this.initialize()
    }

    initialize() {
        
        for (let i = 0; i < this.config.cloudCount; i++) {
            this.spawnCloud()
        }

        if (this.config.ground) {
            this.scene.physics.add.collider(this.ballGroup, 
                this.config.ground,
                this.handleBallGroundCollision, 
                null, 
                this
            )
        }
    }

    spawnCloud() {
        const clouds = ['cloud_aaa', 'cloud_aab', 'cloud_aac', 'cloud_aad', 'cloud_aae']//, 'cloud_big_aaa']
        const random = Math.floor(Math.random() * clouds.length);
        const cloud = this.cloudGroup.create(
            this.scene.cameras.main.scrollX + this.scene.game.config.width + 200, 
            Phaser.Math.Between(40, 150), 
            'ponygirl',
            clouds[random]
            
        )
        cloud.setScale(Phaser.Math.FloatBetween(0.9, 1.2))
        cloud.setDepth(this.config.depth)
        cloud.cloudSpeed = Phaser.Math.FloatBetween(2, 4)
        
        cloud.dropTimer = this.setupCloudDropping(cloud)
        return cloud
    }

    setupCloudDropping(cloud) {
        return this.scene.time.addEvent({
            delay: Phaser.Math.Between(this.config.minDropDelay, this.config.maxDropDelay),
            callback: () => this.dropBall(cloud),
            callbackScope: this,
            loop: true
        })
    }

    dropBall(cloud) {
        const colors = ['', '_blue', '_orange', '_red', '_green', '_blue']
        const random = Math.floor(Math.random()*colors.length)
        const ball = this.ballGroup.get(cloud.x, cloud.y, 'ponygirl', 'tennis_ball' + colors[random])
        if (ball) {
            ball.isSpecial = Math.random() < 0.2
            ball.setActive(true)
            ball.setVisible(true)
            ball.setCircle(15)
            ball.setDepth(this.config.depth - 1)
            ball.body.enable = true
            
            // Set initial properties
            ball.bounceCount = 0
            ball.isResting = false
            ball.groundTimer = null
            
            // Random angle drop between -30 and 30 degrees
            const angle = Phaser.Math.Between(-30, 30)
            const speed = -200
            
            // Convert angle to velocity
            const velocity = this.scene.physics.velocityFromAngle(angle, speed)
            ball.body.setVelocity(velocity.x, velocity.y)
            ball.body.setGravityY(50)
            
            // Add rotation
            ball.body.setAngularVelocity(Phaser.Math.Between(-200, 200))
            let scale = {from: 0.9, to: 1.1}

            if (ball.isSpecial) {
                ball.setScale(1.6); // Make special balls bigger
                ball.postFX.addShine()
                scale = { from: 1.4, to: 1.8 }                
            } 
            // Add pulsing animation
            this.scene.tweens.add({
                targets: ball,
                scale: scale,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    handleBallGroundCollision(ball, ground) {
        // Reduce bounce velocity each time
        const currentVelocity = ball.body.velocity
        ball.body.setVelocity(
            currentVelocity.x * 1,
            currentVelocity.y * 0.9
        )
            // Start ground timer
            ball.groundTimer = this.scene.time.delayedCall(
            this.config.groundDelay,
            () => {
                // Fade out effect
                console.log('ground delayed call')
                this.scene.tweens.add({
                    targets: ball,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => {
                        this.ballGroup.killAndHide(ball)
                        this.cleanupBall(ball)
                    }
                })
            },
            null,
            this
        )
    }

    cleanupBall(ball) {
        if(ball && ball.active) {
            ball.body.enable = false
            ball.setActive(false)
            ball.setVisible(false)
            ball.alpha = 1 // Reset alpha for reuse
        }
    }

    handleBallCollection(player, ball) {
        ball.destroy();
        // Add 3 points for special balls, 1 for regular
        if (ball.isSpecial) {
            this.config.onBallCollect(3);
        } else {
            this.config.onBallCollect(1);
        }
    }

    update() {
        // Wrap clouds horizontally
         // Move clouds horizontally
         this.cloudGroup.children.entries.forEach(cloud => {
            cloud.x -= cloud.cloudSpeed

            // Wrap clouds horizontally
            if (cloud.x < this.scene.cameras.main.scrollX - 300) {
                cloud.dropTimer.remove()
                cloud.destroy()
                this.spawnCloud()
            }
        })
        // Update ball physics
        this.ballGroup.children.entries.forEach(ball => {
            if (ball) {
                if(ball.x < this.scene.cameras.main.scrollX - 50) {
                    this.ballGroup.killAndHide(ball)
                    this.cleanupBall(ball)
                }
            }
        })
    }
}