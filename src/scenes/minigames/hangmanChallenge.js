import { Scene } from 'phaser';
import { hangmanWords } from './hangmanWords.js';

const fontFamily = 'Tahoma, sans-serif'
/**
 * Hangman scene class for the Phaser 3 game.  This minigame presents a classic hangman game to the player.
 */
export default class HangmanChallenge extends Scene {
    /**
     * Constructor for the Hangman scene.  Initializes game variables.
     */
    constructor() {
        super('hangman'); // Scene key for referencing this scene
        this.word = '';          // The word to be guessed.
        this.guessedLetters = [];// Array to store letters guessed by the player.
        this.incorrectGuesses = 0;// Number of incorrect guesses made.
        this.maxIncorrectGuesses = 7;// Maximum allowed incorrect guesses.
        this.onComplete = null;   // Callback function to be executed when the game ends.
        this.parentScene = null;  // Reference to the parent scene (main game scene).
        this.isSmallDevice = true; // Flag to check if the game is played on a small device.
    }

    /**
     * Creates the Hangman game elements and initializes the game state.
     * @param {object} data - Data passed from the parent scene.
     * @param {Scene} data.parentScene - Reference to the parent scene.
     * @param {function} data.onComplete - Callback function executed on game completion.
     */
    create(data) {
        this.word = '';         
        this.guessedLetters = [];
        this.incorrectGuesses = 0;
        this.parentScene = data.parentScene;
        this.onComplete = data.onComplete;
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Responsive: detect small device
        this.isSmallDevice = Math.min(width, height) < 700;
        console.log(`Hangman Challenge: width = ${width}, height = ${height}`);
        this.letterFontSize = this.isSmallDevice ? 82 : 42;
        this.wordFontSize = this.isSmallDevice ? 94 : 42;
        this.guessedFontSize = this.isSmallDevice ? 64 : 32;

        // Semi-transparent dark overlay
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
            .setScrollFactor(0);

        // Hangman image position
        let hangmanX = width / 2;
        let hangmanY = height / 2;
        this.hangmanImage = this.add.image(hangmanX, hangmanY, `hangman-0${this.incorrectGuesses + 1}`).setOrigin(0.5);

        // Select a random word from the externalized word list
        this.word = hangmanWords[Math.floor(Math.random() * hangmanWords.length)].toUpperCase();

        // Add text elements to display the word, guessed letters, and game result.
        let wordY = this.isSmallDevice ? height - 120 : this.scale.height - 200;
        this.wordDisplay = this.add.text(width / 2, wordY, this.getWordDisplay(), {
            fontSize: `${this.wordFontSize}px`,
            fontFamily: fontFamily,
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 20, y: 5 }
        }).setOrigin(0.5);

        let guessedY = this.isSmallDevice ? 40 : 100;
        this.guessedLettersDisplay = this.add.text(width / 2, guessedY, '', {
            fontSize: `${this.guessedFontSize}px`,
            fontFamily: fontFamily,
            fill: '#000'
        }).setOrigin(0.5);

        // Listen for keyboard input events.
        this.input.keyboard.on('keydown', this.handleKeyInput, this);

        // Create on-screen keyboard layout for easier mobile play.
        this.keyboardButtons = [];
        this.keyboardLayout();

