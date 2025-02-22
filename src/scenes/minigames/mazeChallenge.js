import { Scene } from 'phaser';

export default class MazeChallenge extends Scene {
    constructor() {
        super('mazeChallenge');
    }

    create(data) {
        this.parentScene = data.parentScene;
        this.onComplete = data.onComplete;
        this.score = 0;
        this.timeLeft = 120; // 30 seconds to complete
        this.keys = this.parentScene.keys;

        // Create background
        this.add.image(0, 0, 'maze', 'maze_background')
            .setOrigin(0, 0)
            .setDisplaySize(this.scale.width, this.scale.height);

        // Update scale factor calculation to be more robust
        const scaleFactor = Math.min(
            this.scale.width / 600,
            this.scale.height / 460
        );

        // Update maze boundaries with more conservative margins
        this.mazeBounds = {
            x: Math.max(74 * scaleFactor, this.scale.width * 0.1),  // At least 10% margin
            y: Math.max(58 * scaleFactor, this.scale.height * 0.1), // At least 10% margin
            width: this.scale.width - Math.max(132 * scaleFactor, this.scale.width * 0.2),  // Max 80% width
            height: this.scale.height - Math.max(110 * scaleFactor, this.scale.height * 0.2)  // Max 80% height
        };

        // Create maze walls before player
        this.createMaze();

        // Find a valid position for the goal (on a path, not a wall)
        const validPosition = this.findValidGoalPosition();
        
        // Create goal at valid position
        this.goal = this.add.image(validPosition.x, validPosition.y, 'maze', 'maze_hole');
        this.goal.setDepth(0); // Set hole to render below the player

        // Find the opposite position for the player
        const playerStartPos = this.findOppositePlayerPosition(validPosition);
        
        // Create player at the opposite position
        this.player = this.physics.add.sprite(
            playerStartPos.x,
            playerStartPos.y,
            'maze'
        );
        this.anims.create({
            key: 'marble_roll',
            frames: this.anims.generateFrameNames('maze', {prefix: 'maze_marble_',start:1, end: 2, zeroPad: 2 }),
            frameRate: 8,
            repeat: -1,
            paused: true  // Start paused initially
        });
        this.player.play('marble_roll');
        this.player.anims.pause();  // Ensure animation starts paused
        this.player.setCircle(13, 1, 1);
        this.player.setBounce(0.8);
        this.player.setCollideWorldBounds(true);
        this.player.setDamping(true);
        this.player.setDrag(0.95);
        this.player.setFriction(0.2);
        this.player.body.setGravityY(300);

        // Add the player after the goal so it renders on top
        this.player.setDepth(1);

        // Add collision between player and walls
        this.physics.add.collider(this.player, this.walls);

        // Setup device orientation controls
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (event) => this.handleOrientation(event));
        }

        // Timer text
        this.timerText = this.add.text(16, 16, `${this.timeLeft}s`, {
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
        const cellSize = 40 * scaleFactor;
        // Calculate grid dimensions based on available space
        const gridWidth = Math.floor(this.mazeBounds.width / cellSize);
        const gridHeight = Math.floor(this.mazeBounds.height / cellSize);

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
                        this.mazeBounds.x + col * cellSize,
                        this.mazeBounds.y + row * cellSize,
                        cellSize,
                        cellSize,
                        0xff7854
                    );
                    wall.setStrokeStyle(1, 0x000000);
                    wall.setOrigin(0, 0);
                    this.walls.add(wall);
                }
            }
        }
        
        // Add invisible border walls with adjusted positions
        const addBorderWall = (x, y, width, height) => {
            const wall = this.add.rectangle(x, y, width, height, 0x8B4513);
            wall.setOrigin(0, 0);
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
        // Get window orientation using Screen Orientation API
        const screenOrientation = screen.orientation?.angle || 0;

        // Adjust beta and gamma based on screen orientation
        let beta = Math.min(90, Math.max(-90, event.beta)); // Forward/back tilt
        let gamma = Math.min(90, Math.max(-90, event.gamma)); // Left/right tilt

        // Adjust controls based on screen orientation
        if (Math.abs(screenOrientation) === 90) {
            // In landscape mode, swap beta and gamma
            const temp = beta;
            beta = (screenOrientation === 90) ? -gamma : gamma;
            gamma = (screenOrientation === 90) ? -temp : temp;
        }

        // Convert angles to forces
        const forceMultiplier = 20;
        this.player.setVelocityX(-gamma * forceMultiplier);
        this.player.setVelocityY((beta / 90) * forceMultiplier * 15);

        // Calculate the total velocity magnitude
        const velocity = Math.sqrt(
            Math.pow(this.player.body.velocity.x, 2) + 
            Math.pow(this.player.body.velocity.y, 2)
        );

        // Adjust animation based on velocity
        if (velocity < 10) {
            this.player.anims.pause();
        } else {
            if (this.player.anims.isPaused) {
                this.player.anims.resume();
            }
            // Adjust animation speed based on velocity
            const newFrameRate = Math.min(16, Math.max(8, velocity / 20));
            this.player.anims.setFrameRate(newFrameRate);
        }
    }

    updateTimer() {
        this.timeLeft--;
        this.timerText.setText(`${this.timeLeft}s`);
        
        if (this.timeLeft <= 0) {
            this.endGame(false);
        }
    }

    update() {
        // Replace the existing collision check with this new version
        if (Phaser.Geom.Intersects.CircleToCircle(
            new Phaser.Geom.Circle(this.player.x, this.player.y, 15),
            new Phaser.Geom.Circle(this.goal.x, this.goal.y, 30)
        )) {
            // Stop the ball's movement
            this.player.setVelocity(0, 0);
            this.player.body.allowGravity = false;
            
            // Play falling animation
            this.tweens.add({
                targets: this.player,
                scale: 0.2,
                angle: 360,
                duration: 500,
                onComplete: () => {
                    this.player.setVisible(false);
                    this.endGame(true);
                }
            });
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
                        x: this.mazeBounds.x + col * this.cellSize + this.cellSize/2,
                        y: this.mazeBounds.y + row * this.cellSize + this.cellSize/2
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

    findOppositePlayerPosition(goalPos) {
        // Calculate grid positions
        const goalGridCol = Math.floor((goalPos.x - this.mazeBounds.x) / this.cellSize);
        const goalGridRow = Math.floor((goalPos.y - this.mazeBounds.y) / this.cellSize);
        
        // Start search from the opposite corner (top-left if goal is bottom-right)
        let startRow = 1;
        let startCol = 1;
        
        // Search for the first valid path position
        for (let row = startRow; row < this.mazeGrid.length; row++) {
            for (let col = startCol; col < this.mazeGrid[0].length; col++) {
                if (this.mazeGrid[row][col] && 
                    // Ensure it's far enough from the goal
                    Math.abs(row - goalGridRow) > this.mazeGrid.length/2 &&
                    Math.abs(col - goalGridCol) > this.mazeGrid[0].length/2) {
                    return {
                        x: this.mazeBounds.x + col * this.cellSize + this.cellSize/2,
                        y: this.mazeBounds.y + row * this.cellSize + this.cellSize/2
                    };
                }
            }
        }
        
        // Fallback position if no valid position found
        return {
            x: this.mazeBounds.x + this.cellSize * 2,
            y: this.mazeBounds.y + this.cellSize * 2
        };
    }
} 