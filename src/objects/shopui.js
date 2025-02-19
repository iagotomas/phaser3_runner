export default class ShopUI extends Phaser.GameObjects.Container {
    constructor(scene, x = 0, y = 0) {
        super(scene, x, y);
        this.visible = false;
        scene.add.existing(this);
        this.setDepth(1000);
        this.createUI();
    }

    createUI() {
        // Remove existing children if any
        this.removeAll(true);
        
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Semi-transparent dark overlay - now with click handler
        const overlay = this.scene.add.rectangle(width/2, height/2, width, height, 0x000000, 0.7)
            .setInteractive()
            .setScrollFactor(0)
            .on('pointerdown', () => this.close()); // Close when clicking overlay
        this.add(overlay);
        
        // Add shop background image
        const shopBg = this.scene.add.image(width/2, height/2, 'shopbg')
            .setScrollFactor(0)
            .setInteractive() // Make shop background interactive
            .on('pointerdown', (pointer, x, y, event) => {
                event.stopPropagation(); // Prevent click from reaching overlay
            });
        
        // Scale the background
        const scale = Math.min(
            (width * 0.8) / shopBg.width,
            (height * 0.8) / shopBg.height
        );
        shopBg.setScale(scale);
        this.add(shopBg);
        
        // Calculate item positions
        const shelfTop = height - (shopBg.displayHeight * 0.46);
        const itemSpacing = shopBg.displayWidth * 0.16;
        const startX = width/2 - (itemSpacing * 1.45);
        
        // Create item buttons
        this.scene.player.customization.unlockables.hats.forEach((item, index) => {
            const x = startX + (itemSpacing * index);
            const y = shelfTop;
            
            const itemContainer = this.scene.add.container(x, y);
            
            const buttonBg = this.scene.add.rectangle(5, -5, 80, 60, 0xffffff)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.purchaseItem(item))
                .on('pointerover', () => buttonBg.setFillStyle(0x666666))
                .on('pointerout', () => buttonBg.setFillStyle(0x444444));
            
            const preview = this.scene.add.image(0, 0, item.id)
                .setScale(0.5);
            
            const text = this.scene.add.text(5, -85, 
                this.scene.player.customization.isUnlocked(item.id) ? 'Owned' : `${item.price} 🪙`, 
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
            this.add(itemContainer);
        });

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

    close() {
        this.setVisible(false);
        this.visible = false;
        this.scene.input.keyboard.enabled = true;
        this.scene.physics.resume();
    }

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

    handleResize() {
        this.createUI();
        if (this.visible) {
            this.setVisible(true);
        }
    }
} 