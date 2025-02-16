export default class CustomizationManager {
    constructor() {
        this.unlockables = {
            hats: [
                { id: 'hat1', name: 'Party Hat', price: 10, sprite: 'hat1', offset: { x: -5, y: -55 } }/*,
                { id: 'hat2', name: 'Crown', price: 25, sprite: 'hat2', offset: { x: 0, y: -15 } },
                { id: 'hat3', name: 'Wizard Hat', price: 50, sprite: 'hat3', offset: { x: 0, y: -25 } }*/
            ],
            trails: [
               /* { id: 'trail1', name: 'Sparkles', price: 15, particle: 'sparkle' },
                { id: 'trail2', name: 'Rainbow', price: 30, particle: 'rainbow' },*/
                { id: 'trail3', name: 'Stars', price: 45, particle: 'star' }
            ]
        }
        
        // Load saved unlocks from localStorage
        this.unlockedItems = JSON.parse(localStorage.getItem('unlockedItems')) || []
        this.equippedItems = JSON.parse(localStorage.getItem('equippedItems')) || { hat: 'hat1', trail: 'trail3' }
    }

    canAfford(item, coins) {
        return coins >= item.price
    }

    unlockItem(itemId, coins) {
        const item = this.findItem(itemId)
        if (item && this.canAfford(item, coins)) {
            this.unlockedItems.push(itemId)
            localStorage.setItem('unlockedItems', JSON.stringify(this.unlockedItems))
            return true
        }
        return false
    }

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

    findItem(itemId) {
        return [...this.unlockables.hats, ...this.unlockables.trails]
            .find(item => item.id === itemId)
    }

    getEquippedItems() {
        return this.equippedItems
    }

    isUnlocked(itemId) {
        return this.unlockedItems.includes(itemId)
    }
} 