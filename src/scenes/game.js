import { Scene } from 'phaser'
import StateMachine from '../objects/statemachine'
import Player from '../objects/player'
import CloudManager from '../objects/cloud'

export default class Game extends Scene { 
    constructor() {
        super('game')
        this.player = null;
        this.fpsText = null;
        this.cloudManager = null;
        this.backgrounds = [];
        this.controls = null;
    }

    preload() {}

    create() {
        console.log('game started')

        // Create initial background immediately
        const sky = this.background('sky')
        if (sky) this.backgrounds.push(sky)

        // Create platforms first
        const platforms = this.physics.add.staticGroup()
        
        // Fix ground platform positioning and physics
        const groundY = this.game.config.height - 30
        const segmentWidth = this.game.config.width
        
        for (let x = 0; x < this.game.config.width * 3; x += segmentWidth) {
            const groundSegment = platforms.create(x, groundY, 'platform')
            groundSegment.setOrigin(0, 0)
            groundSegment.setDisplaySize(segmentWidth, 64)
            groundSegment.refreshBody()
            groundSegment.setImmovable(true)
        }

        // Create remaining backgrounds
        const frames = ['bg-2', 'bg-3', 'bg-4', 'bg-5', 'bg-6', 'bg-7', 'bg-8', 'bg-9', 'bg-10', 'bg-11']
        frames.forEach(frame => {
            const bg = this.background(frame)
            if (bg) this.backgrounds.push(bg)
        })

        // Create player
        this.player = new Player(this, 60, groundY - 40, 'ponygirl')
        this.physics.add.collider(this.player, platforms)


        // Set up camera
        this.cameras.main.setBounds(0, 0, this.game.config.width * 3, this.game.config.height)
        this.cameras.main.startFollow(this.player)

        // Create cloud manager
        this.cloudManager = new CloudManager(this, {
            ground: platforms,
            cloudCount: 10,
            minDropDelay: 2000,
            maxDropDelay: 5000,
            onBallCollect: (points) => {
                this.coinScore += points
                this.coinCounter.setText(`${this.coinScore}`)
            }
        })

        // Set up controls
        this.keys = this.input.keyboard.createCursorKeys()
        
        // Add mobile controls
        this.createMobileControls()

        // Add resize handler
        this.scale.on('resize', this.resize, this)
        this.resize(this.scale.gameSize)

        console.log('Game setup complete')

        // Fullscreen handling
        this.input.on('pointerup', () => {
            this.scale.startFullscreen()
        }, this)

        // Score display
        this.coinScore = 0
        this.coinCounter = this.add.text(900, 20, `${this.coinScore}`, {
            fontSize: '70px',
            fontWeight: 'bold',
            fontFamily: 'Coming Soon',
            fill: '#f542d7',
            stroke: '#8c1679',
            strokeThickness: 10,
            padding: { x: 10, y: 10 }  

        })
        this.coinCounter.setScrollFactor(0);

        // Add FPS counter
        this.fpsText = this.add.text(10, 10, 'FPS: 0', {
            fontSize: '16px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 5, y: 5 }
        });
        this.fpsText.setScrollFactor(0);
        this.fpsText.setDepth(999); // Ensure it's always on top

        // Level-specific setup
        const endZone = this.add.rectangle(
            this.game.config.width * 3 - 50, 
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
        this.shopButton = this.add.text(10, 60, '🛍️ Shop', {
            fontSize: '24px',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 },
            alpha: 0.8
        })
        .setScrollFactor(0)
        .setInteractive()
        .on('pointerdown', () => this.openShop())

        // Initialize shop UI (hidden by default)
        this.createShopUI()
    }

    resize(gameSize) {
        const width = gameSize.width;
        const height = gameSize.height;

        if (width <= 0 || height <= 0) return;

        // Update camera
        this.cameras.main.setViewport(0, 0, width, height);

        // Update backgrounds
        this.backgrounds.forEach(bg => {
            if (bg && bg.active) {
                bg.setSize(width, height);
            }
        });

        // Update UI elements
        if (this.coinCounter) {
            this.coinCounter.setPosition(width - 100, 30);
        }

        if (this.fpsText) {
            this.fpsText.setPosition(10, 10);
        }

        // Update world bounds
        this.physics.world.setBounds(0, 0, width * 3, height);

        // Update camera bounds
        this.cameras.main.setBounds(0, 0, width * 3, height);

        // Update mobile controls position
        if (this.controls) {
            this.controls.left.setPosition(50, height - 100)
            this.controls.right.setPosition(150, height - 100)
            this.controls.jump.setPosition(width - 100, height - 100)
        }
    }

