/**
 * BallInventory class manages the player's ball ammunition system
 * Handles capacity management and state tracking for collected balls
 */
export default class BallInventory {
    /**
     * Creates a new BallInventory instance
     * @param {Phaser.Scene} scene - Reference to the game scene
     * @param {number} maxCapacity - Maximum balls that can be carried (default: 10)
     */
    constructor(scene, maxCapacity = 10) {
        this.scene = scene
        this.maxCapacity = maxCapacity
        this.currentCount = 0
        this.lastCollected = 0 // Timestamp for rate limiting collection
    }

    /**
     * Adds a ball to the inventory
     * @returns {boolean} - True if ball was successfully added, false if inventory is full
     */
    addBall() {
        if (this.isFull()) {
            return false
        }
        
        this.currentCount++
        this.lastCollected = Date.now()
        return true
    }

    /**
     * Removes a ball from the inventory
     * @returns {boolean} - True if ball was successfully removed, false if inventory is empty
     */
    removeBall() {
        if (this.isEmpty()) {
            return false
        }
        
        this.currentCount--
        return true
    }

    /**
     * Gets the current ball count
     * @returns {number} - Current number of balls in inventory
     */
    getCount() {
        return this.currentCount
    }

    /**
     * Checks if the inventory is at maximum capacity
     * @returns {boolean} - True if inventory is full
     */
    isFull() {
        return this.currentCount >= this.maxCapacity
    }

    /**
     * Checks if the inventory is empty
     * @returns {boolean} - True if inventory has no balls
     */
    isEmpty() {
        return this.currentCount <= 0
    }

    /**
     * Gets the maximum capacity of the inventory
     * @returns {number} - Maximum capacity
     */
    getMaxCapacity() {
        return this.maxCapacity
    }

    /**
     * Gets the timestamp of the last collected ball
     * @returns {number} - Timestamp of last collection
     */
    getLastCollected() {
        return this.lastCollected
    }

    /**
     * Resets the inventory to empty state
     */
    reset() {
        this.currentCount = 0
        this.lastCollected = 0
    }
}