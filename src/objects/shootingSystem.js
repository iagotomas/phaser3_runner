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
        
        // Configure projectile physics defaults
        this.projectileGroup.defaults.setGravityY(300);
        this.projectileGroup.defaults.setBounce(0.3);
        this.projectileGroup.defaults.setCollideWorldBounds(false);
        
        // Track active projectiles for cleanup
        this.activeProjectiles = new Set();
        
        // Projectile lifespan in milliseconds
        this.projectileLifespan = 5000;
    }
    
    /**
     * Fires a ball projectile from the specified position in the given direction
     * @param {number} x - Starting X position
     * @param {number} y - Starting Y position  
     * @param {number} direction - Direction to fire (1 for right, -1 for left)
     * @returns {Phaser.Physics.Arcade.Sprite|null} - The created projectile or null if max reached
     */
    fireBall(x, y, direction) {
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
        projectile.setVelocityX(this.projectileSpeed * direction);
        projectile.setVelocityY(-200); // Initial upward velocity
        
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