    starCollect(player, star) {
        star.destroy(false)
        console.log("collected star")
        this.coinScore++
        this.coinCounter.setText(`${this.coinScore}`)
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

    createMobileControls() {
        // Create a container for controls
        this.controls = {
            left: null,
            right: null,
            jump: null
        }

        const buttonStyle = {
            fontSize: '32px',
            backgroundColor: '#000000',
            color: '#ffffff',
            padding: { x: 20, y: 20 },
            alpha: 0.7
        }

        // Create left button
        this.controls.left = this.add.text(50, this.scale.height - 100, '<', buttonStyle)
            .setInteractive()
            .setScrollFactor(0)
            .setDepth(100)

        // Create right button
        this.controls.right = this.add.text(150, this.scale.height - 100, '>', buttonStyle)
            .setInteractive()
            .setScrollFactor(0)
            .setDepth(100)

        // Create jump button
        this.controls.jump = this.add.text(this.scale.width - 100, this.scale.height - 100, '↑', buttonStyle)
            .setInteractive()
            .setScrollFactor(0)
            .setDepth(100)

        // Add touch events
        this.controls.left.on('pointerdown', () => { this.keys.left.isDown = true })
        this.controls.left.on('pointerup', () => { this.keys.left.isDown = false })
        this.controls.left.on('pointerout', () => { this.keys.left.isDown = false })

        this.controls.right.on('pointerdown', () => { this.keys.right.isDown = true })
        this.controls.right.on('pointerup', () => { this.keys.right.isDown = false })
        this.controls.right.on('pointerout', () => { this.keys.right.isDown = false })

        this.controls.jump.on('pointerdown', () => { this.keys.space.isDown = true })
        this.controls.jump.on('pointerup', () => { this.keys.space.isDown = false })
        this.controls.jump.on('pointerout', () => { this.keys.space.isDown = false })
    }

    createShopUI() {
        const width = this.scale.width
        const height = this.scale.height
        
        this.shopUI = this.add.container(0, 0).setScrollFactor(0).setVisible(false)
        
        // Background
        const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0.8)
        this.shopUI.add(bg)
        
        // Close button
        const closeBtn = this.add.text(width - 40, 20, '❌', { fontSize: '24px' })
            .setInteractive()
            .on('pointerdown', () => this.closeShop())
        this.shopUI.add(closeBtn)
        
        // Create item buttons
        let y = 100
        this.player.customization.unlockables.hats.forEach(item => {
            const itemBtn = this.add.container(width/2, y)
            
            const button = this.add.rectangle(0, 0, 200, 50, 0x444444)
            const text = this.add.text(-90, -15, 
                `${item.name}\n${this.player.customization.isUnlocked(item.id) ? 'Owned' : item.price + ' coins'}`, 
                { fontSize: '16px' }
            )
            
            itemBtn.add([button, text])
            itemBtn.setInteractive(new Phaser.Geom.Rectangle(-100, -25, 200, 50), Phaser.Geom.Rectangle.Contains)
            itemBtn.on('pointerdown', () => this.purchaseItem(item))
            
            this.shopUI.add(itemBtn)
            y += 70
        })
    }

    openShop() {
        this.shopUI.setVisible(true)
        // Pause game mechanics if needed
    }

    closeShop() {
        this.shopUI.setVisible(false)
        // Resume game mechanics if needed
    }

    purchaseItem(item) {
        if (this.player.customization.isUnlocked(item.id)) {
            this.player.customization.equipItem(item.id)
            this.player.applyCosmetics()
        } else if (this.player.customization.unlockItem(item.id, this.coinScore)) {
            this.coinScore -= item.price
            this.coinCounter.setText(`${this.coinScore}`)
            this.player.customization.equipItem(item.id)
            this.player.applyCosmetics()
        }
    }
}