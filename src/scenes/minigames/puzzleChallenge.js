import { Scene } from 'phaser';
import Player from '../../objects/player';

export default class PuzzleChallenge extends Scene {
    constructor() {
        super('puzzleChallenge');
    }

    create(data) {
        this.parentScene = data.parentScene;
        this.onComplete = data.onComplete;
        this.score = 0;
        this.timeLeft = 120; // 30 seconds to complete
        this.keys = this.parentScene.keys;

        // Start timer
        this.timer = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    }

    updateTimer() {
        this.timeLeft--;
        this.timerText.setText(`${this.timeLeft}s`);
        
        if (this.timeLeft <= 0) {
            this.endGame(false);
        }
    }

    update() {
        this.timeLeft--;
        if (this.timeLeft <= 0) {
            this.endGame();
        }
    }

    endGame() {
        // Stop the timer
        this.timer.remove();
        
        // Calculate final score based on remaining time
        const finalScore = success ? this.timeLeft * 10 : 0;
        
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
