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
        
        // Add visual and audio feedback
        this.createMuzzleFlash(x, y, direction);
        this.createProjectileTrail(projectile);
        this.playShootingSound();
        
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
        
        // Clean up particle trail if it exists
        if (projectile.trailParticles) {
            projectile.trailParticles.destroy();
            delete projectile.trailParticles;
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
     * Sets up collision detection between projectiles and terrain/platforms
     * @param {Phaser.Physics.Arcade.StaticGroup} platformGroup - The platform group to collide with
     */
    setupTerrainCollision(platformGroup) {
        if (!platformGroup) {
            console.warn('ShootingSystem: No platform group provided for terrain collision');
            return;
        }
        
        // Set up collision between projectiles and platforms
        this.scene.physics.add.collider(
            this.projectileGroup,
            platformGroup,
            this.handleProjectileTerrainCollision.bind(this),
            null,
            this.scene
        );
        
        console.log('ShootingSystem: Terrain collision detection set up');
    }
    
    /**
     * Handles collision between projectiles and terrain/platforms
     * @param {Phaser.Physics.Arcade.Sprite} projectile - The projectile that hit terrain
     * @param {Phaser.Physics.Arcade.Sprite} terrain - The terrain object that was hit
     */
    handleProjectileTerrainCollision(projectile, terrain) {
        // Verify projectile is still active
        if (!projectile || !projectile.active) {
            return;
        }
        
        console.log(`Projectile hit terrain at (${projectile.x}, ${projectile.y})`);
        
        // Create impact effect at collision point
        this.createImpactEffect(projectile.x, projectile.y);
        
        // Apply collision response based on surface type
        this.applyCollisionResponse(projectile, terrain);
        
        // Clean up the projectile after collision
        this.cleanupProjectile(projectile);
    }
    
    /**
     * Creates visual impact effect when projectile hits terrain
     * @param {number} x - X position of impact
     * @param {number} y - Y position of impact
     */
    createImpactEffect(x, y) {
        // Create small particle effect or visual indicator
        const impactEffect = this.scene.add.circle(x, y, 8, 0xffffff, 0.8);
        impactEffect.setDepth(19); // Above projectiles but below UI
        
        // Animate the impact effect
        this.scene.tweens.add({
            targets: impactEffect,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                impactEffect.destroy();
            }
        });
        
        // Add small screen shake for impact feedback
        this.scene.cameras.main.shake(50, 0.01);
    }
    
    /**
     * Applies appropriate collision response based on surface type
     * @param {Phaser.Physics.Arcade.Sprite} projectile - The projectile
     * @param {Phaser.Physics.Arcade.Sprite} terrain - The terrain object
     */
    applyCollisionResponse(projectile, terrain) {
        // For now, all terrain surfaces stop the projectile
        // In the future, different surface types could have different behaviors:
        // - Hard surfaces: immediate stop
        // - Soft surfaces: reduced bounce
        // - Bouncy surfaces: increased bounce
        
        // Stop the projectile's movement
        projectile.body.setVelocity(0, 0);
        projectile.setAngularVelocity(0);
        
        // Different responses could be implemented based on terrain.surfaceType
        // if (terrain.surfaceType === 'bouncy') {
        //     projectile.setBounce(1.2, 0.8);
        // } else if (terrain.surfaceType === 'soft') {
        //     projectile.setBounce(0.2, 0.1);
        // }
    }

    /**
     * Creates a muzzle flash effect at the shooting position
     * @param {number} x - X position of the muzzle flash
     * @param {number} y - Y position of the muzzle flash
     * @param {number} direction - Direction of shooting (1 for right, -1 for left)
     */
    createMuzzleFlash(x, y, direction) {
        // Check if scene has the required methods (for test compatibility)
        if (!this.scene.add || !this.scene.add.circle || !this.scene.tweens) {
            return;
        }
        
        // Create muzzle flash effect using a bright circle
        const flash = this.scene.add.circle(x, y, 12, 0xffff00, 0.9);
        flash.setDepth(19); // Above projectiles but below UI
        
        // Add slight offset based on direction
        flash.x += direction * 15;
        
        // Create outer glow effect
        const glow = this.scene.add.circle(x + direction * 15, y, 20, 0xff8800, 0.5);
        glow.setDepth(18);
        
        // Animate the muzzle flash with quick expansion and fade
        this.scene.tweens.add({
            targets: flash,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 150,
            ease: 'Power2',
            onComplete: () => {
                flash.destroy();
            }
        });
        
        // Animate the glow effect
        this.scene.tweens.add({
            targets: glow,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                glow.destroy();
            }
        });
        
        // Add brief screen flash for impact if camera is available
        if (this.scene.cameras && this.scene.cameras.main && this.scene.cameras.main.flash) {
            this.scene.cameras.main.flash(100, 255, 255, 0, false, (camera, progress) => {
                // Flash intensity decreases with progress
                const intensity = (1 - progress) * 0.1;
                camera.setAlpha(1 - intensity);
            });
        }
    }
    
    /**
     * Creates a particle trail effect for the projectile
     * @param {Phaser.Physics.Arcade.Sprite} projectile - The projectile to add trail to
     */
    createProjectileTrail(projectile) {
        // Check if scene has the required methods (for test compatibility)
        if (!this.scene.add || !this.scene.add.particles) {
            return;
        }
        
        // Create particle trail using star particles
        const particles = this.scene.add.particles(projectile.x, projectile.y, 'star', {
            scale: { start: 0.3, end: 0 },
            alpha: { start: 0.8, end: 0 },
            tint: 0xffffff,
            lifespan: 300,
            frequency: 50,
            quantity: 1,
            speed: { min: 10, max: 30 },
            follow: projectile,
            followOffset: { x: -8, y: 0 }
        });
        
        // Set appropriate depth for particles
        particles.setDepth(17); // Below projectiles but above background
        
        // Store particle emitter on projectile for cleanup
        projectile.trailParticles = particles;
    }
    
    /**
     * Plays shooting sound effect using the existing audio system
     */
    playShootingSound() {
        // Since there are no dedicated shooting sound files, create a synthetic sound
        // using the Web Audio API for a simple shooting effect
        try {
            const audioContext = this.scene.sound.context;
            if (!audioContext) {
                console.warn('ShootingSystem: No audio context available for shooting sound');
                return;
            }
            
            // Create a simple shooting sound using oscillators
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            // Connect audio nodes
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Configure shooting sound (quick frequency sweep)
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1);
            
            // Configure volume envelope (quick attack and decay)
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
            
            // Play the sound
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            
        } catch (error) {
            console.warn('ShootingSystem: Could not create shooting sound effect:', error);
        }
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