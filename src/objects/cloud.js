import Phaser, {Scene} from 'phaser'

export default class CloudManager {
    constructor(scene, config) {
        this.scene = scene
        this.config = {
            cloudCount: config.cloudCount || 10,
            minDropDelay: config.minDropDelay || 2000,
            maxDropDelay: config.maxDropDelay || 5000,
            groundDelay: 3000, // Time to wait on ground before disappearing
            maxBounces: 3, // Maximum number of bounces before stopping
            onBallCollect: config.onBallCollect || null,
            depth: config.depth || 15,
            ...config
        }

        this.cloudGroup = scene.physics.add.staticGroup()
        this.ballGroup = scene.physics.add.group({
            maxSize: 15,
            runChildUpdate: true,
            bounceX: 0.6,
            bounceY: 0.6,
            dragX: 50
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
        
        this.setupCloudDropping(cloud)
        return cloud
    }

    setupCloudDropping(cloud) {
        const dropTimer = this.scene.time.addEvent({
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
                ball.setScale(1.6); // Make special balls 3x bigger
                //ball.setTint(0xFFD700); // Gold color
                
                // Add glow effect
                //const glowFX = ball.preFX.addGlow(0xFFD700, 1, 0, false, 0.1, 16);
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
        ball.bounceCount++
        
        // Check if ball should stop bouncing
        if (ball.bounceCount >= this.config.maxBounces && !ball.isResting) {
            ball.isResting = true
            ball.body.setVelocity(0, 0)
            ball.body.setAngularVelocity(0)
            
            // Start ground timer
            ball.groundTimer = this.scene.time.delayedCall(
                this.config.groundDelay,
                () => {
                    // Fade out effect
                    this.scene.tweens.add({
                        targets: ball,
                        alpha: 0,
                        duration: 500,
                        onComplete: () => {
                            this.ballGroup.killAndHide(ball)
                            if(ball) {
                                ball.body.enable = false
                                ball.setActive(false)
                                ball.setVisible(false)
                                ball.alpha = 1 // Reset alpha for reuse
                            }
                        }
                    })
                },
                null,
                this
            )
        } else if (!ball.isResting) {
            // Reduce bounce velocity each time
            const currentVelocity = ball.body.velocity
            ball.body.setVelocity(
                currentVelocity.x * 1,
                currentVelocity.y * 0.9
            )
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
                
                cloud.destroy()
                this.spawnCloud()
            }
        })
        // Update ball physics
        this.ballGroup.children.entries.forEach(ball => {
            if (ball.active) {
                // Check if ball is moving too slow and should rest
                if (!ball.isResting && 
                    Math.abs(ball.body.velocity.x) < 5 && 
                    Math.abs(ball.body.velocity.y) < 5) {
                    ball.isResting = true
                    ball.body.setVelocity(0, 0)
                    ball.body.setAngularVelocity(0)
                }
                else if(ball.x < this.scene.cameras.main.scrollX - 50) {
                    this.ballGroup.killAndHide(ball)
                    ball.body.enable = false
                    ball.setActive(false)
                    ball.setVisible(false)
                    ball.alpha = 1 // Reset alpha for reuse
                }
            }
        })
    }
}