/**
 * AmmunitionUI class manages the display of ammunition count and status indicators
 * Provides visual feedback for ball inventory state including empty/full indicators
 */
export default class AmmunitionUI extends Phaser.GameObjects.Container {
    /**
     * Creates a new AmmunitionUI instance
     * @param {Phaser.Scene} scene - Reference to the game scene
     * @param {number} x - X position for the UI element (default: 20)
     * @param {number} y - Y position for the UI element (default: 120)
     */
    constructor(scene, x = 20, y = 120) {
        super(scene, x, y)
        this.scene = scene
        
        // Initialize UI components
        this.counterText = null
        this.statusIndicator = null
        this.emptyIndicator = null
        this.fullIndicator = null
        
        // Create UI elements
        this.createUI()
        
        // Set UI properties
        this.setScrollFactor(0)
        this.setDepth(100)
        
        // Add to scene
        scene.add.existing(this)
    }

    /**
     * Creates the UI elements including text display and status indicators
     */
    createUI() {
        // Create ammunition counter text
        this.counterText = this.scene.add.text(0, 0, '0/10', {
            fontSize: '48px',
            fontWeight: 'bold',
            fontFamily: 'Coming Soon',
            fill: '#4a90e2',
            stroke: '#1a4480',
            strokeThickness: 6,
            padding: { x: 8, y: 8 }
        })
        this.counterText.setOrigin(0, 0)
        
        // Create status indicator container
        this.statusIndicator = this.scene.add.container(0, 60)
        
        // Create empty state indicator (red circle with X)
        this.emptyIndicator = this.scene.add.container(0, 0)
        const emptyBg = this.scene.add.circle(0, 0, 15, 0xff4444, 0.8)
        const emptyIcon = this.scene.add.text(0, 0, '✗', {
            fontSize: '20px',
            fontFamily: 'Arial',
            fill: '#ffffff'
        }).setOrigin(0.5)
        this.emptyIndicator.add([emptyBg, emptyIcon])
        this.emptyIndicator.setVisible(false)
        
        // Create full state indicator (green circle with checkmark)
        this.fullIndicator = this.scene.add.container(0, 0)
        const fullBg = this.scene.add.circle(0, 0, 15, 0x44ff44, 0.8)
        const fullIcon = this.scene.add.text(0, 0, '✓', {
            fontSize: '20px',
            fontFamily: 'Arial',
            fill: '#ffffff'
        }).setOrigin(0.5)
        this.fullIndicator.add([fullBg, fullIcon])
        this.fullIndicator.setVisible(false)
        
        // Add indicators to status container
        this.statusIndicator.add([this.emptyIndicator, this.fullIndicator])
        
        // Add all elements to main container
        this.add([this.counterText, this.statusIndicator])
    }

    /**
     * Updates the ammunition display with current count and capacity
     * @param {number} count - Current ammunition count
     * @param {number} maxCount - Maximum ammunition capacity
     */
    updateDisplay(count, maxCount) {
        // Update counter text
        this.counterText.setText(`${count}/${maxCount}`)
        
        // Update text color based on ammunition level
        if (count === 0) {
            this.counterText.setFill('#ff4444') // Red when empty
            this.counterText.setStroke('#880000')
        } else if (count === maxCount) {
            this.counterText.setFill('#44ff44') // Green when full
            this.counterText.setStroke('#008800')
        } else {
            this.counterText.setFill('#4a90e2') // Blue for normal state
            this.counterText.setStroke('#1a4480')
        }
        
        // Hide all status indicators by default
        this.emptyIndicator.setVisible(false)
        this.fullIndicator.setVisible(false)
    }

    /**
     * Shows the empty ammunition state indicator
     */
    showEmptyState() {
        this.emptyIndicator.setVisible(true)
        this.fullIndicator.setVisible(false)
        
        // Add pulsing animation for empty state
        this.scene.tweens.add({
            targets: this.emptyIndicator,
            alpha: 0.3,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        })
    }

    /**
     * Shows the full ammunition state indicator
     */
    showFullState() {
        this.fullIndicator.setVisible(true)
        this.emptyIndicator.setVisible(false)
        
        // Add brief flash animation for full state
        this.scene.tweens.add({
            targets: this.fullIndicator,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 200,
            yoyo: true,
            ease: 'Back.easeOut'
        })
    }

    /**
     * Hides the ammunition display
     */
    hide() {
        this.setVisible(false)
    }

    /**
     * Shows the ammunition display
     */
    show() {
        this.setVisible(true)
    }

    /**
     * Handles screen resize by adjusting UI scale and position
     * @param {number} scaleFactor - Scale factor for responsive design
     */
    handleResize(scaleFactor = 1) {
        this.setScale(scaleFactor)
        
        // Adjust position based on scale
        const baseX = 20
        const baseY = 120
        this.setPosition(baseX * scaleFactor, baseY * scaleFactor)
    }

    /**
     * Cleans up tweens and animations when destroying the UI
     */
    destroy() {
        // Stop any running tweens
        this.scene.tweens.killTweensOf(this.emptyIndicator)
        this.scene.tweens.killTweensOf(this.fullIndicator)
        
        // Call parent destroy
        super.destroy()
    }
}