import { describe, it, expect, beforeEach, vi } from 'vitest'
import BallInventory from './ballInventory'
import { ShootingSystem } from './shootingSystem'

// Mock scene for testing
const mockScene = {
    add: { existing: vi.fn() },
    physics: { 
        add: { 
            existing: vi.fn(),
            group: vi.fn(() => ({
                get: vi.fn(() => mockProjectile),
                destroy: vi.fn()
            }))
        },
        world: {
            bounds: { x: 0, y: 0, width: 800, height: 600 }
        }
    },
    time: {
        delayedCall: vi.fn()
    },
    events: {
        on: vi.fn(),
        off: vi.fn()
    }
}

// Mock projectile for testing
const mockProjectile = {
    setActive: vi.fn().mockReturnThis(),
    setVisible: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setScale: vi.fn().mockReturnThis(),
    setVelocityX: vi.fn().mockReturnThis(),
    setVelocityY: vi.fn().mockReturnThis(),
    setBounce: vi.fn().mockReturnThis(),
    setCollideWorldBounds: vi.fn().mockReturnThis(),
    setAngularVelocity: vi.fn().mockReturnThis(),
    clearTint: vi.fn().mockReturnThis(),
    body: {
        setSize: vi.fn(),
        setGravityY: vi.fn(),
        setDrag: vi.fn(),
        setMass: vi.fn(),
        setVelocity: vi.fn(),
        velocity: { x: 0, y: 0 }
    },
    active: true,
    x: 0,
    y: 0
}

// Create a simplified Player class for testing inventory and shooting integration
class TestPlayer {
    constructor(scene) {
        this.scene = scene
        this.ballInventory = new BallInventory(scene)
        this.shootingSystem = new ShootingSystem(scene)
        this.flipX = false // Default facing direction
        this.x = 100 // Default position
        this.y = 100
    }

    // Ball inventory access methods
    getInventory() {
        return this.ballInventory
    }

    addBall() {
        return this.ballInventory.addBall()
    }

    removeBall() {
        return this.ballInventory.removeBall()
    }

    getBallCount() {
        return this.ballInventory.getCount()
    }

    isInventoryFull() {
        return this.ballInventory.isFull()
    }

    isInventoryEmpty() {
        return this.ballInventory.isEmpty()
    }

    // Shooting system methods
    getShootingSystem() {
        return this.shootingSystem
    }

    shoot(options = {}) {
        // Check if player has ammunition (Requirement 2.2, 2.5)
        if (this.isInventoryEmpty()) {
            return null
        }

        // Attempt to fire projectile using shooting system (Requirement 2.1)
        const projectile = this.shootingSystem.fireFromPlayer(this, options)
        
        // If projectile was successfully created, consume ammunition (Requirement 2.2)
        if (projectile) {
            this.removeBall()
        }
        
        return projectile
    }

    canShoot() {
        return !this.isInventoryEmpty() && 
               this.shootingSystem.getActiveProjectileCount() < this.shootingSystem.maxProjectiles
    }

    getTrajectoryInfo(options = {}) {
        if (!this.canShoot()) {
            return null
        }
        
        const direction = this.flipX ? -1 : 1
        return this.shootingSystem.getTrajectoryInfo(direction, options)
    }
}

