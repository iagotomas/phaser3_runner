import Phaser, { Scene } from 'phaser'

/**
 * CloudManager handles the creation, movement, and dropping of balls from clouds in a Phaser 3 game.
 * It manages a group of clouds that move across the screen from right to left and periodically drop balls.
 * The balls have physics properties and can be collected by the player. Special balls provide extra points.
 */
export default class CloudManager {
    /**
     * Creates a new CloudManager instance.
     * @param {Phaser.Scene} scene - The Phaser 3 scene to add the clouds and balls to.
     * @param {object} config - Configuration options for the CloudManager.
     * @param {number} [config.cloudCount=10] - The initial number of clouds to spawn. Default: 10.
     * @param {number} [config.minDropDelay=5] - The minimum delay (in milliseconds) between ball drops from a cloud. Default: 5.
     * @param {number} [config.maxDropDelay=500] - The maximum delay (in milliseconds) between ball drops from a cloud. Default: 500.
     * @param {number} [config.groundDelay=8000] - The time (in milliseconds) a ball will wait on the ground before fading out and disappearing. Default: 8000.
     * @param {function} [config.onBallCollect=null] - A callback function to be called when a ball is collected. It receives the number of points to add. Default: null.
     * @param {number} [config.depth=15] - The depth (z-index) of the clouds. Default: 15.
     * @param {Phaser.GameObjects.GameObject} [config.ground=null] - Optional. If provided, will add collision between balls and ground. Default: null.
     * @param {number} [config.maxBallCount=5] - maximum amount of balls that can exist. Default: 5
     */
    constructor(scene, config) {
        this.scene = scene
        this.config = {
            cloudCount: config.cloudCount || 10,
            minDropDelay: config.minDropDelay || 5,
            maxDropDelay: config.maxDropDelay || 500,
            groundDelay: config.groundDelay || 8000, // Time to wait on ground before disappearing
            onBallCollect: config.onBallCollect || null,
            depth: config.depth || 15,
            maxBallCount: config.maxBallCount || 5,
            ...config
        }

        // Create a static group for clouds (no movement by physics)
        this.cloudGroup = scene.physics.add.staticGroup()
        // Create a dynamic group for balls (physics enabled)
        this.ballGroup = scene.physics.add.group({
            maxSize: Phaser.Math.Between(3, this.config.maxBallCount), // Ball group can only store max this amount of balls, but we will handle it manualy
            runChildUpdate: true, // update() will be runned in each ball
            bounceX: 0.8,
            bounceY: 0.8,
            dragX: -20
        })
        // Initialize the clouds and ball physics
        this.initialize()

        // Configure default ball physics for all balls
        this.ballGroup.getChildren().forEach(ball => {
            ball.body.setCollideWorldBounds(true);
            ball.body.setBounce(0.8);
            ball.body.setDrag(50);
            ball.body.setMaxVelocity(400);
        });
    }

    /**
     * Initializes the CloudManager by spawning the initial clouds and setting up the ground collision if provided.
     */
    initialize() {

        // Spawn the initial set of clouds
        for (let i = 0; i < this.config.cloudCount; i++) {
            this.spawnCloud()
        }

        // If a ground object is provided in the config, add collision detection
        if (this.config.ground) {
            this.scene.physics.add.collider(this.ballGroup,
                this.config.ground,
                this.handleBallGroundCollision,
                null,
                this
            )
        }
    }

    /**
     * Spawns a new cloud off-screen to the right and sets it up for dropping balls.
     * @returns {Phaser.GameObjects.Image} The newly created cloud game object.
     */
    spawnCloud() {
        const clouds = ['cloud_aaa', 'cloud_aab', 'cloud_aac', 'cloud_aad', 'cloud_aae']//, 'cloud_big_aaa']
        const random = Math.floor(Math.random() * clouds.length);
        const cloud = this.cloudGroup.create(
            this.scene.cameras.main.scrollX + this.scene.game.config.width + 400,
            Phaser.Math.Between(40, 250),
            'ponygirl',
            clouds[random]

        )
        cloud.setScale(Phaser.Math.FloatBetween(0.9, 1.2))
        cloud.setDepth(this.config.depth)
        // set random speed
        cloud.cloudSpeed = Phaser.Math.FloatBetween(2, 4)
        // Set a timer for the cloud to drop balls
        cloud.dropTimer = this.setupCloudDropping(cloud)
        return cloud
    }

