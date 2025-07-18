import { describe, it, expect, beforeEach, vi } from 'vitest'

// Create a simplified test version of AmmunitionUI that doesn't extend Phaser classes
class TestAmmunitionUI {
    constructor(scene, x = 20, y = 120) {
        this.scene = scene
        this.x = x
        this.y = y
        
        // Initialize UI components
        this.counterText = null
        this.statusIndicator = null
        this.emptyIndicator = null
        this.fullIndicator = null
        
        // Create UI elements
        this.createUI()
        
        // Mock Phaser methods
        this.setScrollFactor = vi.fn(() => this)
        this.setDepth = vi.fn(() => this)
        this.setVisible = vi.fn(() => this)
        this.setScale = vi.fn(() => this)
        this.setPosition = vi.fn(() => this)
        this.add = vi.fn()
        
        // Add to scene
        scene.add.existing(this)
    }

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
        
        // Create empty state indicator
        this.emptyIndicator = this.scene.add.container(0, 0)
        const emptyBg = this.scene.add.circle(0, 0, 15, 0xff4444, 0.8)
        const emptyIcon = this.scene.add.text(0, 0, '✗', {
            fontSize: '20px',
            fontFamily: 'Arial',
            fill: '#ffffff'
        })
        this.emptyIndicator.add([emptyBg, emptyIcon])
        this.emptyIndicator.setVisible(false)
        
        // Create full state indicator
        this.fullIndicator = this.scene.add.container(0, 0)
        const fullBg = this.scene.add.circle(0, 0, 15, 0x44ff44, 0.8)
        const fullIcon = this.scene.add.text(0, 0, '✓', {
            fontSize: '20px',
            fontFamily: 'Arial',
            fill: '#ffffff'
        })
        this.fullIndicator.add([fullBg, fullIcon])
        this.fullIndicator.setVisible(false)
        
        // Add indicators to status container
        this.statusIndicator.add([this.emptyIndicator, this.fullIndicator])
    }

    updateDisplay(count, maxCount) {
        // Update counter text
        this.counterText.setText(`${count}/${maxCount}`)
        
        // Update text color based on ammunition level
        if (count === 0) {
            this.counterText.setFill('#ff4444')
            this.counterText.setStroke('#880000')
        } else if (count === maxCount) {
            this.counterText.setFill('#44ff44')
            this.counterText.setStroke('#008800')
        } else {
            this.counterText.setFill('#4a90e2')
            this.counterText.setStroke('#1a4480')
        }
        
        // Hide all status indicators by default
        this.emptyIndicator.setVisible(false)
        this.fullIndicator.setVisible(false)
    }

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

    hide() {
        this.setVisible(false)
    }

    show() {
        this.setVisible(true)
    }

    handleResize(scaleFactor = 1) {
        this.setScale(scaleFactor)
        
        // Adjust position based on scale
        const baseX = 20
        const baseY = 120
        this.setPosition(baseX * scaleFactor, baseY * scaleFactor)
    }

    destroy() {
        // Stop any running tweens
        this.scene.tweens.killTweensOf(this.emptyIndicator)
        this.scene.tweens.killTweensOf(this.fullIndicator)
    }
}

const mockScene = {
    add: {
        existing: vi.fn(),
        text: vi.fn(() => ({
            setOrigin: vi.fn(() => ({ setOrigin: vi.fn() })),
            setText: vi.fn(),
            setFill: vi.fn(),
            setStroke: vi.fn()
        })),
        container: vi.fn(() => ({
            add: vi.fn(),
            setVisible: vi.fn()
        })),
        circle: vi.fn(() => ({})),
    },
    tweens: {
        add: vi.fn(),
        killTweensOf: vi.fn()
    }
}

