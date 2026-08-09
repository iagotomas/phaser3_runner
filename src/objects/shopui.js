import Phaser from 'phaser';

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
        this.itemContainer = this;
        this.currentPage = 0;
        this.itemsPerPage = 4;
        this.createUI();
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
        this.removeAll(true);
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

        const items = this.scene.player.customization.unlockables.hats;
        const pageCount = Math.max(1, Math.ceil(items.length / this.itemsPerPage));
        this.currentPage = Math.min(this.currentPage, pageCount - 1);
        const pageItems = items.slice(
            this.currentPage * this.itemsPerPage,
            (this.currentPage + 1) * this.itemsPerPage
        );
        const boxPositions = [
            { x: 260, y: 475 },
            { x: 410, y: 475 },
            { x: 565, y: 475 },
            { x: 720, y: 475 }
        ];

        // Create item buttons
        pageItems.forEach((item, index) => {
            const itemButton = this.createItemButton(item, scale);
            itemButton.setPosition(
                width / 2 + (boxPositions[index].x - shopBg.width / 2) * scale,
                height / 2 + (boxPositions[index].y - shopBg.height / 2) * scale
            );
            this.add(itemButton);
        });

        const navigationY = height / 2 + 315 * scale;
        const pageText = this.scene.add.text(width / 2, navigationY, `${this.currentPage + 1} / ${pageCount}`, {
            fontSize: '28px',
            fontFamily: 'Coming Soon',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0);
        this.add(pageText);

        if (this.currentPage > 0) {
            this.addPageButton(width / 2 - 150 * scale, navigationY, '<', () => {
                this.currentPage -= 1;
                this.refreshPage();
            });
        }
        if (this.currentPage < pageCount - 1) {
            this.addPageButton(width / 2 + 150 * scale, navigationY, '>', () => {
                this.currentPage += 1;
                this.refreshPage();
            });
        }

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
        const wasVisible = this.visible;
        this.createUI();
        if (wasVisible) {
            this.setVisible(true);
        }
    }

    refreshPage() {
        const wasVisible = this.visible;
        this.createUI();
        this.setVisible(wasVisible);
    }

    addPageButton(x, y, label, onClick) {
        const button = this.scene.add.text(x, y, label, {
            fontSize: '42px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#6d3d21',
            padding: { x: 16, y: 4 },
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0).setInteractive({ useHandCursor: true });
        button.on('pointerdown', onClick);
        button.on('pointerover', () => button.setTint(0xffffaa));
        button.on('pointerout', () => button.clearTint());
        this.add(button);
    }

    /**
     * Creates an item button for the shop.
     * @param {Object} item - The item to create a button for
     * @returns {Phaser.GameObjects.Container} The container holding the item button
     */
    createItemButton(item, shopScale = 1) {
        const itemContainer = this.scene.add.container();
        const previewSize = Math.max(58, Math.round(96 * shopScale));
        
        const buttonBg = this.scene.add.rectangle(5, 10, 80, 60, 0xffffff, 0)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.purchaseItem(item));
        
        const preview = this.scene.add.image(5, 10, item.sprite || item.id)
            .setDisplaySize(previewSize, previewSize);
        
        const text = this.scene.add.text(5, -85, 
            this.scene.player.customization.isUnlocked(item.id) ? 'Owned' : `${item.price} ��`, 
            { 
                fontSize: `${Math.max(20, Math.round(32 * shopScale))}px`,
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