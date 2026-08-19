import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('phaser', () => ({
    default: {
        Physics: {
            Arcade: {
                Image: class MockImage {
                    constructor(scene, x, y, texture) {
                        this.scene = scene
                        this.x = x
                        this.y = y
                        this.texture = texture
                        this.body = {
                            setAllowGravity: vi.fn(),
                            setSize: vi.fn(),
                            setOffset: vi.fn()
                        }
                        this.depth = 0
                        this.displayWidth = 0
                        this.displayHeight = 0
                        this.immovable = false
                    }
                    setImmovable(v) { this.immovable = v; return this }
                    setCrop(x, y, w, h) { this.crop = { x, y, w, h }; return this }
                    setDisplaySize(w, h) { this.displayWidth = w; this.displayHeight = h; return this }
                    setDepth(v) { this.depth = v; return this }
                    refreshBody() { return this }
                    destroy() { this.destroyed = true }
                }
            }
        }
    }
}))

import Obstacle, { OBSTACLE_TYPES } from './obstacle'

const makeGfx = () => ({
    fillStyle: vi.fn(),
    fillRect: vi.fn(),
    generateTexture: vi.fn(),
    destroy: vi.fn()
})

const makeMockScene = () => {
    const gfx = makeGfx()
    return {
        _gfx: gfx,
        add: {
            existing: vi.fn(),
            graphics: vi.fn(() => gfx)
        },
        physics: {
            add: {
                existing: vi.fn()
            }
        },
        textures: {
            exists: vi.fn(() => false)
        },
        tweens: {
            add: vi.fn()
        }
    }
}

describe('OBSTACLE_TYPES', () => {
    it('exports STATIC and MOVING constants', () => {
        expect(OBSTACLE_TYPES.STATIC).toBe('static')
        expect(OBSTACLE_TYPES.MOVING).toBe('moving')
    })
})

describe('Obstacle', () => {
    let mockScene

    beforeEach(() => {
        vi.clearAllMocks()
        mockScene = makeMockScene()
    })

    describe('static obstacle', () => {
        it('is created with dynamic physics body for group compatibility', () => {
            const obs = new Obstacle(mockScene, 100, 200, { type: 'static' })
            expect(mockScene.physics.add.existing).toHaveBeenCalledWith(obs, false)
        })

        it('is immovable', () => {
            const obs = new Obstacle(mockScene, 100, 200, { type: 'static' })
            expect(obs.immovable).toBe(true)
        })

        it('uses puddle dimensions that preserve its wide shape', () => {
            const obs = new Obstacle(mockScene, 100, 200)
            expect(obs.displayWidth).toBe(120)
            expect(obs.displayHeight).toBe(68)
        })

        it('crops the transparent image margins', () => {
            const obs = new Obstacle(mockScene, 100, 200)
            expect(obs.crop).toEqual({ x: 145, y: 160, w: 565, h: 315 })
        })

        it('uses custom dimensions', () => {
            const obs = new Obstacle(mockScene, 100, 200, { width: 120, height: 40 })
            expect(obs.displayWidth).toBe(120)
            expect(obs.displayHeight).toBe(40)
        })

        it('uses the puddle-water texture', () => {
            const obs = new Obstacle(mockScene, 100, 200, { type: 'static' })
            expect(obs.texture).toBe('puddle-water')
            expect(mockScene.add.graphics).not.toHaveBeenCalled()
        })

        it('sets default depth to 10', () => {
            const obs = new Obstacle(mockScene, 100, 200, { type: 'static' })
            expect(obs.depth).toBe(10)
        })

        it('sets custom depth', () => {
            const obs = new Obstacle(mockScene, 100, 200, { depth: 20 })
            expect(obs.depth).toBe(20)
        })

        it('does not create a tween', () => {
            new Obstacle(mockScene, 100, 200, { type: 'static' })
            expect(mockScene.tweens.add).not.toHaveBeenCalled()
        })
    })

    describe('moving obstacle', () => {
        it('is created with dynamic physics body', () => {
            const obs = new Obstacle(mockScene, 100, 200, { type: 'moving' })
            expect(mockScene.physics.add.existing).toHaveBeenCalledWith(obs, false)
        })

        it('disables gravity', () => {
            const obs = new Obstacle(mockScene, 100, 200, { type: 'moving' })
            expect(obs.body.setAllowGravity).toHaveBeenCalledWith(false)
        })

        it('creates a tween for back-and-forth movement', () => {
            new Obstacle(mockScene, 100, 200, { type: 'moving' })
            expect(mockScene.tweens.add).toHaveBeenCalledWith(
                expect.objectContaining({ yoyo: true, repeat: -1 })
            )
        })

        it('horizontal movement tween targets x', () => {
            new Obstacle(mockScene, 100, 200, { type: 'moving', moveAxis: 'horizontal', moveDistance: 150 })
            const tweenConfig = mockScene.tweens.add.mock.calls[0][0]
            expect(tweenConfig.x).toBeDefined()
            expect(tweenConfig.y).toBeUndefined()
        })

        it('vertical movement tween targets y', () => {
            new Obstacle(mockScene, 100, 200, { type: 'moving', moveAxis: 'vertical', moveDistance: 100 })
            const tweenConfig = mockScene.tweens.add.mock.calls[0][0]
            expect(tweenConfig.y).toBeDefined()
            expect(tweenConfig.x).toBeUndefined()
        })
    })

    describe('update()', () => {
        it('does nothing (no errors)', () => {
            const obs = new Obstacle(mockScene, 100, 200, { type: 'static' })
            expect(() => obs.update()).not.toThrow()
        })
    })
})