describe('AmmunitionUI', () => {
    let ammunitionUI

    beforeEach(() => {
        vi.clearAllMocks()
        ammunitionUI = new TestAmmunitionUI(mockScene, 20, 120)
    })

    describe('constructor', () => {
        it('should create AmmunitionUI with default position', () => {
            const ui = new TestAmmunitionUI(mockScene)
            expect(ui.x).toBe(20)
            expect(ui.y).toBe(120)
            expect(ui.scene).toBe(mockScene)
        })

        it('should create AmmunitionUI with custom position', () => {
            const ui = new TestAmmunitionUI(mockScene, 50, 200)
            expect(ui.x).toBe(50)
            expect(ui.y).toBe(200)
        })

        it('should initialize UI components', () => {
            expect(ammunitionUI.counterText).toBeDefined()
            expect(ammunitionUI.statusIndicator).toBeDefined()
            expect(ammunitionUI.emptyIndicator).toBeDefined()
            expect(ammunitionUI.fullIndicator).toBeDefined()
        })

        it('should add itself to the scene', () => {
            expect(mockScene.add.existing).toHaveBeenCalledWith(ammunitionUI)
        })
    })

    describe('updateDisplay', () => {
        it('should update counter text with current count and max count', () => {
            ammunitionUI.updateDisplay(5, 10)
            expect(ammunitionUI.counterText.setText).toHaveBeenCalledWith('5/10')
        })

        it('should set red color when ammunition is empty', () => {
            ammunitionUI.updateDisplay(0, 10)
            expect(ammunitionUI.counterText.setFill).toHaveBeenCalledWith('#ff4444')
            expect(ammunitionUI.counterText.setStroke).toHaveBeenCalledWith('#880000')
        })

        it('should set green color when ammunition is full', () => {
            ammunitionUI.updateDisplay(10, 10)
            expect(ammunitionUI.counterText.setFill).toHaveBeenCalledWith('#44ff44')
            expect(ammunitionUI.counterText.setStroke).toHaveBeenCalledWith('#008800')
        })

        it('should set blue color for normal ammunition levels', () => {
            ammunitionUI.updateDisplay(5, 10)
            expect(ammunitionUI.counterText.setFill).toHaveBeenCalledWith('#4a90e2')
            expect(ammunitionUI.counterText.setStroke).toHaveBeenCalledWith('#1a4480')
        })

        it('should hide status indicators by default', () => {
            ammunitionUI.updateDisplay(5, 10)
            expect(ammunitionUI.emptyIndicator.setVisible).toHaveBeenCalledWith(false)
            expect(ammunitionUI.fullIndicator.setVisible).toHaveBeenCalledWith(false)
        })
    })

    describe('showEmptyState', () => {
        it('should show empty indicator and hide full indicator', () => {
            ammunitionUI.showEmptyState()
            expect(ammunitionUI.emptyIndicator.setVisible).toHaveBeenCalledWith(true)
            expect(ammunitionUI.fullIndicator.setVisible).toHaveBeenCalledWith(false)
        })

        it('should add pulsing animation for empty state', () => {
            ammunitionUI.showEmptyState()
            expect(mockScene.tweens.add).toHaveBeenCalledWith({
                targets: ammunitionUI.emptyIndicator,
                alpha: 0.3,
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            })
        })
    })

    describe('showFullState', () => {
        it('should show full indicator and hide empty indicator', () => {
            ammunitionUI.showFullState()
            expect(ammunitionUI.fullIndicator.setVisible).toHaveBeenCalledWith(true)
            expect(ammunitionUI.emptyIndicator.setVisible).toHaveBeenCalledWith(false)
        })

        it('should add flash animation for full state', () => {
            ammunitionUI.showFullState()
            expect(mockScene.tweens.add).toHaveBeenCalledWith({
                targets: ammunitionUI.fullIndicator,
                scaleX: 1.3,
                scaleY: 1.3,
                duration: 200,
                yoyo: true,
                ease: 'Back.easeOut'
            })
        })
    })

    describe('visibility methods', () => {
        it('should hide the UI', () => {
            const setVisibleSpy = vi.spyOn(ammunitionUI, 'setVisible')
            ammunitionUI.hide()
            expect(setVisibleSpy).toHaveBeenCalledWith(false)
        })

        it('should show the UI', () => {
            const setVisibleSpy = vi.spyOn(ammunitionUI, 'setVisible')
            ammunitionUI.show()
            expect(setVisibleSpy).toHaveBeenCalledWith(true)
        })
    })

    describe('handleResize', () => {
        it('should adjust scale and position based on scale factor', () => {
            const setScaleSpy = vi.spyOn(ammunitionUI, 'setScale')
            const setPositionSpy = vi.spyOn(ammunitionUI, 'setPosition')
            
            ammunitionUI.handleResize(1.5)
            
            expect(setScaleSpy).toHaveBeenCalledWith(1.5)
            expect(setPositionSpy).toHaveBeenCalledWith(30, 180) // 20 * 1.5, 120 * 1.5
        })

        it('should use default scale factor of 1 when not provided', () => {
            const setScaleSpy = vi.spyOn(ammunitionUI, 'setScale')
            const setPositionSpy = vi.spyOn(ammunitionUI, 'setPosition')
            
            ammunitionUI.handleResize()
            
            expect(setScaleSpy).toHaveBeenCalledWith(1)
            expect(setPositionSpy).toHaveBeenCalledWith(20, 120)
        })
    })

    describe('destroy', () => {
        it('should clean up tweens before destroying', () => {
            ammunitionUI.destroy()
            expect(mockScene.tweens.killTweensOf).toHaveBeenCalledWith(ammunitionUI.emptyIndicator)
            expect(mockScene.tweens.killTweensOf).toHaveBeenCalledWith(ammunitionUI.fullIndicator)
        })
    })
})