    /**
     * Sets up a timer for a cloud to drop balls at random intervals.
     * @param {Phaser.GameObjects.Image} cloud - The cloud game object to set up the dropping timer for.
     * @returns {Phaser.Time.TimerEvent} The timer event created for the cloud.
     */
    setupCloudDropping(cloud) {
        return this.scene.time.addEvent({
            delay: Phaser.Math.Between(this.config.minDropDelay, this.config.maxDropDelay),
            callback: () => this.dropBall(cloud), // Callback to drop a ball
            callbackScope: this,
            loop: true // The cloud will continue dropping balls
        })
    }

    /**
     * Drops a ball from a cloud.
     * @param {Phaser.GameObjects.Image} cloud - The cloud game object that is dropping the ball.
     */
    dropBall(cloud) {
        const colors = ['', '_blue', '_orange', '_red', '_green', '_blue']
        const random = Math.floor(Math.random() * colors.length)
        const ball = this.ballGroup.get(cloud.x, cloud.y, 'ponygirl', 'tennis_ball' + colors[random])
        if (ball) {
            ball.isSpecial = Math.random() < 0.2 // Randomly set ball to be special
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
            let scale = { from: 0.9, to: 1.1 }

            // If ball is special, add special properties
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

            ball.body.setCollideWorldBounds(true);
        }
    }

    /**
     * Handles the collision between a ball and the ground.
     * @param {Phaser.GameObjects.GameObject} ball - The ball that collided with the ground.
     * @param {Phaser.GameObjects.GameObject} ground - The ground object.
     */
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

    /**
     * Cleans up a ball by disabling its physics, hiding it, and resetting its alpha.
     * @param {Phaser.GameObjects.GameObject} ball - The ball to clean up.
     */
    cleanupBall(ball) {
        if (ball && ball.active) {
            ball.body.enable = false
            ball.setActive(false)
            ball.setVisible(false)
            ball.alpha = 1 // Reset alpha for reuse
        }
    }

    /**
     * Handles the collection of a ball by the player.
     * @param {Phaser.GameObjects.GameObject} player - The player game object.
     * @param {Phaser.GameObjects.GameObject} ball - The ball that was collected.
     */
    handleBallCollection(player, ball) {
        // Check if player's inventory has capacity
        if (player.isInventoryFull()) {
            // Show visual feedback for full inventory
            this.showInventoryFullFeedback(player, ball);
            return; // Don't collect the ball
        }

        // Add ball to player's inventory
        const wasAdded = player.addBall();
        
        if (wasAdded) {
            
            // Still provide score points for collection (maintaining existing behavior)
            if (ball.isSpecial) {
                this.config.onBallCollect(3);
            } else {
                this.config.onBallCollect(1);
            }
            
            // Show collection feedback
            this.showCollectionFeedback(player, ball);
        }
        // Remove the ball from the game world
        ball.destroy();
    }

    /**
     * Shows visual feedback when inventory is full and ball cannot be collected.
     * @param {Phaser.GameObjects.GameObject} player - The player game object.
     * @param {Phaser.GameObjects.GameObject} ball - The ball that couldn't be collected.
     */
    showInventoryFullFeedback(player, ball) {
        // Create a "FULL!" text that appears above the player
        const fullText = this.scene.add.text(
            player.x, 
            player.y - 60, 
            'INVENTORY FULL!', 
            {
                fontSize: '24px',
                fill: '#ff4444',
                fontFamily: 'Arial',
                stroke: '#ffffff',
                strokeThickness: 2
            }
        );
        
        fullText.setOrigin(0.5, 0.5);
        fullText.setDepth(20); // Above other game elements
        
        // Animate the text
        this.scene.tweens.add({
            targets: fullText,
            y: fullText.y - 30,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => {
                fullText.destroy();
            }
        });
        
        // Add a bounce effect to the ball to indicate it can't be collected
        this.scene.tweens.add({
            targets: ball,
            scaleX: ball.scaleX * 1.2,
            scaleY: ball.scaleY * 1.2,
            duration: 200,
            yoyo: true,
            ease: 'Power2'
        });
    }

