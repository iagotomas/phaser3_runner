/**
 * CustomizationManager handles the management of unlockable items such as hats and trails.
 * It allows for unlocking items, equipping them, and storing the state in localStorage.
 */
export default class CustomizationManager {
    constructor() {
        this.unlockables = {
            hats: [
                { id: 'hat1', name: 'Party Hat', price: 10, sprite: 'hat1', offset: { x: -5, y: -90 }, rotation: 0 },
                { id: 'hat2', name: 'Crown', price: 25, sprite: 'hat2', offset: { x: 0, y: -80 }, rotation: 0 },
                { id: 'hat3', name: 'Cowboy', price: 50, sprite: 'hat3', offset: { x: 0, y: -60 }, rotation: 0 },
                { id: 'hat4', name: 'Princess crown', price: 15, sprite: 'hat4', offset: { x: 0, y: -60 }, rotation: 0 },
                { id: 'hat5', name: 'Pirate', price: 100, sprite: 'hat5', offset: { x: -10, y: -100 }, rotation: 0 },
                { id: 'hat6', name: 'Tall hat', price: 1, sprite: 'hat6', offset: { x: 0, y: 0 }, rotation: 0 }
            ],
            trails: [
               /* { id: 'trail1', name: 'Sparkles', price: 15, particle: 'sparkle' },
                { id: 'trail2', name: 'Rainbow', price: 30, particle: 'rainbow' },*/
                { id: 'trail3', name: 'Stars', price: 45, particle: 'star' }
            ]
        }
        
        // Load saved unlocks from localStorage
        /**
         * Loads the unlocked items and equipped items from localStorage.
         * @type {Array}    
         * @private
         */
        this.unlockedItems = JSON.parse(localStorage.getItem('unlockedItems')) || []
        /**
         * Loads the equipped items from localStorage.
         * @type {Object}
         * @private
         */
        this.equippedItems = JSON.parse(localStorage.getItem('equippedItems')) || { hat: 'hat3', trail: 'trail3' }
    }

    /**
     * Checks if the player can afford an item based on their current coins.
     * @param {Object} item - The item to check.
     * @param {number} coins - The amount of coins the player has.
     * @returns {boolean} - True if the player can afford the item, false otherwise.
     */
    canAfford(item, coins) {
        return coins >= item.price
    }

    /**
     * Unlocks an item if the player can afford it and adds it to the unlocked items.
     * @param {string} itemId - The ID of the item to unlock.
     * @param {number} coins - The amount of coins the player has.
     * @returns {boolean} - True if the item was successfully unlocked, false otherwise.
     */
    unlockItem(itemId, coins) {
        const item = this.findItem(itemId)
        if (item && this.canAfford(item, coins)) {
            this.unlockedItems.push(itemId)
            localStorage.setItem('unlockedItems', JSON.stringify(this.unlockedItems))
            return true
        }
        return false
    }

    /**
     * Equips an item if it is unlocked and updates the equipped items in localStorage.
     * @param {string} itemId - The ID of the item to equip.
     * @returns {boolean} - True if the item was successfully equipped, false otherwise.
     */
    equipItem(itemId) {
        const item = this.findItem(itemId)
        if (item && this.unlockedItems.includes(itemId)) {
            if (item.sprite) { // Hat
                this.equippedItems.hat = itemId
            } else if (item.particle) { // Trail
                this.equippedItems.trail = itemId
            }
            localStorage.setItem('equippedItems', JSON.stringify(this.equippedItems))
            return true
        }
        return false
    }

    /**
     * Finds an item by its ID from the list of unlockable items.
     * @param {string} itemId - The ID of the item to find.
     * @returns {Object|null} - The found item or null if not found.
     */
    findItem(itemId) {
        return [...this.unlockables.hats, ...this.unlockables.trails]
            .find(item => item.id === itemId)
    }

    /**
     * Retrieves the currently equipped items.
     * @returns {Object} - The equipped items.
     */
    getEquippedItems() {
        return this.equippedItems
    }

    /**
     * Checks if an item is unlocked.
     * @param {string} itemId - The ID of the item to check.
     * @returns {boolean} - True if the item is unlocked, false otherwise.
     */
    isUnlocked(itemId) {
        return this.unlockedItems.includes(itemId)
    }
} 