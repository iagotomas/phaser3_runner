import { Scene } from 'phaser'
import Player from '../objects/player'
import CloudManager from '../objects/cloud'
import ShopUI from '../objects/shopui'
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

        // Replace shop UI resize code with:
        if (this.shopUI) {
            this.shopUI.handleResize()
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
}