    /**
     * Shows visual feedback when a ball is successfully collected.
     * @param {Phaser.GameObjects.GameObject} player - The player game object.
     * @param {Phaser.GameObjects.GameObject} ball - The ball that was collected.
     */
    showCollectionFeedback(player, ball) {
        // Create a "+1" or "+3" text that appears at the ball's position
        const points = ball.isSpecial ? 3 : 1;
        const collectText = this.scene.add.text(
            ball.x, 
            ball.y, 
            `+${points}`, 
            {
                fontSize: ball.isSpecial ? '28px' : '20px',
                fill: ball.isSpecial ? '#ffaa00' : '#00ff00',
                fontFamily: 'Arial',
                stroke: '#ffffff',
                strokeThickness: 2
            }
        );
        
        collectText.setOrigin(0.5, 0.5);
        collectText.setDepth(20); // Above other game elements
        
        // Animate the text floating up and fading out
        this.scene.tweens.add({
            targets: collectText,
            y: collectText.y - 40,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                collectText.destroy();
            }
        });
    }

    /**
     * Spawns a new ball at a specified position. This method is independent of the cloud dropping.
     * If maximum amount of balls in the screen is reached, this will not spawn new balls
     * @param {number} x - The x-coordinate where the ball should be spawned.
     * @param {number} y - The y-coordinate where the ball should be spawned.
     * @returns {Phaser.GameObjects.GameObject|null} The newly created ball, or null if the max ball count is reached.
     */
    spawnBall(x, y) {
        // Only spawn new ball if we're below maximum count
        const maxBalls = this.config.maxBallCount;
        const currentBalls = this.ballGroup.getChildren().length;

        if (currentBalls >= maxBalls) {
            // Check if any balls are out of bounds or inactive
            const activeBalls = this.ballGroup.getChildren().filter(ball => {
                const bounds = this.scene.cameras.main.worldView;
                return bounds.contains(ball.x, ball.y) && ball.active;
            });

            if (activeBalls.length >= maxBalls) {
                return null; // Don't spawn if we have enough active balls
            }
        }

        const ball = this.ballGroup.create(x, y, 'ball');
        ball.setScale(0.5);

        // Configure ball physics
        ball.body.setCollideWorldBounds(true);
        ball.body.setBounce(0.8);
        ball.body.setDrag(50);
        ball.body.setMaxVelocity(400);

        // Give initial random velocity
        const angle = Phaser.Math.Between(0, 360);
        const speed = 200;
        ball.body.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );

        return ball;
    }

    /**
     * Pauses the cloud dropping timers.
     */
    pause() {
        this.cloudGroup.children.entries.forEach(cloud => {
            if (cloud.dropTimer) {
                cloud.dropTimer.remove()
            }
        })
        this.isPaused = true  // Add state tracking
    }

    /**
     * Resumes the cloud dropping timers.
     */
    resume() {
        this.cloudGroup.children.entries.forEach(cloud => {
            if (!cloud.dropTimer) {
                cloud.dropTimer = this.setupCloudDropping(cloud)
            }
        })
        this.isPaused = false
    }

    /**
     * Updates the state of the clouds and balls. This should be called in the scene's update loop.
     */
    update() {
        if (this.isPaused) return  // Skip updates when paused

        // Optimize cloud updates by using a for loop and caching camera scroll
        const cameraScrollX = this.scene.cameras.main.scrollX
        const clouds = this.cloudGroup.children.entries

        for (let i = clouds.length - 1; i >= 0; i--) {
            const cloud = clouds[i]
            cloud.x -= cloud.cloudSpeed // move cloud to the left

            if (cloud.x < cameraScrollX - 300) {
                cloud.dropTimer.remove() // remove timer if cloud is out of bounds
                cloud.destroy() // destroy cloud
                this.spawnCloud() // and spawn new cloud
            }
        }

        // Optimize ball cleanup
        const balls = this.ballGroup.children.entries
        for (let i = balls.length - 1; i >= 0; i--) {
            const ball = balls[i]
            if (ball && ball.x < cameraScrollX - 50) {
                this.ballGroup.killAndHide(ball)
                this.cleanupBall(ball)
            }
        }

        // Clean up balls that are somehow out of bounds
        this.ballGroup.getChildren().forEach(ball => {
            const bounds = this.scene.cameras.main.worldView;
            if (!bounds.contains(ball.x, ball.y)) {
                ball.destroy();
            }
        });
    }
}
