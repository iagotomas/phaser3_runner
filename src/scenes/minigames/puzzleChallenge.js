import { Scene } from 'phaser';
import Player from '../../objects/player';

export default class PuzzleChallenge extends Scene {
    constructor() {
        super('puzzleChallenge');
        this.pieces = [];
        this.gridSize = 3; // 3x3 grid
        this.pieceSize = 213; // Size of each piece (1136 / 3)
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

        // Create the puzzle
        this.createPuzzle();
        this.shufflePuzzle();
    }

    createPuzzle() {
        const graphics = this.add.graphics();
        const puzzleImage = this.add.image(0, 0, 'puzzleImage').setVisible(false); // Load the image but keep it hidden

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const piece = this.add.image(col * this.pieceSize, row * this.pieceSize, 'puzzleImage', this.getFrame(row, col))
                    .setInteractive()
                    .setOrigin(0)
                    .setData('position', { row, col });

                // Create a mask for the piece
                const mask = graphics.createGeometryMask();
                mask.setPosition(col * this.pieceSize, row * this.pieceSize);
                piece.setMask(mask);

                piece.on('pointerdown', this.onPieceClick, this);
                this.pieces.push(piece);
            }
        }
        graphics.destroy(); // Clean up the graphics object after creating the pieces
    }

    getFrame(row, col) {
        return `${col + (row * this.gridSize)}.png`; // Assuming the frames are named 0.png, 1.png, ..., 8.png
    }

    shufflePuzzle() {
        Phaser.Utils.Array.Shuffle(this.pieces);
        this.pieces.forEach((piece, index) => {
            const targetX = (index % this.gridSize) * this.pieceSize;
            const targetY = Math.floor(index / this.gridSize) * this.pieceSize;
            piece.setPosition(targetX, targetY);
        });
    }

    onPieceClick(piece) {
        const emptyPiece = this.pieces.find(p => p.getData('position').row === -1 && p.getData('position').col === -1);
        if (emptyPiece) {
            const emptyPos = emptyPiece.getData('position');
            const piecePos = piece.getData('position');

            if (this.isAdjacent(emptyPos, piecePos)) {
                // Swap positions
                emptyPiece.setPosition(piece.x, piece.y);
                piece.setPosition(emptyPos.col * this.pieceSize, emptyPos.row * this.pieceSize);

                // Update data
                emptyPiece.setData('position', piecePos);
                piece.setData('position', emptyPos);
            }
        }
    }

    isAdjacent(pos1, pos2) {
        const rowDiff = Math.abs(pos1.row - pos2.row);
        const colDiff = Math.abs(pos1.col - pos2.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
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
