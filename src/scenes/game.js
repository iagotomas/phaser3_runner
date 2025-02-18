import { Scene } from 'phaser'
import StateMachine from '../objects/statemachine'
import Player from '../objects/player'
import CloudManager from '../objects/cloud'
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
    }

    preload() {}

    create() {
        console.log('game started')

        // Create initial background immediately
        const sky = this.background('sky')
        if (sky) {
            sky.setDepth(0)
            this.backgrounds.push(sky)
        }

        // Create remaining backgrounds with incremental depth
        const frames = [ 'bg-1-01', 'bg-1-02', 'bg-1-03', 'bg-1-04']
        frames.forEach((frame, index) => {
            const bg = this.background(frame)
            if (bg) {
                bg.setDepth(index + 1) // Backgrounds start at depth 1
                this.backgrounds.push(bg)
            }
        })

        // Create platforms with higher depth than backgrounds
        this.platformGroup = this.physics.add.staticGroup()
        
        const groundY = this.scale.height - 64
        const segmentWidth = 142//this.scale.width
        
        console.log('Creating platforms:', {
            groundY,
            segmentWidth,
            scaleWidth: this.scale.width,
            scaleHeight: this.scale.height
        })

        // Create visible debug rectangle to show where platform should be
        //const debugRect = this.add.rectangle(0, groundY, this.scale.width * 3, 64, 0xff0000, 0.5)
        //debugRect.setOrigin(0, 0)
        //debugRect.setDepth(10)
        
        for (let x = 0; x < this.scale.width * 3; x += segmentWidth) {
            const groundSegment = this.platformGroup.create(x, groundY, 'ground')
            groundSegment.setOrigin(0, 0)
            groundSegment.setDisplaySize(segmentWidth, 74)
            groundSegment.refreshBody()
            groundSegment.setImmovable(true)
            groundSegment.setDepth(10)
            
        }

        // Create player with depth above platforms
        this.player = new Player(this, 60, groundY - 480, 'ponygirl')
        this.player.setDepth(20) // Player depth above platforms
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
        // Set depth for clouds and balls
        this.cloudManager.clouds?.forEach(cloud => cloud.setDepth(15))
        this.cloudManager.ballGroup?.getChildren().forEach(ball => ball.setDepth(15))

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

        // Fullscreen handling
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
            this.cloudManager.ballGroup,  // Use ballGroup instead of clouds
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

        // Initialize shop UI
        this.createShopUI()

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
        const musicEnabled = localStorage.getItem('musicEnabled') !== 'false'
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
            const groundY = height - 64
            
            this.platformGroup.getChildren().forEach((platform, index) => {
                const x = index * width
                platform.x = x
                platform.y = groundY
                platform.setDisplaySize(width, 64)
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

        // Update shop UI if it exists
        if (this.shopUI && this.shopUI.visible) {
            this.createShopUI() // Recreate shop UI with new dimensions
            this.shopUI.setVisible(true)
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

        console.log(`Creating background ${frame}: ${width}x${height}`)
        const bg = this.add.tileSprite(0, 0, width, height, frame)
        bg.setOrigin(0, 0)
        bg.setScrollFactor(0)
        return bg
    }

    update(time, delta) {
        this.player.step()

        this.cloudManager.update()
        // Update FPS counter
        const fps = (1000 / delta).toFixed(0)
        this.fpsText.setText(`FPS: ${fps}`)

        // Update parallax scrolling with proper speeds
        const scrollSpeeds = [0.1, 0.3, 0.5, 0.5, 0.6, 0.6, 0.7, 0.7, 0.7, 0.9, 0.9]
        this.backgrounds.forEach((bg, index) => {
            if (bg && bg.active && index > 0) { // Skip sky background and check if bg exists
                bg.tilePositionX = this.cameras.main.scrollX * scrollSpeeds[index]
            }
        })
    }
    createShopUI() {
        // Destroy existing shop UI if it exists
        if (this.shopUI) {
            this.shopUI.removeAll(true)
            this.shopUI.destroy()
        }
        
        // Create a new Scene specifically for the shop UI
        this.shopUI = this.add.container()
        
        // Get screen dimensions (not world dimensions)
        const width = this.cameras.main.width
        const height = this.cameras.main.height
        
        // Background with interaction
        const bg = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.8)
            .setInteractive()
            .setScrollFactor(0)
        this.shopUI.add(bg)
        
        // Close button - position relative to camera viewport
        const closeBtn = this.add.text(width - 60, 20, '❌', { 
            fontSize: '32px',
            padding: { x: 10, y: 10 }
        })
        .setScrollFactor(0)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.closeShop())
        this.shopUI.add(closeBtn)
        
        // Create item buttons
        let y = 100
        this.player.customization.unlockables.hats.forEach(item => {
            // Create individual interactive button (not container)
            const buttonBg = this.add.rectangle(width/2, y, 300, 60, 0x444444)
                .setScrollFactor(0)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.purchaseItem(item))
                .on('pointerover', () => buttonBg.setFillStyle(0x666666))
                .on('pointerout', () => buttonBg.setFillStyle(0x444444))
            
            // Create button text
            const text = this.add.text(width/2, y, 
                `${item.name}\n${this.player.customization.isUnlocked(item.id) ? 'Owned' : item.price + ' coins'}`, 
                { 
                    fontSize: '20px',
                    align: 'center',
                    color: '#ffffff'
                }
            )
            .setScrollFactor(0)
            .setOrigin(0.5)
            
            // Add elements directly to shop UI (not in a container)
            this.shopUI.add([buttonBg, text])
            
            y += 80
        })

        // Set all UI elements to ignore camera scroll and ensure proper depth
        this.shopUI.setDepth(1000)
        this.shopUI.setVisible(false)
        
        // Make sure all children ignore scroll and are interactive
        this.shopUI.each(child => {
            child.setScrollFactor(0)
            // Refresh input handling for interactive elements
            if (child.input) {
                child.removeInteractive()
                child.setInteractive()
            }
        })
    }

    openShop() {
        if (!this.shopUI) {
            this.createShopUI()
        }
        
        // Ensure UI is positioned correctly relative to camera
        this.shopUI.setVisible(true)
        
        // Disable game input while shop is open
        this.input.keyboard.enabled = false
        if (this.moveTarget) {
            this.moveTarget = null
            this.player.setVelocityX(0)
        }

        // Pause physics while shop is open
        this.physics.pause()
    }

    closeShop() {
        if (this.shopUI) {
            this.shopUI.setVisible(false)
            
            // Re-enable game input when shop is closed
            this.input.keyboard.enabled = true
            
            // Resume physics
            this.physics.resume()
        }
    }

    purchaseItem(item) {
        if (this.player.customization.isUnlocked(item.id)) {
            console.log('Equipping:', item.name)
            this.player.customization.equipItem(item.id)
            this.player.applyCosmetics()
        } else if (this.player.customization.unlockItem(item.id, this.coinScore)) {
            console.log('Purchasing:', item.name)
            this.updateScore(this.coinScore - item.price)
            this.player.customization.equipItem(item.id)
            this.player.applyCosmetics()
            
            // Refresh the shop UI to update button states
            this.createShopUI()
            this.shopUI.setVisible(true)
        } else {
            console.log('Cannot afford:', item.name)
        }
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
}