describe('Player - BallInventory Integration', () => {
    let player

    beforeEach(() => {
        vi.clearAllMocks()
        player = new TestPlayer(mockScene)
    })

    describe('Inventory Initialization', () => {
        it('should create a BallInventory instance during construction', () => {
            expect(player.ballInventory).toBeInstanceOf(BallInventory)
        })

        it('should initialize inventory with the scene reference', () => {
            expect(player.ballInventory.scene).toBe(mockScene)
        })

        it('should initialize inventory with default capacity', () => {
            expect(player.ballInventory.getMaxCapacity()).toBe(10)
        })
    })

    describe('Inventory Access Methods', () => {
        it('should provide access to the inventory instance', () => {
            const inventory = player.getInventory()
            expect(inventory).toBe(player.ballInventory)
            expect(inventory).toBeInstanceOf(BallInventory)
        })

        it('should allow adding balls through player methods', () => {
            const result = player.addBall()
            expect(result).toBe(true)
            expect(player.getBallCount()).toBe(1)
        })

        it('should allow removing balls through player methods', () => {
            player.addBall()
            const result = player.removeBall()
            expect(result).toBe(true)
            expect(player.getBallCount()).toBe(0)
        })

        it('should return current ball count', () => {
            expect(player.getBallCount()).toBe(0)
            player.addBall()
            expect(player.getBallCount()).toBe(1)
            player.addBall()
            expect(player.getBallCount()).toBe(2)
        })

        it('should check if inventory is full', () => {
            expect(player.isInventoryFull()).toBe(false)
            
            // Fill inventory to capacity
            for (let i = 0; i < 10; i++) {
                player.addBall()
            }
            
            expect(player.isInventoryFull()).toBe(true)
        })

        it('should check if inventory is empty', () => {
            expect(player.isInventoryEmpty()).toBe(true)
            player.addBall()
            expect(player.isInventoryEmpty()).toBe(false)
            player.removeBall()
            expect(player.isInventoryEmpty()).toBe(true)
        })
    })

    describe('Inventory State Management Integration', () => {
        it('should prevent adding balls when inventory is full', () => {
            // Fill inventory to capacity
            for (let i = 0; i < 10; i++) {
                expect(player.addBall()).toBe(true)
            }
            
            // Try to add one more ball
            expect(player.addBall()).toBe(false)
            expect(player.getBallCount()).toBe(10)
        })

        it('should prevent removing balls when inventory is empty', () => {
            expect(player.removeBall()).toBe(false)
            expect(player.getBallCount()).toBe(0)
        })

        it('should maintain inventory state consistency', () => {
            // Add some balls
            player.addBall()
            player.addBall()
            player.addBall()
            
            expect(player.getBallCount()).toBe(3)
            expect(player.isInventoryEmpty()).toBe(false)
            expect(player.isInventoryFull()).toBe(false)
            
            // Remove all balls
            player.removeBall()
            player.removeBall()
            player.removeBall()
            
            expect(player.getBallCount()).toBe(0)
            expect(player.isInventoryEmpty()).toBe(true)
            expect(player.isInventoryFull()).toBe(false)
        })
    })

    describe('Requirements Validation', () => {
        it('should satisfy requirement 1.1 - ball collection and inventory management', () => {
            // Player should be able to collect balls (add to inventory)
            expect(player.addBall()).toBe(true)
            expect(player.getBallCount()).toBe(1)
            
            // Should prevent collection when at capacity
            for (let i = 1; i < 10; i++) {
                player.addBall()
            }
            expect(player.addBall()).toBe(false) // Should fail when full
        })

        it('should satisfy requirement 1.3 - inventory integration with player', () => {
            // Player should have direct access to inventory operations
            expect(typeof player.addBall).toBe('function')
            expect(typeof player.removeBall).toBe('function')
            expect(typeof player.getBallCount).toBe('function')
            expect(typeof player.isInventoryFull).toBe('function')
            expect(typeof player.isInventoryEmpty).toBe('function')
            expect(typeof player.getInventory).toBe('function')
        })
    })
})

