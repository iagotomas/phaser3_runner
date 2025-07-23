import { Scene } from 'phaser'
import Player from '../objects/player'
import CloudManager from '../objects/cloud'
import ShopUI from '../objects/shopui'
import AmmunitionUI from '../objects/ammunitionUI'
import { ShootingSystem } from '../objects/shootingSystem'
import Enemy from '../objects/enemy'
/**
 * Depth hierarchy (from back to front):
    0: Sky background
    1-9: Parallax backgrounds
    10: Platforms
    15: Clouds and collectible balls
    20: Player
    100: UI elements (counters, buttons)
    1000: Shop UI and overlays
 */
const GAME_TOTAL_WIDTH_SCREENS_MULTIPLIER = 100
const GROUND_SEGMENT_WIDTH = 142
export default class Game extends Scene {
    constructor() {
        super('game')
        this.player = null;
        this.fpsText = null;
        this.cloudManager = null;
        this.backgrounds = [];
        this.controls = null;
        this.shopUI = null;
        this.ammunitionUI = null;
        this.bgMusic = null;
        this.platformGroup = null;
        this.moveTarget = null;
        this.targetMarker = null;
        // Initialize score from localStorage or default to 0
        this.coinScore = parseInt(localStorage.getItem('coinScore')) || 0;
        this.lastCameraScrollX = 0;
        // Mini-game related properties
        this.minigamePortals = null;
        this.lastPortalPosition = 0;
        this.minPortalSpacing = 2000; // Minimum pixels between portals
        this.portalChance = 0.9; // 30% chance to spawn a portal when possible
        
        // Shooting system properties
        this.shootingSystem = null;
        this.shootButton = null;
        this.lastShootTime = 0;
        this.shootCooldown = 300; // 300ms cooldown between shots
        
        // Enemy system properties
        this.enemyGroup = null;
        this.lastEnemySpawn = 0;
        this.enemySpawnInterval = 3000; // Spawn enemy every 3 seconds
        this.maxEnemies = 5; // Maximum enemies on screen at once
    }
    
    create() {
        console.log('game started')

        // Create initial background immediately
        const sky = this.background('sky')
        if (sky) {
            sky.setDepth(0)
            this.backgrounds.push(sky)
        }

        // Create remaining backgrounds with incremental depth
        const frames = ['bg-1-01', 'bg-1-02', 'bg-1-03', 'bg-1-04', 'bg-1-05']
        frames.forEach((frame, index) => {
            const bg = this.background(frame)
            if (bg) {
                bg.setDepth(index + 1) // Backgrounds start at depth 1
                this.backgrounds.push(bg)
            }
        })

        // Create platforms with higher depth than backgrounds
        this.platformGroup = this.physics.add.staticGroup()

        const groundY = this.scale.height - 24
        const segmentWidth = GROUND_SEGMENT_WIDTH //this.scale.width


        // Create visible debug rectangle to show where platform should be
        //const debugRect = this.add.rectangle(0, groundY, this.scale.width * 3, 64, 0xff0000, 0.5)
        //debugRect.setOrigin(0, 0)
        //debugRect.setDepth(10)

        console.log(`this.scale.height: ${this.scale.height}, groundY: ${groundY}`)
        for (let x = 0; x < this.scale.width * GAME_TOTAL_WIDTH_SCREENS_MULTIPLIER; x += segmentWidth) {
            const groundSegment = this.platformGroup.create(x, groundY, 'ground')
            groundSegment.setOrigin(0, 0)
            groundSegment.setDisplaySize(segmentWidth, 24)
            groundSegment.refreshBody()
            groundSegment.setImmovable(true)
            groundSegment.setDepth(10)

        }

        // Create player with depth above platforms
        this.player = new Player(this, 60, groundY - 480, 'ponygirl')
        this.player.setDepth(20) // Player depth above platforms
        this.player.setScale(1)
        this.physics.add.collider(this.player, this.platformGroup)

        // Set up camera
        this.cameras.main.setBounds(0, 0, this.game.config.width * GAME_TOTAL_WIDTH_SCREENS_MULTIPLIER, this.game.config.height)
        this.cameras.main.startFollow(this.player)

        // Create cloud manager with proper depth
        this.cloudManager = new CloudManager(this, {
            ground: this.platformGroup,
            depth: 15,
            onBallCollect: (points) => {
                this.updateScore(this.coinScore + points)
                // Update ammunition UI when balls are collected
                this.updateAmmunitionUI()
            }
        })

        // UI elements should have highest depth
        if (this.coinCounter) this.coinCounter.setDepth(100)
        if (this.shopButton) this.shopButton.setDepth(100)
        if (this.musicButton) this.musicButton.setDepth(100)
        if (this.fpsText) this.fpsText.setDepth(100)
        if (this.shopUI) this.shopUI.setDepth(1000)

        // Set up controls
        this.keys = this.input.keyboard.createCursorKeys()
        
        // Add shooting key (X key)
        this.keys.shoot = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X)

