/**
 * ShootingSystem class handles projectile creation, physics, and management
 * Manages active projectiles and handles cleanup for performance optimization
 */
export class ShootingSystem {
    constructor(scene) {
        this.scene = scene;
        this.projectileSpeed = 600;
        this.maxProjectiles = 5;
        
        // Create physics group for projectiles
        this.projectileGroup = this.scene.physics.add.group({
            defaultKey: 'ball',
            maxSize: this.maxProjectiles,
            runChildUpdate: true
        });
        
        // Track active projectiles for cleanup
        this.activeProjectiles = new Set();
        
        // Projectile lifespan in milliseconds
        this.projectileLifespan = 5000;
    }
    
    /**
     * Fires a ball projectile from the specified position with calculated trajectory
     * @param {number} x - Starting X position
     * @param {number} y - Starting Y position  
     * @param {number} direction - Direction to fire (1 for right, -1 for left)
     * @param {Object} options - Additional firing options
     * @param {number} options.angle - Launch angle in degrees (default: -30 for slight upward arc)
     * @param {number} options.power - Power multiplier for velocity (default: 1.0)
     * @returns {Phaser.Physics.Arcade.Sprite|null} - The created projectile or null if max reached
     */
    fireBall(x, y, direction, options = {}) {
        // Check if we've reached maximum projectiles
        if (this.getActiveProjectileCount() >= this.maxProjectiles) {
            return null;
        }
        
        // Get or create projectile from group
        const projectile = this.projectileGroup.get(x, y, 'ball');
        
        if (!projectile) {
            return null;
        }
        
        // Configure projectile properties
        projectile.setActive(true);
        projectile.setVisible(true);
        projectile.setDepth(18); // Following established depth layering
        projectile.setScale(0.5); // Smaller scale for projectiles
        
        // Set physics properties
        projectile.body.setSize(16, 16); // Collision box
        
        // Calculate trajectory based on player orientation and physics
        const trajectory = this.calculateTrajectory(direction, options);
        
        // Apply calculated velocity with realistic physics
        projectile.setVelocityX(trajectory.velocityX);
        projectile.setVelocityY(trajectory.velocityY);
        
        // Configure physics properties for realistic behavior
        this.configureProjectilePhysics(projectile);
        
        // Add to active projectiles tracking
        this.activeProjectiles.add(projectile);
        
        // Set up automatic cleanup after lifespan
        this.scene.time.delayedCall(this.projectileLifespan, () => {
            this.cleanupProjectile(projectile);
        });
        
        // Set up boundary checking
        this.setupBoundaryChecking(projectile);
        
        return projectile;
    }
    
    /**
     * Calculates projectile trajectory based on direction and launch parameters
     * @param {number} direction - Direction to fire (1 for right, -1 for left)
     * @param {Object} options - Launch options
     * @param {number} options.angle - Launch angle in degrees (default: -30)
     * @param {number} options.power - Power multiplier (default: 1.0)
     * @returns {Object} - Object containing velocityX and velocityY
     */
    calculateTrajectory(direction, options = {}) {
        const angle = options.angle !== undefined ? options.angle : -30; // Default slight upward arc
        const power = options.power !== undefined ? options.power : 1.0;
        
        // Convert angle to radians (degrees * PI / 180)
        const angleRad = angle * Math.PI / 180;
        
        // Calculate base velocity components using physics
        const baseSpeed = this.projectileSpeed * power;
        
        // Apply trigonometry for realistic trajectory
        const velocityX = Math.cos(angleRad) * baseSpeed * direction;
        const velocityY = Math.sin(angleRad) * baseSpeed;
        
        return {
            velocityX: velocityX,
            velocityY: velocityY
        };
    }
    
    /**
     * Configures physics properties for realistic projectile behavior
     * @param {Phaser.Physics.Arcade.Sprite} projectile - The projectile to configure
     */
    configureProjectilePhysics(projectile) {
        // Set gravity for realistic arc trajectory
        projectile.body.setGravityY(400); // Slightly higher than default for faster fall
        
        // Set bounce properties for realistic collision response
        projectile.setBounce(0.6, 0.4); // Horizontal bounce higher than vertical
        
        // Set drag for air resistance (slight)
        projectile.body.setDrag(50, 20); // Light air resistance
        
        // Set mass for consistent momentum
        projectile.body.setMass(1);
        
        // Enable collision with world bounds but don't constrain movement
        projectile.setCollideWorldBounds(false);
        
        // Set angular velocity for spinning effect
        const spinDirection = projectile.body.velocity.x > 0 ? 1 : -1;
        projectile.setAngularVelocity(200 * spinDirection);
    }
    