describe('Player - ShootingSystem Integration', () => {
    let player

    beforeEach(() => {
        vi.clearAllMocks()
        player = new TestPlayer(mockScene)
    })

    describe('Shooting System Initialization', () => {
        it('should create a ShootingSystem instance during construction', () => {
            expect(player.shootingSystem).toBeInstanceOf(ShootingSystem)
        })

        it('should initialize shooting system with the scene reference', () => {
            expect(player.shootingSystem.scene).toBe(mockScene)
        })

        it('should provide access to the shooting system instance', () => {
            const shootingSystem = player.getShootingSystem()
            expect(shootingSystem).toBe(player.shootingSystem)
            expect(shootingSystem).toBeInstanceOf(ShootingSystem)
        })
    })

    describe('Shooting Methods', () => {
        it('should have all required shooting methods', () => {
            expect(typeof player.shoot).toBe('function')
            expect(typeof player.canShoot).toBe('function')
            expect(typeof player.getTrajectoryInfo).toBe('function')
            expect(typeof player.getShootingSystem).toBe('function')
        })

        it('should prevent shooting when inventory is empty (Requirement 2.5)', () => {
            expect(player.isInventoryEmpty()).toBe(true)
            const projectile = player.shoot()
            expect(projectile).toBeNull()
        })

        it('should allow shooting when inventory has balls (Requirement 2.1)', () => {
            // Add ammunition
            player.addBall()
            expect(player.getBallCount()).toBe(1)
            
            // Should be able to shoot
            const projectile = player.shoot()
            expect(projectile).toBe(mockProjectile)
        })

        it('should decrease ammunition count when shooting (Requirement 2.2)', () => {
            // Add ammunition
            player.addBall()
            player.addBall()
            expect(player.getBallCount()).toBe(2)
            
            // Shoot once
            const projectile = player.shoot()
            expect(projectile).toBe(mockProjectile)
            expect(player.getBallCount()).toBe(1)
            
            // Shoot again
            const projectile2 = player.shoot()
            expect(projectile2).toBe(mockProjectile)
            expect(player.getBallCount()).toBe(0)
        })

        it('should not decrease ammunition if shooting fails', () => {
            // Add ammunition
            player.addBall()
            expect(player.getBallCount()).toBe(1)
            
            // Mock shooting system to return null (failure)
            vi.spyOn(player.shootingSystem, 'fireFromPlayer').mockReturnValue(null)
            
            // Attempt to shoot
            const projectile = player.shoot()
            expect(projectile).toBeNull()
            expect(player.getBallCount()).toBe(1) // Should not decrease
        })
    })

    describe('Shooting State Checks', () => {
        it('should correctly identify when player can shoot', () => {
            // Empty inventory - cannot shoot
            expect(player.canShoot()).toBe(false)
            
            // Add ammunition - can shoot
            player.addBall()
            expect(player.canShoot()).toBe(true)
            
            // Remove ammunition - cannot shoot
            player.removeBall()
            expect(player.canShoot()).toBe(false)
        })

        it('should consider projectile limits when checking if can shoot', () => {
            // Add ammunition
            player.addBall()
            
            // Mock shooting system to be at max projectiles
            vi.spyOn(player.shootingSystem, 'getActiveProjectileCount').mockReturnValue(5)
            player.shootingSystem.maxProjectiles = 5
            
            expect(player.canShoot()).toBe(false)
        })

        it('should provide trajectory info when can shoot', () => {
            // Add ammunition
            player.addBall()
            
            // Mock trajectory info
            const mockTrajectory = { velocityX: 600, velocityY: -200, angle: -30, direction: 1, speed: 632 }
            vi.spyOn(player.shootingSystem, 'getTrajectoryInfo').mockReturnValue(mockTrajectory)
            
            const trajectory = player.getTrajectoryInfo()
            expect(trajectory).toEqual(mockTrajectory)
        })

        it('should return null trajectory info when cannot shoot', () => {
            // Empty inventory
            expect(player.isInventoryEmpty()).toBe(true)
            
            const trajectory = player.getTrajectoryInfo()
            expect(trajectory).toBeNull()
        })
    })

    describe('Integration Requirements Validation', () => {
        it('should satisfy requirement 2.1 - fire projectile when shoot button pressed and has balls', () => {
            // Add ammunition
            player.addBall()
            
            // Spy on the shooting system method
            const spy = vi.spyOn(player.shootingSystem, 'fireFromPlayer').mockReturnValue(mockProjectile)
            
            // Should fire projectile
            const projectile = player.shoot()
            expect(projectile).toBe(mockProjectile)
            expect(spy).toHaveBeenCalledWith(player, {})
        })

        it('should satisfy requirement 2.2 - decrease ammunition count when ball is fired', () => {
            // Add multiple balls
            player.addBall()
            player.addBall()
            player.addBall()
            expect(player.getBallCount()).toBe(3)
            
            // Fire projectiles and verify count decreases
            player.shoot()
            expect(player.getBallCount()).toBe(2)
            
            player.shoot()
            expect(player.getBallCount()).toBe(1)
            
            player.shoot()
            expect(player.getBallCount()).toBe(0)
        })

        it('should satisfy requirement 2.5 - prevent shooting when no balls in inventory', () => {
            // Ensure inventory is empty
            expect(player.isInventoryEmpty()).toBe(true)
            
            // Spy on the shooting system method
            const spy = vi.spyOn(player.shootingSystem, 'fireFromPlayer')
            
            // Attempt to shoot
            const projectile = player.shoot()
            expect(projectile).toBeNull()
            
            // Verify shooting system was not called
            expect(spy).not.toHaveBeenCalled()
        })
    })

    describe('Shooting System Integration', () => {
        it('should pass player instance to shooting system when firing', () => {
            player.addBall()
            
            const spy = vi.spyOn(player.shootingSystem, 'fireFromPlayer')
            player.shoot()
            
            expect(spy).toHaveBeenCalledWith(player, {})
        })

        it('should pass options to shooting system when provided', () => {
            player.addBall()
            
            const options = { angle: -45, power: 1.5 }
            const spy = vi.spyOn(player.shootingSystem, 'fireFromPlayer')
            player.shoot(options)
            
            expect(spy).toHaveBeenCalledWith(player, options)
        })

        it('should use player direction for trajectory calculations', () => {
            player.addBall()
            
            // Test facing right (default)
            player.flipX = false
            const spy = vi.spyOn(player.shootingSystem, 'getTrajectoryInfo')
            player.getTrajectoryInfo()
            expect(spy).toHaveBeenCalledWith(1, {})
            
            // Test facing left
            player.flipX = true
            player.getTrajectoryInfo()
            expect(spy).toHaveBeenCalledWith(-1, {})
        })
    })
})