        // Add resize handler
        this.scale.on('resize', this.handleResize, this)

        // Initial resize
        this.handleResize(this.scale.gameSize)

        console.log('Game setup complete')

        // Remove or comment out fullscreen handling
        this.input.on('pointerup', () => {
            this.scale.startFullscreen()
        }, this) 

        // Score display with persistent value
        this.coinCounter = this.add.text(20, 20, `${this.coinScore}`, {
            fontSize: '70px',
            fontWeight: 'bold',
            fontFamily: 'Coming Soon',
            fill: '#f542d7',
            stroke: '#8c1679',
            strokeThickness: 10,
            padding: { x: 10, y: 10 }
        })
        this.coinCounter.setScrollFactor(0);
        this.coinCounter.setDepth(100);

        // Add FPS counter
        this.fpsText = this.add.text(this.scale.width - 100, 10, 'FPS: 0', {
            fontSize: '16px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 5, y: 5 }
        });
        this.fpsText.setScrollFactor(0);
        this.fpsText.setDepth(100);

        // Level-specific setup
        const endZone = this.add.rectangle(
            this.game.config.width * GAME_TOTAL_WIDTH_SCREENS_MULTIPLIER - 50,
            this.game.config.height / 2,
            50,
            this.game.config.height,
            0x00ff00,
            0
        )

        this.physics.add.existing(endZone, true) // Static body
        this.physics.add.overlap(this.player, endZone, this.levelComplete, null, this)

        // Add the overlap check
        this.physics.add.overlap(
            this.player,
            this.cloudManager.ballGroup, 
            (player, ball) => this.cloudManager.handleBallCollection(player, ball),
            null,
            this
        );

