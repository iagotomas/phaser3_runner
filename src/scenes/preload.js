import { Scene } from 'phaser'

export default class Preload extends Scene {
    constructor() {
        super('preload')
    }

    preload() {
        // Get device dimensions
        const width = this.cameras.main.width
        const height = this.cameras.main.height
        
        // Determine which splash screen to use based on device
        let splashKey = 'splash-default'
        
        // iPhone detection
        if (window.devicePixelRatio === 3) {
            if (window.innerHeight === 932 || window.innerHeight === 852) splashKey = 'iPhone14Pro'
            else if (window.innerHeight === 926) splashKey = 'iPhone14Plus'
            else if (window.innerHeight === 844) splashKey = 'iPhone14'
            else if (window.innerHeight === 812) splashKey = 'iPhone13Mini'
        }
        // iPad detection
        else if (window.devicePixelRatio === 2) {
            if (window.innerHeight === 1366) splashKey = 'iPadPro129'
            else if (window.innerHeight === 1194) splashKey = 'iPadPro11'
            else if (window.innerHeight === 1180) splashKey = 'iPadAir'
        }

        // Load splash screen first
        this.load.image(splashKey, `assets/splash/${splashKey}_landscape.png`)
        
        // Create initial black background
        const bg = this.add.rectangle(0, 0, width, height, 0x000000)
        bg.setOrigin(0, 0)
        
        // Create loading UI container
        const loadingContainer = this.add.container(width/2, height/2)
        
        // Calculate loading bar dimensions based on screen size
        const barWidth = Math.min(width * 0.8, 400) // Max width of 600px
        const barHeight = Math.min(height * 0.1, 40) // Max height of 60px
        
        // Create loading bar background with rounded corners
        const progressBg = this.add.graphics()
        progressBg.fillStyle(0xde1dba, 0.8)
        progressBg.fillRoundedRect(-barWidth/2, -barHeight/2, barWidth, barHeight, barHeight/2)
        progressBg.lineStyle(4, 0xde1dba, 1)
        progressBg.strokeRoundedRect(-barWidth/2, -barHeight/2, barWidth, barHeight, barHeight/2)
        loadingContainer.add(progressBg)
        
        // Create progress bar with rounded corners
        const progressBar = this.add.graphics()
        loadingContainer.add(progressBar)
        
        // Update loading bar
        this.load.on('progress', (value) => {
            progressBar.clear()
            progressBar.fillStyle(0xed5fd3, 1)
            progressBar.fillRoundedRect(
                -barWidth/2 + 4, // Offset for border
                -barHeight/2 + 4, // Offset for border
                (barWidth - 8) * value, // Account for border
                barHeight - 8, // Account for border
                (barHeight - 8)/2 // Rounded corners
            )
        })

        // Handle loading complete
        this.load.on('complete', () => {
            // Add splash screen behind UI
            const splash = this.add.image(width/2, height/2, splashKey)
            splash.setDepth(-1)
            
            // Scale splash to cover screen while maintaining aspect ratio
            const scaleX = width / splash.width
            const scaleY = height / splash.height
            const scale = Math.max(scaleX, scaleY)
            splash.setScale(scale)
            
            // Center the splash screen
            splash.setPosition(width/2, height/2)
            
            // Add overlay for better text visibility
            const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.3)
            overlay.setOrigin(0, 0)
            overlay.setDepth(0)
            
            // Remove loading UI
            loadingContainer.destroy()
            bg.destroy()
            
            // Add "Press any key to start" text
            const startText = this.add.text(width/2, height/2 + 50, 'Toca per començar', {
                fontFamily: 'Arial',
                fontSize: '42px',
                color: '#ed5fd3',
                stroke: '#de1dba',
                strokeThickness: 4
            })
            startText.setOrigin(0.5, 0.5)
            startText.setDepth(1)
            startText.postFX.addGlow()
            // Add blinking animation
            this.tweens.add({
                targets: startText,
                alpha: 0,
                duration: 1000,
                ease: 'Power2',
                yoyo: true,
                repeat: -1
            })
            
            // Add input handlers
            this.input.keyboard.once('keydown', () => this.scene.start('game'))
            this.input.once('pointerdown', () => this.scene.start('game'))
        })

        // Load rest of game assets
        this.load.atlas('ponygirl', 'assets/game_sprites.png', 'assets/game_sprites.json')
        this.load.atlas('ponygirl-jump', 'assets/girl_jumping.png', 'assets/girl_jumping.json')
        this.load.image('ground', 'assets/platform-cake.png')
        this.load.image('platform', 'assets/background/level1/Layers/layer01.png')
        
        this.load.image('sky', 'assets/background/level1/Layers/layer06.png')
        this.load.image('bg-1-01', 'assets/background/level1/Layers/layer05.png')
        this.load.image('bg-1-02', 'assets/background/level1/Layers/layer04.png')
        this.load.image('bg-1-03', 'assets/background/level1/Layers/layer03.png')
        this.load.image('bg-1-04', 'assets/background/level1/Layers/layer02.png')
        
        // Load cosmetic items
        this.load.image('hat1', 'assets/cosmetics/party-hat.png')
        this.load.image('hat2', 'assets/cosmetics/crown.png')
        this.load.image('hat3', 'assets/cosmetics/cowboy.png')
        this.load.image('hat4', 'assets/cosmetics/princess_crown.png')
        this.load.image('star', 'assets/particles/star.png')

        // Load background music
        this.load.audio('bgMusic', [
            'assets/audio/background-music.m4a',
            'assets/audio/background-music.mp3',
            'assets/audio/background-music.ogg'
        ])
    }
}