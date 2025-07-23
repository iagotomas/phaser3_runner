import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Phaser before importing Enemy
vi.mock('phaser', () => ({
    default: {
        Physics: {
            Arcade: {
                Sprite: class MockSprite {
                    constructor(scene, x, y, texture, frame) {
                        this.scene = scene
                        this.x = x
                        this.y = y
                        this.texture = texture
                        this.frame = frame
                        this.body = {
                            setSize: vi.fn(),
                            setOffset: vi.fn()
                        }
                        this.depth = 0
                        this.scaleX = 1
                        this.scaleY = 1
                        this.flipX = false
                        this.tint = 0xffffff
                        this.alpha = 1
                    }
                    
                    setCollideWorldBounds() { return this }
                    setBounce() { return this }
                    setGravityY() { return this }
                    setDepth(value) { this.depth = value; return this }
                    setScale(value) { this.scaleX = this.scaleY = value; return this }
                    setVelocityX() { return this }
                    setFlipX(value) { this.flipX = value; return this }
                    setTint(value) { this.tint = value; return this }
                    destroy() { this.destroyed = true }
                    preUpdate() {}
                }
            }
        }
    }
}))

import Enemy from './enemy'

// Mock scene for testing
const mockScene = {
    add: {
        existing: vi.fn()
    },
    physics: {
        add: {
            existing: vi.fn()
        }
    },
    time: {
        delayedCall: vi.fn()
    },
    tweens: {
        add: vi.fn()
    },
    events: {
        emit: vi.fn()
    }
}

describe('Enemy', () => {
    let enemy

    beforeEach(() => {
        vi.clearAllMocks()
        enemy = new Enemy(mockScene, 100, 200, 'test-texture', 'test-frame')
    })

    describe('constructor', () => {
        it('should create enemy with default properties', () => {
            expect(enemy.x).toBe(100)
            expect(enemy.y).toBe(200)
            expect(enemy.health).toBe(3)
            expect(enemy.maxHealth).toBe(3)
            expect(enemy.enemyType).toBe('basic')
            expect(enemy.damage).toBe(1)
        })

        it('should create enemy with custom config', () => {
            const customEnemy = new Enemy(mockScene, 50, 75, 'custom', 'frame', {
                health: 5,
                type: 'boss',
                damage: 3,
                moveSpeed: 100
            })

            expect(customEnemy.maxHealth).toBe(5)
            expect(customEnemy.health).toBe(5)
            expect(customEnemy.enemyType).toBe('boss')
            expect(customEnemy.damage).toBe(3)
            expect(customEnemy.moveSpeed).toBe(100)
        })

        it('should set appropriate depth level', () => {
            expect(enemy.depth).toBe(16)
        })

        it('should add enemy to scene and physics', () => {
            expect(mockScene.add.existing).toHaveBeenCalledWith(enemy)
            expect(mockScene.physics.add.existing).toHaveBeenCalledWith(enemy)
        })

        it('should generate unique enemy ID', () => {
            const enemy1 = new Enemy(mockScene, 0, 0)
            const enemy2 = new Enemy(mockScene, 0, 0)
            
            expect(enemy1.enemyId).toBeDefined()
            expect(enemy2.enemyId).toBeDefined()
            expect(enemy1.enemyId).not.toBe(enemy2.enemyId)
        })
    })

    describe('takeDamage', () => {
        it('should reduce health by damage amount', () => {
            const result = enemy.takeDamage(1)
            
            expect(enemy.health).toBe(2)
            expect(result).toBe(false) // Not destroyed
        })

        it('should destroy enemy when health reaches zero', () => {
            enemy.health = 1
            const result = enemy.takeDamage(1)
            
            expect(enemy.health).toBe(0)
            expect(result).toBe(true) // Destroyed
            expect(mockScene.tweens.add).toHaveBeenCalled()
        })

        it('should not take damage if already dead', () => {
            enemy.health = 0
            const result = enemy.takeDamage(1)
            
            expect(enemy.health).toBe(0)
            expect(result).toBe(false)
        })

        it('should trigger visual feedback', () => {
            enemy.takeDamage(1)
            
            expect(enemy.tint).toBe(0xff0000) // Red tint
            expect(mockScene.time.delayedCall).toHaveBeenCalled()
        })
    })

    describe('destroyEnemy', () => {
        it('should create destruction animation', () => {
            enemy.destroyEnemy()
            
            expect(mockScene.tweens.add).toHaveBeenCalledWith(
                expect.objectContaining({
                    targets: enemy,
                    scaleX: 0,
                    scaleY: 0,
                    alpha: 0,
                    duration: 200
                })
            )
        })

        it('should emit enemyDestroyed event', () => {
            enemy.destroyEnemy()
            
            expect(mockScene.events.emit).toHaveBeenCalledWith('enemyDestroyed', {
                enemyId: enemy.enemyId,
                enemyType: enemy.enemyType,
                position: { x: enemy.x, y: enemy.y }
            })
        })
    })

    describe('updateMovement', () => {
        it('should change direction after interval', () => {
            const initialDirection = enemy.moveDirection
            enemy.lastDirectionChange = 0
            
            enemy.updateMovement(3000) // 3 seconds later
            
            expect(enemy.moveDirection).toBe(-initialDirection)
        })

        it('should flip sprite based on movement direction', () => {
            enemy.moveDirection = -1
            enemy.updateMovement(0)
            
            expect(enemy.flipX).toBe(true)
        })
    })

    describe('getStatus', () => {
        it('should return complete enemy status', () => {
            const status = enemy.getStatus()
            
            expect(status).toEqual({
                id: enemy.enemyId,
                health: enemy.health,
                maxHealth: enemy.maxHealth,
                type: enemy.enemyType,
                position: { x: enemy.x, y: enemy.y },
                isAlive: true
            })
        })
    })

    describe('isAlive', () => {
        it('should return true when enemy has health', () => {
            expect(enemy.isAlive()).toBe(true)
        })

        it('should return false when enemy has no health', () => {
            enemy.health = 0
            expect(enemy.isAlive()).toBe(false)
        })
    })

    describe('getDamage', () => {
        it('should return enemy damage value', () => {
            expect(enemy.getDamage()).toBe(1)
        })
    })

    describe('flashRed', () => {
        it('should not flash if already flashing', () => {
            enemy.isFlashing = true
            const originalTint = enemy.tint
            
            enemy.flashRed()
            
            expect(enemy.tint).toBe(originalTint)
        })

        it('should set red tint and schedule return to normal', () => {
            enemy.flashRed()
            
            expect(enemy.tint).toBe(0xff0000)
            expect(enemy.isFlashing).toBe(true)
            expect(mockScene.time.delayedCall).toHaveBeenCalledWith(150, expect.any(Function))
        })
    })
})