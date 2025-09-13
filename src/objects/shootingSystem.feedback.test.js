import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ShootingSystem } from './shootingSystem.js'

describe('ShootingSystem Visual and Audio Feedback', () => {
    let shootingSystem
    let mockScene
    let mockProjectile

    beforeEach(() => {
        // Create mock scene with visual and audio capabilities
        mockScene = {
            physics: {
                add: {
                    group: vi.fn(() => ({
                        get: vi.fn(() => mockProjectile),
                        destroy: vi.fn()
                    }))
                }
            },
            time: {
                delayedCall: vi.fn(),
                now: 1000
            },
            events: {
                on: vi.fn(),
                off: vi.fn()
            },
            add: {
                circle: vi.fn(() => ({
                    setDepth: vi.fn(),
                    destroy: vi.fn(),
                    x: 0,
                    y: 0
                })),
                particles: vi.fn(() => ({
                    setDepth: vi.fn(),
                    destroy: vi.fn()
                }))
            },
            tweens: {
                add: vi.fn()
            },
            cameras: {
                main: {
                    flash: vi.fn()
                }
            },
            sound: {
                context: {
                    createOscillator: vi.fn(() => ({
                        connect: vi.fn(),
                        start: vi.fn(),
                        stop: vi.fn(),
                        frequency: {
                            setValueAtTime: vi.fn(),
                            exponentialRampToValueAtTime: vi.fn()
                        },
                        type: 'square'
                    })),
                    createGain: vi.fn(() => ({
                        connect: vi.fn(),
                        gain: {
                            setValueAtTime: vi.fn(),
                            linearRampToValueAtTime: vi.fn(),
                            exponentialRampToValueAtTime: vi.fn()
                        }
                    })),
                    destination: {},
                    currentTime: 0
                }
            }
        }

        mockProjectile = {
            setActive: vi.fn(),
            setVisible: vi.fn(),
            setDepth: vi.fn(),
            setScale: vi.fn(),
            body: {
                setSize: vi.fn(),
                setVelocity: vi.fn(),
                setGravityY: vi.fn(),
                setDrag: vi.fn(),
                setMass: vi.fn(),
                velocity: { x: 100, y: -50 }
            },
            setBounce: vi.fn(),
            setCollideWorldBounds: vi.fn(),
            setVelocityX: vi.fn(),
            setVelocityY: vi.fn(),
            setAngularVelocity: vi.fn(),
            clearTint: vi.fn(),
            active: true,
            x: 100,
            y: 200
        }

        shootingSystem = new ShootingSystem(mockScene)
    })

    describe('createMuzzleFlash', () => {
        it('should create muzzle flash and glow effects', () => {
            shootingSystem.createMuzzleFlash(100, 200, 1)

            // Should create two circles (flash and glow)
            expect(mockScene.add.circle).toHaveBeenCalledTimes(2)
            expect(mockScene.add.circle).toHaveBeenCalledWith(100, 200, 12, 0xffff00, 0.9)
            expect(mockScene.add.circle).toHaveBeenCalledWith(115, 200, 20, 0xff8800, 0.5)
        })

        it('should animate muzzle flash with tweens', () => {
            shootingSystem.createMuzzleFlash(100, 200, 1)

            // Should create two tween animations
            expect(mockScene.tweens.add).toHaveBeenCalledTimes(2)
            
            // Check flash animation
            const flashTween = mockScene.tweens.add.mock.calls[0][0]
            expect(flashTween.scaleX).toBe(2)
            expect(flashTween.scaleY).toBe(2)
            expect(flashTween.alpha).toBe(0)
            expect(flashTween.duration).toBe(150)
            expect(flashTween.ease).toBe('Power2')

            // Check glow animation
            const glowTween = mockScene.tweens.add.mock.calls[1][0]
            expect(glowTween.scaleX).toBe(1.5)
            expect(glowTween.scaleY).toBe(1.5)
            expect(glowTween.alpha).toBe(0)
            expect(glowTween.duration).toBe(200)
        })

        it('should trigger camera flash effect', () => {
            shootingSystem.createMuzzleFlash(100, 200, 1)

            expect(mockScene.cameras.main.flash).toHaveBeenCalledWith(
                100, 255, 255, 0, false, expect.any(Function)
            )
        })

        it('should handle left direction correctly', () => {
            shootingSystem.createMuzzleFlash(100, 200, -1)

            // Should offset flash to the left
            expect(mockScene.add.circle).toHaveBeenCalledWith(100, 200, 12, 0xffff00, 0.9)
            expect(mockScene.add.circle).toHaveBeenCalledWith(85, 200, 20, 0xff8800, 0.5)
        })

        it('should handle missing scene methods gracefully', () => {
            const limitedScene = { ...mockScene, add: null }
            const limitedShootingSystem = new ShootingSystem(limitedScene)

            // Should not throw error
            expect(() => {
                limitedShootingSystem.createMuzzleFlash(100, 200, 1)
            }).not.toThrow()
        })
    })

    describe('createProjectileTrail', () => {
        it('should create particle trail for projectile', () => {
            shootingSystem.createProjectileTrail(mockProjectile)

            expect(mockScene.add.particles).toHaveBeenCalledWith(
                mockProjectile.x, 
                mockProjectile.y, 
                'star',
                expect.objectContaining({
                    scale: { start: 0.3, end: 0 },
                    alpha: { start: 0.8, end: 0 },
                    tint: 0xffffff,
                    lifespan: 300,
                    frequency: 50,
                    quantity: 1,
                    speed: { min: 10, max: 30 },
                    follow: mockProjectile,
                    followOffset: { x: -8, y: 0 }
                })
            )
        })

        it('should set correct depth for particles', () => {
            const mockParticles = { setDepth: vi.fn(), destroy: vi.fn() }
            mockScene.add.particles.mockReturnValue(mockParticles)

            shootingSystem.createProjectileTrail(mockProjectile)

            expect(mockParticles.setDepth).toHaveBeenCalledWith(17)
        })

        it('should store particles on projectile for cleanup', () => {
            const mockParticles = { setDepth: vi.fn(), destroy: vi.fn() }
            mockScene.add.particles.mockReturnValue(mockParticles)

            shootingSystem.createProjectileTrail(mockProjectile)

            expect(mockProjectile.trailParticles).toBe(mockParticles)
        })

        it('should handle missing scene methods gracefully', () => {
            const limitedScene = { ...mockScene, add: { circle: vi.fn() } }
            const limitedShootingSystem = new ShootingSystem(limitedScene)

            // Should not throw error
            expect(() => {
                limitedShootingSystem.createProjectileTrail(mockProjectile)
            }).not.toThrow()
        })
    })

    describe('playShootingSound', () => {
        it('should create synthetic shooting sound using Web Audio API', () => {
            const mockOscillator = mockScene.sound.context.createOscillator()
            const mockGain = mockScene.sound.context.createGain()

            shootingSystem.playShootingSound()

            expect(mockScene.sound.context.createOscillator).toHaveBeenCalled()
            expect(mockScene.sound.context.createGain).toHaveBeenCalled()
            expect(mockOscillator.connect).toHaveBeenCalledWith(mockGain)
            expect(mockGain.connect).toHaveBeenCalledWith(mockScene.sound.context.destination)
        })

        it('should configure oscillator for shooting sound', () => {
            const mockOscillator = mockScene.sound.context.createOscillator()

            shootingSystem.playShootingSound()

            expect(mockOscillator.type).toBe('square')
            expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(800, 0)
            expect(mockOscillator.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(200, 0.1)
        })

        it('should configure gain envelope for shooting sound', () => {
            const mockGain = mockScene.sound.context.createGain()

            shootingSystem.playShootingSound()

            expect(mockGain.gain.setValueAtTime).toHaveBeenCalledWith(0, 0)
            expect(mockGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.1, 0.01)
            expect(mockGain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.001, 0.1)
        })

        it('should start and stop oscillator', () => {
            const mockOscillator = mockScene.sound.context.createOscillator()

            shootingSystem.playShootingSound()

            expect(mockOscillator.start).toHaveBeenCalledWith(0)
            expect(mockOscillator.stop).toHaveBeenCalledWith(0.1)
        })

        it('should handle missing audio context gracefully', () => {
            const noAudioScene = { ...mockScene, sound: {} }
            const noAudioShootingSystem = new ShootingSystem(noAudioScene)

            // Should not throw error
            expect(() => {
                noAudioShootingSystem.playShootingSound()
            }).not.toThrow()
        })

        it('should handle audio context errors gracefully', () => {
            mockScene.sound.context.createOscillator.mockImplementation(() => {
                throw new Error('Audio context error')
            })

            // Should not throw error
            expect(() => {
                shootingSystem.playShootingSound()
            }).not.toThrow()
        })
    })

    describe('fireBall integration with feedback', () => {
        it('should trigger all feedback effects when firing', () => {
            const createMuzzleFlashSpy = vi.spyOn(shootingSystem, 'createMuzzleFlash')
            const createProjectileTrailSpy = vi.spyOn(shootingSystem, 'createProjectileTrail')
            const playShootingSoundSpy = vi.spyOn(shootingSystem, 'playShootingSound')

            shootingSystem.fireBall(100, 200, 1)

            expect(createMuzzleFlashSpy).toHaveBeenCalledWith(100, 200, 1)
            expect(createProjectileTrailSpy).toHaveBeenCalledWith(mockProjectile)
            expect(playShootingSoundSpy).toHaveBeenCalled()
        })
    })

    describe('cleanupProjectile with particle cleanup', () => {
        it('should clean up particle trail when cleaning up projectile', () => {
            const mockParticles = { setDepth: vi.fn(), destroy: vi.fn() }
            mockProjectile.trailParticles = mockParticles

            shootingSystem.cleanupProjectile(mockProjectile)

            expect(mockParticles.destroy).toHaveBeenCalled()
            expect(mockProjectile.trailParticles).toBeUndefined()
        })

        it('should handle projectiles without particle trails', () => {
            delete mockProjectile.trailParticles

            expect(() => {
                shootingSystem.cleanupProjectile(mockProjectile)
            }).not.toThrow()
        })
    })
})