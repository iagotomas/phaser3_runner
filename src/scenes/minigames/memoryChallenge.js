import { Scene } from 'phaser';

export default class MemoryChallenge extends Scene {

    constructor() {
        super('memory');
        this.cards = [];
        this.selectedCards = [];
        this.canSelect = true;
        this.gridSize = { rows: 3, cols: 4 }; // 3x4 grid
        this.cardSpacing = 20;
        this.cardWidth = 126;
        this.cardHeight = 182;
        this.cardBack = 'card_back';
        this.cornerRadius = 20;
    }

    create(data) {
        this.parentScene = data.parentScene;
        this.onComplete = data.onComplete;
        this.score = 0;
        this.timeLeft = 60; // 60 seconds to complete
        this.keys = this.parentScene.keys;

        // Start timer
        this.timerText = this.add.text(16, 16, `${this.timeLeft}s`, {
            fontSize: '32px',
            fill: '#fff'
        });
        this.timer = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });

        // Create the memory game
        this.createMemoryGame();
    }

    createMemoryGame() {
        const cardValues = [1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6]; // Pairs of cards
        Phaser.Utils.Array.Shuffle(cardValues);

        const startX = 10 + (this.scale.width - (this.gridSize.cols * (this.cardWidth + this.cardSpacing) - this.cardSpacing)) / 2;
        const startY = (this.scale.height - (this.gridSize.rows * (this.cardHeight + this.cardSpacing) - this.cardSpacing)) / 2;

        for (let row = 0; row < this.gridSize.rows; row++) {
            for (let col = 0; col < this.gridSize.cols; col++) {
                const cardValue = cardValues.pop();
                const x = startX + col * (this.cardWidth + this.cardSpacing);
                const y = startY + row * (this.cardHeight + this.cardSpacing);
                const cardContainer = this.add.container(x, y);

                const { graphics: cardBackGraphics, mask: cardBackMask } = this.createRoundedCard(this.cardWidth, this.cardHeight, 0x808080, 0x000000);
                const { graphics: cardFrontGraphics, mask: cardFrontMask } = this.createRoundedCard(this.cardWidth, this.cardHeight, 0xAAAAAA, 0x000000);
                cardFrontGraphics.setAlpha(0);
                cardContainer.setData('cardFront', cardFrontGraphics);
                cardContainer.setData('cardBack', cardBackGraphics);

                const card = this.add.sprite(0, 0, 'memory', `card_back`)
                    .setScale(0.7)
                    .setInteractive()
                    .setData('value', cardValue)
                    .setData('flipped', false)
                    .setData('row', row)
                    .setData('col', col)
                    .on('pointerdown', () => this.flipCard(cardContainer));
                cardContainer.add([cardBackGraphics, cardFrontGraphics, card]);
                this.cards.push(cardContainer);
            }
        }
    }

    createRoundedCard(width, height, fillColor, borderColor) {
        const graphics = this.add.graphics();
        const cardWidth = width * 0.7
        const cardHeight = height * 0.7
        const borderThickness = 4;

        // Draw the border (slightly larger rounded rectangle)
        graphics.fillStyle(borderColor, 1);
        graphics.fillRoundedRect(-cardWidth / 2 - borderThickness, -cardHeight / 2 - borderThickness, cardWidth + 2 * borderThickness, cardHeight + 2 * borderThickness, this.cornerRadius);

        // Draw the card background
        graphics.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, this.cornerRadius);

        // Create a mask from the graphics
        const mask = new Phaser.Display.Masks.GeometryMask(this, graphics);
        return { graphics, mask }
    }

    flipCard(card) {
        if (!this.canSelect || card.getData('flipped') || this.selectedCards.length >= 2) {
            return;
        }
        const cardFront = card.getData('cardFront');
        const cardBack = card.getData('cardBack');
        const cardSprite = card.getAt(2);
        this.canSelect = false;
        card.setData('flipped', true);
        this.tweens.add({
            targets: cardFront, // Now targets the graphics
            alpha: 1,
            duration: 200,
            ease: 'Linear',
            onStart: () => {
                cardSprite.setFrame(`card_${cardSprite.getData('value').toString().padStart(2, '0')}`);
            },
            onComplete: () => {
                this.tweens.add({
                    targets: cardBack, // Now targets the graphics
                    alpha: 0,
                    duration: 200,
                    ease: 'Linear',
                    onComplete: () => {
                        this.selectedCards.push(card);
                        if (this.selectedCards.length === 2) {
                            this.checkMatch();
                        } else {
                            this.canSelect = true;
                        }
                    }
                });
            }
        });
    }

    checkMatch() {
        const [card1, card2] = this.selectedCards;
        const cardSprite1 = card1.getAt(2);
        const cardSprite2 = card2.getAt(2);
        if (cardSprite1.getData('value') === cardSprite2.getData('value')) {
            this.score += 10;
            this.cards = this.cards.filter(c => c !== card1 && c !== card2);

            this.tweens.add({
                targets: [card1, card2],
                alpha: 0,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    card1.destroy();
                    card2.destroy();
                    if (this.cards.length === 0) {
                        this.endGame(true);
                    }
                    this.canSelect = true;
                }
            });

        } else {
            this.canSelect = false;
            this.time.delayedCall(1000, () => {
                this.flipBack(card1);
                this.flipBack(card2);
                this.canSelect = true;
            });
        }
        this.selectedCards = [];
    }

    flipBack(card) {
        const cardFront = card.getData('cardFront');
        const cardBack = card.getData('cardBack');
        const cardSprite = card.getAt(2);
        card.setData('flipped', false);
        this.tweens.add({
            targets: cardFront, // Now targets the graphics
            alpha: 0,
            duration: 200,
            ease: 'Linear',
            onStart: () => {
                cardSprite.setFrame(`card_back`);
            },
            onComplete: () => {
                this.tweens.add({
                    targets: cardBack, // Now targets the graphics
                    alpha: 1,
                    duration: 200,
                    ease: 'Linear',
                });
                cardSprite.setFrame(`card_back`);
            }
        });
    }

    updateTimer() {
        this.timeLeft--;
        this.timerText.setText(`${this.timeLeft}s`);

        if (this.timeLeft <= 0) {
            this.endGame(false);
        }
    }

    endGame(success) {
        // Stop the timer
        this.timer.remove();

        // Calculate final score based on remaining time
        const finalScore = success ? this.score + this.timeLeft * 5 : 0;

        // Show end game text
        const resultText = success ? 'Success!' : 'Time\'s Up!';
        this.add.text(this.scale.width / 2, this.scale.height / 2, resultText, {
            fontSize: '48px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Return to main game after delay
        this.time.delayedCall(2000, () => {
            this.onComplete(finalScore);
            this.scene.stop();
        });
    }
}
