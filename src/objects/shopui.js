/**
 * ShopUI class represents the user interface for the shop in the game.
 * It handles the creation and management of the shop UI elements,
 * including item buttons and their interactions.
 */
export default class ShopUI extends Phaser.GameObjects.Container {
    /**
     * Create a shop ui
     * @param {Phaser.Scene} scene - Parent scene
     * @param {number} x - Origin x position, defaults to 0
     * @param {number} y - Origin y position, defaults to 0
     */
    constructor(scene, x = 0, y = 0) {
        super(scene, x, y);
        this.scene = scene;
        this.visible = false;
        this.itemContainer = this.scene.add.container(); // New container for items
        this.createUI();
        this.itemContainer.setDepth(1001);
        this.setDepth(1000);
        scene.add.existing(this);
    }

    /**
     * Creates the UI elements for the shop, including the overlay,
     * background image, item container, and item buttons.
     */
    createUI() {
        // Remove existing children if any
        //this.removeAll(true);
        this.itemContainer.removeAll(true);
        this.add(this.itemContainer); // Add item container to the ShopUI
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Semi-transparent dark overlay
        const overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
            .setInteractive()
            .setScrollFactor(0)
            .on('pointerdown', () => this.close());
        this.add(overlay);
        
        // Add shop background image
        const shopBg = this.scene.add.image(width / 2, height / 2, 'shopbg')
            .setScrollFactor(0)
            .setInteractive()
            .on('pointerdown', (pointer, x, y, event) => {
                event.stopPropagation();
            });
        
        // Scale the background
        const scale = Math.min(
            (width * 0.8) / shopBg.width,
            (height * 0.8) / shopBg.height
        );
        shopBg.setScale(scale);
        this.add(shopBg);

        
        // Calculate item positions considering the scale
        const shelfTop = height - (shopBg.displayHeight * 0.46 * scale); // Adjusted for scale
        const itemSpacing = (shopBg.displayWidth) * 0.16 * scale; // Adjusted for scale
        const startX = scale * width / 2 - (itemSpacing * 1.45);
        
        // Create a mask for the item container to show only 4 items
        const mask = this.scene.add.graphics();
        mask.fillStyle(0xffffff);
        mask.fillRect(0, 0, width * 0.8, height * 0.5);
        this.itemContainer.setMask(new Phaser.Display.Masks.GeometryMask(this.scene, mask));

        // Position the item container
        this.itemContainer.setPosition(width / 2, shelfTop); // Position above the shelf
        //this.itemContainer.setScrollFactor(0);
        this.itemContainer.setVisible(true);
        
        const debugRect = this.scene.add.rectangle(width / 2, shelfTop,width,height,0xffffff,0.5);
        debugRect.setScrollFactor(0);
        debugRect.setDepth(1002);
        debugRect.setVisible(true);
        this.itemContainer.add(debugRect);
        // Create item buttons
        this.scene.player.customization.unlockables.hats.forEach((item, index) => {
            const x = startX + (index % 4) * (80 + 10); // Adjusted for scale
            const y = Math.floor(index / 4) * (60 + 10); // Adjusted for scale
            
            const itemButton = this.createItemButton(item);
            itemButton.setPosition(x, y);
            this.itemContainer.add(itemButton);
        });

        // Debugging: Log the number of items added
        console.log(`Number of items added: ${this.itemContainer.list.length}`);

        // Set initial visibility
        this.setVisible(false);
        
        // Ensure all children ignore scroll
        this.each(child => {
            child.setScrollFactor(0);
            if (child.input) {
                child.removeInteractive();
                child.setInteractive();
            }
        });

        // Ensure itemContainer is visible
        this.itemContainer.setVisible(true);
        
        // Log position and number of items
        console.log(`ItemContainer Position: (${this.itemContainer.x}, ${this.itemContainer.y})`);
        console.log(`Number of items in itemContainer: ${this.itemContainer.list.length}`);
    }

    /**
     * Opens the shop UI, making it visible and pausing the game physics.
     */
    open() {
        this.setVisible(true);
        this.visible = true;
        this.scene.input.keyboard.enabled = false;
        if (this.scene.moveTarget) {
            this.scene.moveTarget = null;
            this.scene.player.setVelocityX(0);
        }
        this.scene.physics.pause();
    }

    /**
     * Closes the shop UI, hiding it and resuming the game physics.
     */
    close() {
        this.setVisible(false);
        this.visible = false;
        this.scene.input.keyboard.enabled = true;
        this.scene.physics.resume();
    }

    /**
     * Purchases an item from the shop.
     * @param {Object} item - The item to purchase
     */
    purchaseItem(item) {
        const { player } = this.scene;
        if (player.customization.isUnlocked(item.id)) {
            console.log('Equipping:', item.name);
            player.customization.equipItem(item.id);
            player.applyCosmetics();
        } else if (player.customization.unlockItem(item.id, this.scene.coinScore)) {
            console.log('Purchasing:', item.name);
            this.scene.updateScore(this.scene.coinScore - item.price);
            player.customization.equipItem(item.id);
            player.applyCosmetics();
            
            // Refresh the shop UI
            this.createUI();
            this.setVisible(true);
        } else {
            console.log('Cannot afford:', item.name);
        }
    }

    /**
     * Handles the resizing of the shop UI, updating its layout.
     */
    handleResize() {
        this.createUI();
        if (this.visible) {
            this.setVisible(true);
        }
    }

    /**
     * Creates an item button for the shop.
     * @param {Object} item - The item to create a button for
     * @returns {Phaser.GameObjects.Container} The container holding the item button
     */
    createItemButton(item) {
        const itemContainer = this.scene.add.container();
        
        const buttonBg = this.scene.add.rectangle(5, -5, 80, 60, 0xffffff)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.purchaseItem(item))
            .on('pointerover', () => buttonBg.setFillStyle(0x666666))
            .on('pointerout', () => buttonBg.setFillStyle(0x444444));
        
        const preview = this.scene.add.image(0, 0, item.id)
            .setScale(0.5);
        
        const text = this.scene.add.text(5, -85, 
            this.scene.player.customization.isUnlocked(item.id) ? 'Owned' : `${item.price} ��`, 
            { 
                fontSize: '32px',
                fontFamily: 'Coming Soon',
                align: 'center',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);
        
        itemContainer.add([buttonBg, preview, text]);
        return itemContainer;
    }
} 