import { describe, it, expect, beforeEach, vi } from 'vitest'
import BallInventory from './ballInventory.js'

describe('BallInventory', () => {
    let mockScene
    let inventory

    beforeEach(() => {
        // Mock Phaser scene
        mockScene = {
            add: { existing: vi.fn() },
            physics: { add: { existing: vi.fn() } }
        }
        
        // Create fresh inventory for each test
        inventory = new BallInventory(mockScene)
    })

    describe('Constructor', () => {
        it('should initialize with default values', () => {
            expect(inventory.scene).toBe(mockScene)
            expect(inventory.maxCapacity).toBe(10)
            expect(inventory.currentCount).toBe(0)
            expect(inventory.lastCollected).toBe(0)
        })

        it('should accept custom max capacity', () => {
            const customInventory = new BallInventory(mockScene, 5)
            expect(customInventory.maxCapacity).toBe(5)
        })
    })

    describe('addBall()', () => {
        it('should add a ball when inventory is not full', () => {
            const result = inventory.addBall()
            
            expect(result).toBe(true)
            expect(inventory.currentCount).toBe(1)
            expect(inventory.lastCollected).toBeGreaterThan(0)
        })

        it('should not add a ball when inventory is full', () => {
            // Fill inventory to capacity
            for (let i = 0; i < 10; i++) {
                inventory.addBall()
            }
            
            const result = inventory.addBall()
            
            expect(result).toBe(false)
            expect(inventory.currentCount).toBe(10)
        })

        it('should update lastCollected timestamp', () => {
            const beforeTime = Date.now()
            inventory.addBall()
            const afterTime = Date.now()
            
            expect(inventory.lastCollected).toBeGreaterThanOrEqual(beforeTime)
            expect(inventory.lastCollected).toBeLessThanOrEqual(afterTime)
        })
    })

    describe('removeBall()', () => {
        it('should remove a ball when inventory is not empty', () => {
            inventory.addBall()
            
            const result = inventory.removeBall()
            
            expect(result).toBe(true)
            expect(inventory.currentCount).toBe(0)
        })

        it('should not remove a ball when inventory is empty', () => {
            const result = inventory.removeBall()
            
            expect(result).toBe(false)
            expect(inventory.currentCount).toBe(0)
        })

        it('should handle multiple removals correctly', () => {
            // Add 3 balls
            inventory.addBall()
            inventory.addBall()
            inventory.addBall()
            
            // Remove 2 balls
            expect(inventory.removeBall()).toBe(true)
            expect(inventory.currentCount).toBe(2)
            
            expect(inventory.removeBall()).toBe(true)
            expect(inventory.currentCount).toBe(1)
        })
    })

    describe('getCount()', () => {
        it('should return current ball count', () => {
            expect(inventory.getCount()).toBe(0)
            
            inventory.addBall()
            expect(inventory.getCount()).toBe(1)
            
            inventory.addBall()
            expect(inventory.getCount()).toBe(2)
        })
    })

    describe('isFull()', () => {
        it('should return false when inventory is not full', () => {
            expect(inventory.isFull()).toBe(false)
            
            inventory.addBall()
            expect(inventory.isFull()).toBe(false)
        })

        it('should return true when inventory is at capacity', () => {
            // Fill inventory to capacity
            for (let i = 0; i < 10; i++) {
                inventory.addBall()
            }
            
            expect(inventory.isFull()).toBe(true)
        })

        it('should work with custom capacity', () => {
            const smallInventory = new BallInventory(mockScene, 2)
            
            expect(smallInventory.isFull()).toBe(false)
            
            smallInventory.addBall()
            expect(smallInventory.isFull()).toBe(false)
            
            smallInventory.addBall()
            expect(smallInventory.isFull()).toBe(true)
        })
    })

    describe('isEmpty()', () => {
        it('should return true when inventory is empty', () => {
            expect(inventory.isEmpty()).toBe(true)
        })

        it('should return false when inventory has balls', () => {
            inventory.addBall()
            expect(inventory.isEmpty()).toBe(false)
        })

        it('should return true after removing all balls', () => {
            inventory.addBall()
            inventory.removeBall()
            expect(inventory.isEmpty()).toBe(true)
        })
    })

    describe('getMaxCapacity()', () => {
        it('should return the maximum capacity', () => {
            expect(inventory.getMaxCapacity()).toBe(10)
            
            const customInventory = new BallInventory(mockScene, 15)
            expect(customInventory.getMaxCapacity()).toBe(15)
        })
    })

    describe('getLastCollected()', () => {
        it('should return 0 initially', () => {
            expect(inventory.getLastCollected()).toBe(0)
        })

        it('should return timestamp after adding a ball', () => {
            inventory.addBall()
            expect(inventory.getLastCollected()).toBeGreaterThan(0)
        })
    })

    describe('reset()', () => {
        it('should reset inventory to empty state', () => {
            // Add some balls
            inventory.addBall()
            inventory.addBall()
            inventory.addBall()
            
            // Reset
            inventory.reset()
            
            expect(inventory.currentCount).toBe(0)
            expect(inventory.lastCollected).toBe(0)
            expect(inventory.isEmpty()).toBe(true)
            expect(inventory.isFull()).toBe(false)
        })
    })

    describe('Capacity limits', () => {
        it('should enforce capacity limits correctly', () => {
            const smallInventory = new BallInventory(mockScene, 3)
            
            // Add balls up to capacity
            expect(smallInventory.addBall()).toBe(true) // 1
            expect(smallInventory.addBall()).toBe(true) // 2
            expect(smallInventory.addBall()).toBe(true) // 3
            
            // Should not be able to add more
            expect(smallInventory.addBall()).toBe(false)
            expect(smallInventory.getCount()).toBe(3)
            expect(smallInventory.isFull()).toBe(true)
        })

        it('should handle edge case of zero capacity', () => {
            const zeroInventory = new BallInventory(mockScene, 0)
            
            expect(zeroInventory.isFull()).toBe(true)
            expect(zeroInventory.addBall()).toBe(false)
            expect(zeroInventory.getCount()).toBe(0)
        })
    })

    describe('State tracking', () => {
        it('should maintain consistent state during operations', () => {
            // Test sequence of operations
            expect(inventory.isEmpty()).toBe(true)
            expect(inventory.isFull()).toBe(false)
            expect(inventory.getCount()).toBe(0)
            
            // Add balls
            inventory.addBall()
            inventory.addBall()
            
            expect(inventory.isEmpty()).toBe(false)
            expect(inventory.isFull()).toBe(false)
            expect(inventory.getCount()).toBe(2)
            
            // Remove one ball
            inventory.removeBall()
            
            expect(inventory.isEmpty()).toBe(false)
            expect(inventory.isFull()).toBe(false)
            expect(inventory.getCount()).toBe(1)
            
            // Remove last ball
            inventory.removeBall()
            
            expect(inventory.isEmpty()).toBe(true)
            expect(inventory.isFull()).toBe(false)
            expect(inventory.getCount()).toBe(0)
        })
    })
})