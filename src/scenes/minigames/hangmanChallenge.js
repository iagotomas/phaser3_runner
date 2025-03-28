import { Scene } from 'phaser';

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
    }

    /**
     * Creates the Hangman game elements and initializes the game state.
     * @param {object} data - Data passed from the parent scene.
     * @param {Scene} data.parentScene - Reference to the parent scene.
     * @param {function} data.onComplete - Callback function executed on game completion.
     */
    create(data) {
        this.word = '';          // The word to be guessed.
        this.guessedLetters = [];// Array to store letters guessed by the player.
        this.incorrectGuesses = 0;// Number of incorrect guesses made.
        this.parentScene = data.parentScene;
        this.onComplete = data.onComplete;
        const width = this.parentScene.cameras.main.width;
        const height = this.parentScene.cameras.main.height;
        // Semi-transparent dark overlay
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
            .setScrollFactor(0);

        // Add an image to represent the hangman figure.  Requires an image asset named 'hangman' with frames 'hangman_0', 'hangman_1', etc.
        this.hangmanImage = this.add.image(this.scale.width / 2, this.scale.height / 2, `hangman-0${this.incorrectGuesses + 1}`).setOrigin(0.5);
        //this.hangmanImage.setDepth(9)

        // Select a random word from the word list.  Consider loading words from a file for scalability.
        const words = [
            // Animals
            "gat",
            "gos",
            "elefant",
            "girafa",
            "conill",
            
            // Família i persones
            "mare",
            "pare",
            "amic",
            "germa",
            "avia",
            
            // Objectes quotidians
            "pilota",
            "llibre",
            "joguina",
            "cadira",
            "taula",
            
            // Accions i emocions
            "jugar",
            "riure",
            "correr",
            "saltar",
            "estimar",
            
            // Menjar
            "poma",
            "pastis",
            "xocolata",
            "gelat"
        ];
        this.word = words[Math.floor(Math.random() * words.length)].toUpperCase();

        // Add text elements to display the word, guessed letters, and game result.
        this.wordDisplay = this.add.text(this.scale.width / 2, this.scale.height - 200, this.getWordDisplay(), {
            fontSize: '32px',
            fontFamily: fontFamily,
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 20, y: 5 }
        }).setOrigin(0.5); // Center origin

        this.guessedLettersDisplay = this.add.text(this.scale.width / 2, 100, '', {
            fontSize: '24px',
            fontFamily: fontFamily,
            fill: '#000'
        }).setOrigin(0.5);


        // Listen for keyboard input events.
        this.input.keyboard.on('keydown', this.handleKeyInput, this);

        // Create on-screen keyboard layout for easier mobile play.
        this.keyboardLayout();
    }

    /**
     * Creates the on-screen keyboard layout for letter selection.
     */
    keyboardLayout() {
        const keys = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const initialKeyPosition = { 
            x: this.scale.width / 2 - (keys.length*45/2),
            y: this.scale.height - 150,
            width: 45,
            height: 35
        }
        console.log(initialKeyPosition)
        let x = initialKeyPosition.x;
        let y = initialKeyPosition.y;
        let letterButtons = [];

        for (let i = 0; i < keys.length; i++) {
            // Create interactive text buttons for each letter.
            const letterButton = this.add.text(x, y, keys[i], {
                fontSize: '24px',
                fontFamily: fontFamily,
                fill: '#fff',
                backgroundColor: '#000',
                padding: { x: 20, y: 5 }
            }).setInteractive()
              .on('pointerup', () => { this.guessLetter(keys[i]); letterButton.disableInteractive(); letterButton.setVisible(false);});
            letterButtons.push(letterButton);
            x += initialKeyPosition.width;
            if ((i + 1) % (this.scale.width/keys.length) === 0) {
                x = initialKeyPosition.x;
                y += initialKeyPosition.height;
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