    /**
     * Sets up boundary checking for a projectile
     * @param {Phaser.Physics.Arcade.Sprite} projectile - The projectile to monitor
     */
    setupBoundaryChecking(projectile) {
        // Check boundaries every frame
        const boundaryCheck = () => {
            if (!projectile.active) {
                return;
            }
            
            const bounds = this.scene.physics.world.bounds;
            const buffer = 100; // Extra buffer beyond world bounds
            
            // Check if projectile is outside world bounds with buffer
            if (projectile.x < bounds.x - buffer || 
                projectile.x > bounds.x + bounds.width + buffer ||
                projectile.y < bounds.y - buffer || 
                projectile.y > bounds.y + bounds.height + buffer) {
                this.cleanupProjectile(projectile);
            }
        };
        
        // Store the check function on the projectile for cleanup
        projectile.boundaryCheck = boundaryCheck;
        
        // Add to scene update loop
        this.scene.events.on('update', boundaryCheck);
    }
    
    /**
     * Removes a projectile from the game and cleans up resources
     * @param {Phaser.Physics.Arcade.Sprite} projectile - The projectile to cleanup
     */
    cleanupProjectile(projectile) {
        if (!projectile || !projectile.active) {
            return;
        }
        
        // Remove from active tracking
        this.activeProjectiles.delete(projectile);
        
        // Remove boundary checking event listener
        if (projectile.boundaryCheck) {
            this.scene.events.off('update', projectile.boundaryCheck);
            delete projectile.boundaryCheck;
        }
        
        // Return projectile to pool
        projectile.setActive(false);
        projectile.setVisible(false);
        projectile.body.setVelocity(0, 0);
        
        // Reset projectile properties
        projectile.setScale(1);
        projectile.clearTint();
    }
    
    /**
     * Returns the number of currently active projectiles
     * @returns {number} - Count of active projectiles
     */
    getActiveProjectileCount() {
        // Clean up any inactive projectiles from tracking
        this.activeProjectiles.forEach(projectile => {
            if (!projectile.active) {
                this.activeProjectiles.delete(projectile);
            }
        });
        
        return this.activeProjectiles.size;
    }
    
    /**
     * Cleans up all active projectiles (useful for scene transitions)
     */
    cleanupAllProjectiles() {
        const projectilesToCleanup = Array.from(this.activeProjectiles);
        projectilesToCleanup.forEach(projectile => {
            this.cleanupProjectile(projectile);
        });
    }
    
    /**
     * Fires a ball projectile based on player position and orientation
     * @param {Player} player - The player object to fire from
     * @param {Object} options - Additional firing options
     * @returns {Phaser.Physics.Arcade.Sprite|null} - The created projectile or null if max reached
     */
    fireFromPlayer(player, options = {}) {
        // Calculate firing position (slightly in front of player)
        const direction = player.flipX ? -1 : 1;
        const offsetX = 30 * direction; // Fire from slightly in front of player
        const offsetY = -20; // Fire from player's center height
        
        const fireX = player.x + offsetX;
        const fireY = player.y + offsetY;
        
        return this.fireBall(fireX, fireY, direction, options);
    }
    
    /**
     * Gets the trajectory information for a given direction and options
     * Useful for aiming indicators or trajectory prediction
     * @param {number} direction - Direction to fire (1 for right, -1 for left)
     * @param {Object} options - Launch options
     * @returns {Object} - Trajectory information including velocities and angle
     */
    getTrajectoryInfo(direction, options = {}) {
        const trajectory = this.calculateTrajectory(direction, options);
        const angle = options.angle !== undefined ? options.angle : -30;
        
        return {
            velocityX: trajectory.velocityX,
            velocityY: trajectory.velocityY,
            angle: angle,
            direction: direction,
            speed: Math.sqrt(trajectory.velocityX * trajectory.velocityX + trajectory.velocityY * trajectory.velocityY)
        };
    }
    
    /**
     * Updates the shooting system (called from scene update loop)
     */
    update() {
        // Perform any per-frame updates if needed
        // Currently boundary checking is handled via events
    }
    
    /**
     * Destroys the shooting system and cleans up all resources
     */
    destroy() {
        this.cleanupAllProjectiles();
        
        if (this.projectileGroup) {
            this.projectileGroup.destroy();
        }
        
        this.activeProjectiles.clear();
        this.scene = null;
    }
}