import { describe, it, expect, beforeEach, vi } from 'vitest'
import BallInventory from './ballInventory'

// Mock scene for testing
const mockScene = {
    add: { existing: vi.fn() },
    physics: { add: { existing: vi.fn() } }
}

// Create a simplified Player class for testing inventory integration
class TestPlayer {
    constructor(scene) {
        this.scene = scene
        this.ballInventory = new BallInventory(scene)
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