import { Scene } from 'phaser';
import Player from '../../objects/player';

export default class JumpChallenge extends Scene {
    constructor() {
        super('jumpChallenge');
    }

    create(data) {
        this.parentScene = data.parentScene;
        this.onComplete = data.onComplete;
        this.score = 0;
        this.timeLeft = 90; // 30 seconds to complete
        this.keys = this.parentScene.keys;

        // Create background
        this.add.image(0, 0, 'maze', 'maze_background')
            .setOrigin(0, 0)
            .setDisplaySize(this.scale.width, this.scale.height);

        // Define maze boundaries (can be passed through data)
        this.mazeBounds = {
            x: 106,  // left margin
            y: 65,  // top margin
            width: this.scale.width - 172 - 10,  // total width minus margins
            height: this.scale.height - 130 - 10  // total height minus margins
        };

        // Create maze walls with the defined boundaries
        this.createMaze();

        // Adjust player starting position to be within maze bounds
        this.player = this.physics.add.sprite(
            this.mazeBounds.x + this.cellSize * 2,
            this.mazeBounds.y + this.cellSize * 2,
            'maze',
            'maze_marble_unicorn'
        );
        this.anims.create({
            key: 'marble_roll',
            frames: this.anims.generateFrameNames('maze', {prefix: 'maze_marble_',start:1, end: 2, zeroPad: 2 }),
            frameRate: 8,
            repeat: -1
        });
        this.player.play('marble_roll');
        this.player.setCircle(12);
        this.player.setBounce(0.8);
        this.player.setCollideWorldBounds(true);
        this.player.setDamping(true);
        this.player.setDrag(0.95);
        this.player.setFriction(0.2);
        this.player.body.setGravityY(300);

        // Find a valid position for the goal (on a path, not a wall)
        const validPosition = this.findValidGoalPosition();
        
        // Create goal at valid position
        this.goal = this.add.image(validPosition.x, validPosition.y, 'maze', 'maze_hole');
        this.physics.add.existing(this.goal, true);

        // Add collision between player and walls
        this.physics.add.collider(this.player, this.walls);

        // Setup device orientation controls
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (event) => this.handleOrientation(event));
        }

        // Timer text
        this.timerText = this.add.text(16, 16, 'Time: 30', {
            fontSize: '32px',
            fill: '#fff'
        });

        // Start timer
        this.timer = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    }

    createMaze() {
        this.walls = this.physics.add.staticGroup();
        
        // Calculate scale factor for UI elements
        const scaleFactor = Math.min(this.scale.width / 1280, this.scale.height / 820);
        // Define grid size for maze
        const cellSize = 30 * scaleFactor;
        // Calculate grid dimensions based on available space
        const gridWidth = Math.floor(this.mazeBounds.width / cellSize) - 2;
        const gridHeight = Math.floor(this.mazeBounds.height / cellSize) - 2;

        // Store cellSize for other methods
        this.cellSize = cellSize;
        
        // Initialize grid with all walls
        const grid = Array(gridHeight).fill().map(() => Array(gridWidth).fill(false));
        const visited = Array(gridHeight).fill().map(() => Array(gridWidth).fill(false));
        
        // DFS function to generate maze
        const dfs = (row, col) => {
            visited[row][col] = true;
            grid[row][col] = true; // Mark as path
            
            // Define possible directions (up, right, down, left)
            const directions = [
                [-2, 0], [0, 2], [2, 0], [0, -2]
            ].sort(() => Math.random() - 0.5); // Randomize directions
            
            for (const [dx, dy] of directions) {
                const newRow = row + dx;
                const newCol = col + dy;
                
                if (newRow >= 0 && newRow < gridHeight && 
                    newCol >= 0 && newCol < gridWidth && 
                    !visited[newRow][newCol]) {
                    // Mark the cell between current and next as path
                    grid[row + dx/2][col + dy/2] = true;
                    dfs(newRow, newCol);
                }
            }
        };
        
        // Start DFS from top-left corner
        dfs(1, 1);
        
        // Store the grid as a class property so we can use it later
        this.mazeGrid = grid;
        
        // Create walls based on grid
        for (let row = 0; row < gridHeight; row++) {
            for (let col = 0; col < gridWidth; col++) {
                if (!grid[row][col]) {
                    const wall = this.add.rectangle(
                        this.mazeBounds.x + (col + 1) * cellSize,
                        this.mazeBounds.y + (row + 1) * cellSize,
                        cellSize,
                        cellSize,
                        0x8B4513
                    );
                    wall.setOrigin(0, 0);
                    this.walls.add(wall);
                }
            }
        }
        
        // Add invisible border walls with adjusted positions
        const addBorderWall = (x, y, width, height) => {
            const wall = this.add.rectangle(x, y, width, height, 0x000000);
            wall.setAlpha(0);
            this.walls.add(wall);
        };
        
        // Add borders within the defined bounds
        addBorderWall(this.mazeBounds.x, this.mazeBounds.y, this.mazeBounds.width, cellSize); // Top
        addBorderWall(this.mazeBounds.x, this.mazeBounds.y + this.mazeBounds.height - cellSize, this.mazeBounds.width, cellSize); // Bottom
        addBorderWall(this.mazeBounds.x, this.mazeBounds.y, cellSize, this.mazeBounds.height); // Left
        addBorderWall(this.mazeBounds.x + this.mazeBounds.width - cellSize, this.mazeBounds.y, cellSize, this.mazeBounds.height); // Right
    }

    handleOrientation(event) {
        const beta = event.beta; // X-axis rotation (-180 to 180)
        const gamma = event.gamma; // Y-axis rotation (-90 to 90)

        // Apply force to the ball based on device tilt
        const forceMultiplier = 15;
        this.player.setVelocityX(gamma * forceMultiplier);
        this.player.setVelocityY(beta * forceMultiplier);
    }

    updateTimer() {
        this.timeLeft--;
        this.timerText.setText(`Time: ${this.timeLeft}`);
        
        if (this.timeLeft <= 0) {
            this.endGame(false);
        }
    }

    update() {
        // Check if player reached the goal
        if (Phaser.Geom.Intersects.CircleToCircle(
            new Phaser.Geom.Circle(this.player.x, this.player.y, 15),
            new Phaser.Geom.Circle(this.goal.x, this.goal.y, 30)
        )) {
            this.endGame(true);
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

    findValidGoalPosition() {
        // Start from the bottom-right quarter of the maze
        const startRow = Math.floor(this.mazeGrid.length * 3/4);
        const startCol = Math.floor(this.mazeGrid[0].length * 3/4);
        
        // Search for a valid position (where grid[row][col] is true)
        for (let row = startRow; row < this.mazeGrid.length; row++) {
            for (let col = startCol; col < this.mazeGrid[0].length; col++) {
                if (this.mazeGrid[row][col]) {
                    return {
                        x: this.mazeBounds.x + (col + 1) * this.cellSize + this.cellSize/2,
                        y: this.mazeBounds.y + (row + 1) * this.cellSize + this.cellSize/2
                    };
                }
            }
        }
        
        // Fallback position if no valid position found
        return {
            x: this.scale.width - 100,
            y: this.scale.height - 100
        };
    }
} 