        // Add shop button
        this.shopButton = this.add.text(this.scale.width - 150, 50, '🛍️ Shop', {
            fontSize: '24px',
            backgroundColor: '#000000',
            color: '#000000',
            bold: true,
            fontFamily: 'Tahoma',
            stroke: '#ffffff',
            strokeThickness: 3,
            padding: { x: 10, y: 5 },
            alpha: 0.8
        })
            .setScrollFactor(0)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.openShop(), this)
            .setDepth(100)

        // Create shop UI
        this.shopUI = new ShopUI(this)

        // Create ammunition UI
        this.ammunitionUI = new AmmunitionUI(this, 20, 120)
        this.ammunitionUI.setDepth(100) // UI elements depth
        this.ammunitionUI.setScrollFactor(0) // Fixed to screen
        
        // Initialize ammunition UI display
        this.updateAmmunitionUI()

        // Create shooting system
        this.shootingSystem = new ShootingSystem(this)
        
        // Set up terrain collision for projectiles
        this.shootingSystem.setupTerrainCollision(this.platformGroup)

        // Create enemy group and set up enemy spawning
        this.enemyGroup = this.physics.add.group()
        
        // Add collision between enemies and platforms
        this.physics.add.collider(this.enemyGroup, this.platformGroup)
        
        // Listen for enemy destruction events
        this.events.on('enemyDestroyed', this.handleEnemyDestroyed, this)
        
        // Add collision detection between projectiles and enemies
        this.physics.add.overlap(
            this.shootingSystem.projectileGroup,
            this.enemyGroup,
            this.handleProjectileEnemyCollision,
            null,
            this
        )
        
        // Spawn initial enemies
        this.spawnInitialEnemies()

        // Add background music
        this.bgMusic = this.sound.add('bgMusic', {
            volume: 0.5,
            loop: true
        })

        // Start playing music
        this.bgMusic.play()

        // Add music controls
        this.musicButton = this.add.text(this.scale.width - 50, 50, '🔊', {
            fontSize: '24px',
            fontFamily: 'Tahoma',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 },
            alpha: 0.8
        })
            .setScrollFactor(0)
            .setInteractive({ useHandCursor: true })
            .setDepth(100)
            .on('pointerdown', () => this.toggleMusic())

        // Load music state from localStorage
        const musicEnabled = this.isMusicEnabled()
        if (!musicEnabled) {
            this.bgMusic.pause()
            this.musicButton.setText('🔈')
        }

        // Create target marker (initially invisible)
        this.targetMarker = this.add.container(0, 0)
        const marker = this.add.circle(0, 0, 7, 0xde1dba, 0.5)
        //const arrow = this.add.triangle(0, -20, 0, -10, 10, 0, -10, 0, 0xde1dba, 0.5)
        this.targetMarker.add([marker])//, arrow])
        this.targetMarker.setVisible(false)
        this.targetMarker.setDepth(100)

        // Add jump button
        const jumpButton = this.add.container(this.scale.width - 100, this.scale.height - 100)
        jumpButton.setScrollFactor(0)
        jumpButton.setDepth(100)

        const jumpBg = this.add.circle(0, 0, 40, 0x000000, 0.7)
        const jumpIcon = this.add.text(0, 0, '↑', {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5)

        jumpButton.add([jumpBg, jumpIcon])
        jumpButton.setInteractive(
            new Phaser.Geom.Circle(0, 0, 40),
            Phaser.Geom.Circle.Contains
        )

        // Add click/touch handlers for movement
        this.input.on('pointerdown', (pointer) => {
            // Ignore if clicking on jump button
            if (jumpButton.getBounds().contains(pointer.x, pointer.y)) {
                return
            }

            // Ignore if clicking on shoot button
            if (this.shootButton && this.shootButton.getBounds().contains(pointer.x, pointer.y)) {
                return
            }

            // Convert screen coordinates to world coordinates
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y)

            // Set move target
            this.moveTarget = worldPoint.x

            // Update and show target marker
            this.targetMarker.setPosition(worldPoint.x, worldPoint.y)
            this.targetMarker.setVisible(true)

            // Add fade out tween for marker
            this.tweens.add({
                targets: this.targetMarker,
                alpha: 0,
                duration: 1000,
                onComplete: () => {
                    this.targetMarker.setVisible(false)
                    this.targetMarker.setAlpha(1)
                }
            })
        });

        // Add pointer move handler for continuous movement
        this.input.on('pointermove', (pointer) => {
            if (pointer.isDown && !this.shopUI?.visible) {
                // Convert screen coordinates to world coordinates
                const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y)

                // Update move target
                this.moveTarget = worldPoint.x

                // Update target marker
                this.targetMarker.setPosition(worldPoint.x, worldPoint.y)
                this.targetMarker.setVisible(true)
                this.targetMarker.setAlpha(1)
            }
        });

        // Add pointer up handler
        this.input.on('pointerup', () => {
            // Stop movement when pointer is released
            this.moveTarget = null;
            this.targetMarker.setVisible(false);
        });

        // Jump button handlers
        jumpButton
            .on('pointerdown', () => {
                this.keys.space.isDown = true
            })
            .on('pointerup', () => {
                this.keys.space.isDown = false
            })
            .on('pointerout', () => {
                this.keys.space.isDown = false
            })

        // Add shoot button
        this.shootButton = this.add.container(this.scale.width - 200, this.scale.height - 100)
        this.shootButton.setScrollFactor(0)
        this.shootButton.setDepth(100)

        const shootBg = this.add.circle(0, 0, 40, 0x000000, 0.7)
        const shootIcon = this.add.text(0, 0, '🎯', {
            fontSize: '28px',
            color: '#ffffff'
        }).setOrigin(0.5)

        this.shootButton.add([shootBg, shootIcon])
        this.shootButton.setInteractive(
            new Phaser.Geom.Circle(0, 0, 40),
            Phaser.Geom.Circle.Contains
        )

        // Shoot button handlers
        this.shootButton
            .on('pointerdown', () => {
                this.handleShoot()
            })

        // Add portal group after platform creation
        this.minigamePortals = this.physics.add.group();

        // Add collision between player and portals
        this.physics.add.overlap(
            this.player,
            this.minigamePortals,
            this.enterMinigame,
            null,
            this
        );

        // Start portal spawning
        this.spawnInitialPortals();

        
        // Store gravity settings for motion controls
        this.defaultGravityY = 200;
        this.physics.world.gravity.y = this.defaultGravityY;
    }

    isMusicEnabled() {
        return localStorage.getItem('musicEnabled') !== 'false'
    }

    handleResize(gameSize) {
        const width = gameSize.width
        const height = gameSize.height


        // Update camera
        this.cameras.main.setViewport(0, 0, width, height)

        // Calculate scale factor for UI elements
        const scaleFactor = Math.min(width / 1280, height / 820)

        // Update ground platforms if they exist
        if (this.platformGroup) {
            const groundY = height - 56

            this.platformGroup.getChildren().forEach((platform, index) => {
                const x = index * GROUND_SEGMENT_WIDTH
                platform.x = x
                platform.y = groundY
                platform.setDisplaySize(GROUND_SEGMENT_WIDTH, 56)
                platform.refreshBody()
                platform.setDepth(10)
            })
        }

        // Update player position if it exists and is below the ground
        if (this.player && this.player.y > height - 30) {
            this.player.y = height - 110 // 30 (ground offset) + 80 (player offset)
        }

        // Update UI positions and scales
        if (this.coinCounter) {
            this.coinCounter
                .setScale(scaleFactor)
                .setPosition(50 - (20 * scaleFactor), 20 * scaleFactor)
        }

        if (this.shopButton) {
            this.shopButton
                .setScale(scaleFactor)
                .setPosition(width - 150 * scaleFactor, 50 * scaleFactor)
        }

        if (this.musicButton) {
            this.musicButton
                .setScale(scaleFactor)
                .setPosition(width - 50 * scaleFactor, 50 * scaleFactor)
        }

        // Update mobile controls if they exist
        if (this.controls) {
            const buttonSize = 60 * scaleFactor
            const padding = 20 * scaleFactor

            this.controls.left
                .setScale(scaleFactor)
                .setPosition(padding, height - buttonSize - padding)

            this.controls.right
                .setScale(scaleFactor)
                .setPosition(buttonSize + padding * 2, height - buttonSize - padding)

            this.controls.jump
                .setScale(scaleFactor)
                .setPosition(width - buttonSize - padding, height - buttonSize - padding)
        }

        // Update shoot button position and scale
        if (this.shootButton) {
            this.shootButton
                .setScale(scaleFactor)
                .setPosition(width - 200 * scaleFactor, height - 100 * scaleFactor)
        }

        // Replace shop UI resize code with:
        if (this.shopUI) {
            this.shopUI.handleResize()
        }

        // Update ammunition UI resize
        if (this.ammunitionUI) {
            this.ammunitionUI.handleResize(scaleFactor)
        }

        // Update world bounds
        this.physics.world.setBounds(0, 0, width * GAME_TOTAL_WIDTH_SCREENS_MULTIPLIER, height)

        // Update camera bounds
        this.cameras.main.setBounds(0, 0, width * GAME_TOTAL_WIDTH_SCREENS_MULTIPLIER, height)

        // Update backgrounds
        this.backgrounds.forEach(bg => {
            if (bg && bg.active) {
                bg.setSize(width, height)
            }
        })
    }

    starCollect(player, star) {
        star.destroy(false)
        this.updateScore(this.coinScore + 1)
    }

    levelComplete() {
        // Notify level manager to progress to next level
        //this.scene.get('LevelManager').startLevel(this.currentLevel + 1)
        console.log("Level end reached")

        const endNotice = this.add.text(120, 120, `The End`, {
            fontSize: '190px',
            fontWeight: 'bold',
            strokeThickness: 10,
            stroke: '#000000',
            fontFamily: 'Fira Sans',
            fill: '#ffffff'
        })
        endNotice.setScrollFactor(0);
    }

    background(frame) {
        const width = this.scale.gameSize.width
        const height = this.scale.gameSize.height

        if (width <= 0 || height <= 0) {
            console.log(`Invalid dimensions for ${frame}: ${width}x${height}`)
            return null
        }

        const bg = this.add.tileSprite(0, 0, width, height, frame)
        bg.setOrigin(0, 0)
        bg.setScrollFactor(0)
        return bg
    }

    update(time, delta) {
        this.player.step()
        this.cloudManager.update()

        // Handle keyboard shooting input
        if (this.keys.shoot && Phaser.Input.Keyboard.JustDown(this.keys.shoot)) {
            this.handleShoot()
        }

        // Handle enemy spawning
        this.spawnEnemies(time)

        // Update FPS counter less frequently
        if (time % 10 === 0) { // Only update every 10 frames
            const fps = (1000 / delta).toFixed(0)
            this.fpsText.setText(`FPS: ${fps}`)
        }

        // Only update parallax if camera has moved
        const currentScrollX = this.cameras.main.scrollX
        if (currentScrollX !== this.lastCameraScrollX) {
            const scrollSpeeds = [0.1, 0.2, 0.3, 0.5, 0.8, 0.8, 0.9, 0.9] //[0.1, 0.3, 0.5, 0.5, 0.6, 0.6, 0.7, 0.7, 0.7, 0.9, 0.9]
            this.backgrounds.forEach((bg, index) => {
                if (bg && bg.active && index > 0) {
                    bg.tilePositionX = currentScrollX * scrollSpeeds[index]
                }
            })
            this.lastCameraScrollX = currentScrollX
        }
    }

    openShop() {
        this.shopUI.open()
    }

    closeShop() {
        this.shopUI.close()
    }

    toggleMusic() {
        if (this.bgMusic.isPaused) {
            this.bgMusic.resume()
            this.musicButton.setText('🔊')
            localStorage.setItem('musicEnabled', 'true')
        } else {
            this.bgMusic.pause()
            this.musicButton.setText('🔈')
            localStorage.setItem('musicEnabled', 'false')
        }
    }

    // New method to update score and persist it
    updateScore(newScore) {
        this.coinScore = newScore
        this.coinCounter.setText(`${this.coinScore}`)
        localStorage.setItem('coinScore', this.coinScore.toString())
    }

    // Method to update ammunition UI based on player inventory
    updateAmmunitionUI() {
        if (this.ammunitionUI && this.player) {
            const currentCount = this.player.getBallCount()
            const maxCount = this.player.getInventory().maxCapacity
            
            // Update the display
            this.ammunitionUI.updateDisplay(currentCount, maxCount)
            
            // Show appropriate state indicators
            if (currentCount === 0) {
                this.ammunitionUI.showEmptyState()
            } else if (currentCount === maxCount) {
                this.ammunitionUI.showFullState()
            }
        }
    }

    // Method to handle shooting input with cooldown and inventory checks
    handleShoot() {
        const currentTime = this.time.now
        
        // Check cooldown
        if (currentTime - this.lastShootTime < this.shootCooldown) {
            return
        }
        
        // Check if player has ammunition
        if (!this.player || this.player.isInventoryEmpty()) {
            // Visual feedback for empty inventory (optional)
            console.log('No ammunition available')
            return
        }
        
        // Fire projectile using shooting system
        const projectile = this.shootingSystem.fireFromPlayer(this.player)
        
        if (projectile) {
            // Successfully fired - remove ball from inventory
            this.player.removeBall()
            
            // Update ammunition UI
            this.updateAmmunitionUI()
            
            // Update last shoot time
            this.lastShootTime = currentTime
            
            console.log('Ball fired! Remaining ammunition:', this.player.getBallCount())
        }
    }

    spawnInitialPortals() {
        const totalWidth = this.game.config.width * GAME_TOTAL_WIDTH_SCREENS_MULTIPLIER;
        let currentPosition = 1900; // Start after initial gameplay area

        while (currentPosition < totalWidth - 1000) { // Stop before end
            if (Math.random() < this.portalChance) {
                this.createPortal(currentPosition);
            }
            currentPosition += this.minPortalSpacing;
        }
    }

    createPortal(x) {
        const groundY = this.scale.height - 64;
        const portal = this.minigamePortals.create(x, groundY - 370, 'ponygirl', 'castle_unicorn');
        portal.setScale(0.9)
        portal.body.setSize(200, 600)
        this.physics.add.existing(portal)

        // Make the portal static so it doesn't fall
        portal.body.setAllowGravity(false);
        portal.body.setImmovable(false);        

        // Randomly assign a mini-game type to this portal
        portal.minigameType = this.getRandomMinigame();
        portal.setDepth(15);
    }

    getRandomMinigame() {
        const minigames = [
            //'puzzleChallenge',
            'hangman',
            /*'memory',
            'mazeChallenge'/*,
            'collectCoins',
            'avoidObstacles',*/
            // Add more mini-game types here
        ];
        return minigames[Math.floor(Math.random() * minigames.length)];
    }

    enterMinigame(player, portal) {
        // Prevent multiple triggers
        if (portal.triggered) return;
        portal.triggered = true;

        // Scale down the player to simulate entering the portal
        this.tweens.add({
            targets: player,
            scaleX: 0.7,
            scaleY: 0.7,
            duration: 500,
            onComplete: () => {
                // Pause main game mechanics
                this.physics.pause();
                this.cloudManager.pause();
                if (this.bgMusic) this.bgMusic.pause();

                // Start the mini-game scene
                this.scene.launch(portal.minigameType, {
                    parentScene: this,
                    onComplete: (score) => {
                        this.handleMinigameComplete(score);
                    }
                });

                // Hide the portal
                portal.destroy();
            }
        });
    }

    handleMinigameComplete(score) {
        // Resume main game
        this.physics.resume();
        this.cloudManager.resume();
        if (this.isMusicEnabled()) this.bgMusic.resume();

        // Reset player's scale when leaving the mini-game
        this.player.setScale(1);
        this.player.setPosition(this.player.body.x, this.scale.height - 280); // Adjust the Y position as needed

        // Award points from mini-game
        if (score > 0) {
            this.updateScore(this.coinScore + score);

            // Show score popup
            this.showScorePopup(score);
        }
    }

    showScorePopup(score) {
        const popup = this.add.text(
            this.player.x,
            this.player.y - 50,
            `+${score}`,
            {
                fontSize: '32px',
                fontFamily: 'Arial',
                color: '#ffff00',
                stroke: '#000000',
                strokeThickness: 4
            }
        );

        this.tweens.add({
            targets: popup,
            y: popup.y - 100,
            alpha: 0,
            duration: 1500,
            onComplete: () => popup.destroy()
        });
    }

    // Enemy spawning and management methods

    /**
     * Spawns initial enemies when the game starts
     */
    spawnInitialEnemies() {
        const totalWidth = this.game.config.width * GAME_TOTAL_WIDTH_SCREENS_MULTIPLIER
        const groundY = this.scale.height - 24
        
        // Spawn a few enemies at different positions for testing
        const enemyPositions = [800, 1200, 1800, 2500, 3000]
        
        enemyPositions.forEach(x => {
            this.createEnemy(x, groundY - 150)
        })
        
        console.log(`Spawned ${enemyPositions.length} initial enemies`)
    }

    /**
     * Handles periodic enemy spawning during gameplay
     * @param {number} time - Current game time
     */
    spawnEnemies(time) {
        // Check if it's time to spawn a new enemy
        if (time - this.lastEnemySpawn < this.enemySpawnInterval) {
            return
        }
        
        // Check if we've reached the maximum enemy count
        const currentEnemyCount = this.enemyGroup.getLength()
        if (currentEnemyCount >= this.maxEnemies) {
            return
        }
        
        // Spawn enemy ahead of the player
        const playerX = this.player.x
        const spawnX = playerX + Phaser.Math.Between(400, 800) // Spawn 400-800 pixels ahead
        const groundY = this.scale.height - 24
        
        this.createEnemy(spawnX, groundY - 150)
        this.lastEnemySpawn = time
        
        console.log(`Spawned enemy at x: ${spawnX}, current enemy count: ${currentEnemyCount + 1}`)
    }

    /**
     * Creates a new enemy at the specified position
     * @param {number} x - X position for the enemy
     * @param {number} y - Y position for the enemy
     * @returns {Enemy} - The created enemy instance
     */
    createEnemy(x, y) {
        const enemy = new Enemy(this, x, y, 'ponygirl', 'little_girl_standing_3', {
            health: 3,
            type: 'basic',
            moveSpeed: 50
        })
        
        // Add enemy to the enemy group
        this.enemyGroup.add(enemy)
        
        // Set appropriate depth (depth 16 as specified in requirements)
        enemy.setDepth(16)
        
        return enemy
    }

    /**
     * Handles collision between projectiles and enemies
     * @param {Phaser.Physics.Arcade.Sprite} projectile - The projectile that hit the enemy
     * @param {Enemy} enemy - The enemy that was hit
     */
    handleProjectileEnemyCollision(projectile, enemy) {
        // Verify both objects are still active
        if (!projectile.active || !enemy.active || enemy.health <= 0) {
            return
        }
        
        console.log(`Projectile hit enemy ${enemy.enemyId} at (${enemy.x}, ${enemy.y})`)
        
        // Deal damage to the enemy (default damage is 1)
        const damageDealt = 1
        const enemyDestroyed = enemy.takeDamage(damageDealt)
        
        // Clean up the projectile immediately after collision
        this.shootingSystem.cleanupProjectile(projectile)
        
        // Show damage indicator at collision point
        this.showDamageIndicator(projectile.x, projectile.y, damageDealt)
        
        // If enemy was destroyed, it will emit the 'enemyDestroyed' event
        // which is already handled by handleEnemyDestroyed method
        
        console.log(`Damage dealt: ${damageDealt}, Enemy destroyed: ${enemyDestroyed}`)
    }

    /**
     * Shows a visual damage indicator at the collision point
     * @param {number} x - X position for the indicator
     * @param {number} y - Y position for the indicator
     * @param {number} damage - Amount of damage dealt
     */
    showDamageIndicator(x, y, damage) {
        const damageText = this.add.text(x, y, `-${damage}`, {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ff4444',
            stroke: '#000000',
            strokeThickness: 2,
            fontWeight: 'bold'
        })
        
        // Set depth to appear above other game elements
        damageText.setDepth(50)
        
        // Animate the damage indicator
        this.tweens.add({
            targets: damageText,
            y: damageText.y - 40,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => damageText.destroy()
        })
    }

    /**
     * Handles enemy destruction events
     * @param {Object} eventData - Data about the destroyed enemy
     */
    handleEnemyDestroyed(eventData) {
        console.log(`Enemy destroyed: ${eventData.enemyId} at position (${eventData.position.x}, ${eventData.position.y})`)
        
        // Award points for destroying enemy
        this.updateScore(this.coinScore + 10)
        
        // Show score popup at enemy position
        const popup = this.add.text(
            eventData.position.x,
            eventData.position.y - 30,
            '+10',
            {
                fontSize: '24px',
                fontFamily: 'Arial',
                color: '#ff6600',
                stroke: '#000000',
                strokeThickness: 3
            }
        )
        
        this.tweens.add({
            targets: popup,
            y: popup.y - 60,
            alpha: 0,
            duration: 1000,
            onComplete: () => popup.destroy()
        })
    }
}