        // Responsive: redraw keyboard on resize
        this.scale.on('resize', this.handleResize, this);
    }

    handleResize() {
        // Remove old keyboard buttons
        if (this.keyboardButtons && this.keyboardButtons.length) {
            this.keyboardButtons.forEach(btn => btn.destroy());
            this.keyboardButtons = [];
        }
        // Recalculate device type and font sizes
        const width = this.parentScene.cameras.main.width;
        const height = this.parentScene.cameras.main.height;
        this.isSmallDevice = Math.min(width, height) < 1000;
        this.letterFontSize = this.isSmallDevice ? 82 : 42;
        this.wordFontSize = this.isSmallDevice ? 94 : 42;
        this.guessedFontSize = this.isSmallDevice ? 64 : 32;
        // Reposition word and guessed letters
        let wordY = this.isSmallDevice ? height - 120 : height - 200;
        this.wordDisplay.setFontSize(this.wordFontSize + 'px').setPosition(width / 2, wordY);
        let guessedY = this.isSmallDevice ? 40 : 100;
        this.guessedLettersDisplay.setFontSize(this.guessedFontSize + 'px').setPosition(width / 2, guessedY);
        // Redraw keyboard
        this.keyboardLayout();
    
    }

    /**
     * Creates the on-screen keyboard layout for letter selection.
     */
    keyboardLayout() {
        const keys = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        // Remove old keyboard buttons if any
        if (!this.keyboardButtons) this.keyboardButtons = [];
        this.keyboardButtons.forEach(btn => btn.destroy());
        this.keyboardButtons = [];

        if (this.isSmallDevice) {
            // Two columns, 13 letters each
            const leftKeys = keys.slice(0, 13).split("");
            const rightKeys = keys.slice(13).split("");
            const blockPadding = 10;
            const keyHeight = 48;
            const keyWidth = 80;
            const blockYStart = this.scale.height / 2 - (13 * (keyHeight + blockPadding)) / 2;
            const leftX = this.scale.width * 0.18;
            const rightX = this.scale.width * 0.82;
            // Left block
            for (let i = 0; i < leftKeys.length; i++) {
                const y = blockYStart + i * (keyHeight + blockPadding);
                const letterButton = this.add.text(leftX, y, leftKeys[i], {
                    fontSize: `${this.letterFontSize}px`,
                    fontFamily: fontFamily,
                    fill: '#fff',
                    backgroundColor: '#000',
                    padding: { x: 24, y: 8 }
                }).setOrigin(0.5)
                  .setInteractive()
                  .on('pointerup', () => { this.guessLetter(leftKeys[i]); letterButton.disableInteractive(); letterButton.setVisible(false); });
                this.keyboardButtons.push(letterButton);
            }
            // Right block
            for (let i = 0; i < rightKeys.length; i++) {
                const y = blockYStart + i * (keyHeight + blockPadding);
                const letterButton = this.add.text(rightX, y, rightKeys[i], {
                    fontSize: `${this.letterFontSize}px`,
                    fontFamily: fontFamily,
                    fill: '#fff',
                    backgroundColor: '#000',
                    padding: { x: 24, y: 8 }
                }).setOrigin(0.5)
                  .setInteractive()
                  .on('pointerup', () => { this.guessLetter(rightKeys[i]); letterButton.disableInteractive(); letterButton.setVisible(false); });
                this.keyboardButtons.push(letterButton);
            }
        } else {
            // Desktop/tablet: horizontal rows
            const keyWidth = 60;
            const keyHeight = 35;
            const keysPerRow = 13;
            const startX = this.scale.width / 2 - (keysPerRow * keyWidth) / 2;
            const startY = this.scale.height - 120;
            let x = startX;
            let y = startY;
            for (let i = 0; i < keys.length; i++) {
                const letterButton = this.add.text(x, y, keys[i], {
                    fontSize: `${this.letterFontSize}px`,
                    fontFamily: fontFamily,
                    fill: '#fff',
                    backgroundColor: '#000',
                    padding: { x: 20, y: 5 }
                }).setInteractive()
                  .on('pointerup', () => { this.guessLetter(keys[i]); letterButton.disableInteractive(); letterButton.setVisible(false); });
                this.keyboardButtons.push(letterButton);
                x += keyWidth;
                if ((i + 1) % keysPerRow === 0) {
                    x = startX;
                    y += keyHeight + 10;
                }
            }
        }
    }

    /**
     * Generates the current display of the word, showing correctly guessed letters and underscores for unguessed letters.
     * @returns {string} The formatted word display string.
     */
    getWordDisplay() {
        return this.word.split('').map(letter => this.guessedLetters.includes(letter) ? letter : '_').join(' ');
    }

    /**
     * Handles keyboard input, processing only valid letter inputs.
     * @param {KeyboardEvent} event - The keyboard event.
     */
    handleKeyInput(event) {
        if (this.incorrectGuesses >= this.maxIncorrectGuesses) return;
        const letter = event.key.toUpperCase();
        if (letter.length === 1 && letter >= 'A' && letter <= 'Z' && !this.guessedLetters.includes(letter)) {
            this.guessLetter(letter);
        }
    }

    /**
     * Processes a letter guess, updating the game state based on whether the guess is correct or incorrect.
     * @param {string} letter - The letter guessed by the player.
     */
    guessLetter(letter) {
        this.guessedLetters.push(letter);
        this.guessedLettersDisplay.setText(this.guessedLetters.join(', '));
        this.wordDisplay.setText(this.getWordDisplay());

        if (!this.word.includes(letter)) {
            this.incorrectGuesses++;
            this.hangmanImage.setTexture(`hangman-0${this.incorrectGuesses + 1}`);

            if (this.incorrectGuesses >= this.maxIncorrectGuesses) {
                this.endGame(false);
            }
        } else if (this.getWordDisplay().indexOf('_') === -1) {
            this.endGame(true);
        }
    }

    /**
     * Ends the Hangman game, displaying the result and calling the completion callback.
     * @param {boolean} success - True if the player won, false otherwise.
     */
    endGame(success) {
        this.input.keyboard.off('keydown', this.handleKeyInput, this); // Remove keyboard event listener
        const resultText = success ? 'You Win!' : 'You Lose!';
        this.add.text(this.scale.width / 2, 400, resultText, { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);
        this.time.delayedCall(2000, () => {
            this.onComplete(success ? this.word.length * 10 : 0); // Award points based on word length if successful
            this.scene.stop();
        });
    }

    /**
     * Update method (called every frame).  Currently empty, but could be used for animations or other updates.
     */
    update() { }
}
