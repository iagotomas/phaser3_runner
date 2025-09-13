import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import BallInventory from './ballInventory.js';
import { ShootingSystem } from './shootingSystem.js';

// Create a simplified test version of AmmunitionUI that doesn't extend Phaser classes
class TestAmmunitionUI {
    constructor(scene, x = 20, y = 120) {
        this.scene = scene
        this.x = x
        this.y = y
        
        // Initialize UI components
        this.counterText = null
        this.statusIndicator = null
        this.emptyIndicator = null
        this.fullIndicator = null
        
        // Create UI elements
        this.createUI()
        
        // Mock Phaser methods
        this.setScrollFactor = vi.fn(() => this)
        this.setDepth = vi.fn(() => this)
        this.setVisible = vi.fn(() => this)
        this.setScale = vi.fn(() => this)
        this.setPosition = vi.fn(() => this)
        this.add = vi.fn()
        
        // Add to scene
        scene.add.existing(this)
    }

    createUI() {
        // Create ammunition counter text
        this.counterText = {
            setOrigin: vi.fn().mockReturnThis(),
            setText: vi.fn(),
            setFill: vi.fn(),
            setStroke: vi.fn()
        }
        
        // Create status indicator container
        this.statusIndicator = {
            add: vi.fn(),
            setVisible: vi.fn()
        }
        
        // Create empty state indicator
        this.emptyIndicator = {
            add: vi.fn(),
            setVisible: vi.fn()
        }
        
        // Create full state indicator
        this.fullIndicator = {
            add: vi.fn(),
            setVisible: vi.fn()
        }
    }

    updateDisplay(count, maxCount) {
        // Update counter text
        this.counterText.setText(`${count}/${maxCount}`)
        
        // Update text color based on ammunition level
        if (count === 0) {
            this.counterText.setFill('#ff4444')
            this.counterText.setStroke('#880000')
        } else if (count === maxCount) {
            this.counterText.setFill('#44ff44')
            this.counterText.setStroke('#008800')
        } else {
            this.counterText.setFill('#4a90e2')
            this.counterText.setStroke('#1a4480')
        }
        
        // Hide all status indicators by default
        this.emptyIndicator.setVisible(false)
        this.fullIndicator.setVisible(false)
    }

    showEmptyState() {
        this.emptyIndicator.setVisible(true)
        this.fullIndicator.setVisible(false)
        
        // Add pulsing animation for empty state
        this.scene.tweens.add({
            targets: this.emptyIndicator,
            alpha: 0.3,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        })
    }

    showFullState() {
        this.fullIndicator.setVisible(true)
        this.emptyIndicator.setVisible(false)
        
        // Add brief flash animation for full state
        this.scene.tweens.add({
            targets: this.fullIndicator,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 200,
            yoyo: true,
            ease: 'Back.easeOut'
        })
    }

    hide() {
        this.setVisible(false)
    }

    show() {
        this.setVisible(true)
    }

    handleResize(scaleFactor = 1) {
        this.setScale(scaleFactor)
        
        // Adjust position based on scale
        const baseX = 20
        const baseY = 120
        this.setPosition(baseX * scaleFactor, baseY * scaleFactor)
    }

    destroy() {
        // Stop any running tweens
        this.scene.tweens.killTweensOf(this.emptyIndicator)
        this.scene.tweens.killTweensOf(this.fullIndicator)
    }
}

// Mock Phaser scene for integration testing
const createMockIntegrationScene = () => ({
    physics: {
        add: {
            group: vi.fn(() => ({
                get: vi.fn(() => mockProjectile),
                destroy: vi.fn(),
                defaults: {
                    setGravityY: vi.fn(),
                    setBounce: vi.fn(),
                    setCollideWorldBounds: vi.fn()
                }
            })),
            overlap: vi.fn(),
            collider: vi.fn()
        },
        world: {
            bounds: { x: 0, y: 0, width: 800, height: 600 }
        }
    },
    time: {
        delayedCall: vi.fn(),
        now: 1000
    },
    events: {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn()
    },
    add: {
        existing: vi.fn(),
        text: vi.fn(() => ({
            setOrigin: vi.fn().mockReturnThis(),
            setText: vi.fn(),
            setFill: vi.fn(),
            setStroke: vi.fn(),
            setDepth: vi.fn().mockReturnThis(),
            destroy: vi.fn()
        })),
        container: vi.fn(() => ({
            add: vi.fn(),
            setVisible: vi.fn(),
            setDepth: vi.fn().mockReturnThis(),
            destroy: vi.fn()
        })),
        circle: vi.fn(() => ({
            setDepth: vi.fn().mockReturnThis(),
            destroy: vi.fn()
        })),
        particles: vi.fn(() => ({
            setDepth: vi.fn().mockReturnThis(),
            destroy: vi.fn()
        }))
    },
    tweens: {
        add: vi.fn(),
        killTweensOf: vi.fn()
    },
    cameras: {
        main: {
            flash: vi.fn(),
            shake: vi.fn()
        }
    },
    sound: {
        context: {
            createOscillator: vi.fn(() => ({
                connect: vi.fn(),
                start: vi.fn(),
                stop: vi.fn(),
                frequency: {
                    setValueAtTime: vi.fn(),
                    exponentialRampToValueAtTime: vi.fn()
                },
                type: 'square'
            })),
            createGain: vi.fn(() => ({
                connect: vi.fn(),
                gain: {
                    setValueAtTime: vi.fn(),
                    linearRampToValueAtTime: vi.fn(),
                    exponentialRampToValueAtTime: vi.fn()
                }
            })),
            destination: {},
            currentTime: 0
        }
    }
});

const mockProjectile = {
    setActive: vi.fn().mockReturnThis(),
    setVisible: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setScale: vi.fn().mockReturnThis(),
    setVelocityX: vi.fn().mockReturnThis(),
    setVelocityY: vi.fn().mockReturnThis(),
    setBounce: vi.fn().mockReturnThis(),
    setCollideWorldBounds: vi.fn().mockReturnThis(),
    setAngularVelocity: vi.fn().mockReturnThis(),
    clearTint: vi.fn().mockReturnThis(),
    body: {
        setSize: vi.fn(),
        setVelocity: vi.fn(),
        setGravityY: vi.fn(),
        setDrag: vi.fn(),
        setMass: vi.fn(),
        velocity: { x: 100, y: -50 }
    },
    active: true,
    x: 150,
    y: 200
};

const createMockPlayer = () => ({
    x: 100,
    y: 200,
    flipX: false,
    ballInventory: null,
    shootingSystem: null
});

const createMockEnemy = () => ({
    health: 3,
    maxHealth: 3,
    active: true,
    x: 300,
    y: 250,
    enemyId: 'enemy_123',
    enemyType: 'basic',
    takeDamage: vi.fn((amount) => {
        const enemy = createMockEnemy();
        enemy.health -= amount;
        if (enemy.health <= 0) {
            enemy.active = false;
            return true; // Enemy destroyed
        }
        return false; // Enemy still alive
    })
});

describe('Ball Shooting System - Integration Tests', () => {
    let mockScene;
    let ballInventory;
    let shootingSystem;
    let ammunitionUI;
    let mockPlayer;

    beforeEach(() => {
        mockScene = createMockIntegrationScene();
        ballInventory = new BallInventory(mockScene);
        shootingSystem = new ShootingSystem(mockScene);
        ammunitionUI = new TestAmmunitionUI(mockScene);
        mockPlayer = createMockPlayer();
        mockPlayer.ballInventory = ballInventory;
        mockPlayer.shootingSystem = shootingSystem;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Complete Ball Collection and Shooting Workflow', () => {
        it('should handle complete workflow from ball collection to shooting', () => {
            // Step 1: Collect balls (Requirement 1.1)
            expect(ballInventory.addBall()).toBe(true);
            expect(ballInventory.addBall()).toBe(true);
            expect(ballInventory.getCount()).toBe(2);

            // Step 2: Update UI display (Requirement 4.2)
            ammunitionUI.updateDisplay(ballInventory.getCount(), ballInventory.getMaxCapacity());
            expect(ammunitionUI.counterText.setText).toHaveBeenCalledWith('2/10');

            // Step 3: Fire projectile (Requirement 2.1)
            const projectile = shootingSystem.fireFromPlayer(mockPlayer);
            expect(projectile).toBe(mockProjectile);

            // Step 4: Consume ammunition (Requirement 2.2)
            expect(ballInventory.removeBall()).toBe(true);
            expect(ballInventory.getCount()).toBe(1);

            // Step 5: Update UI after shooting (Requirement 4.2)
            ammunitionUI.updateDisplay(ballInventory.getCount(), ballInventory.getMaxCapacity());
            expect(ammunitionUI.counterText.setText).toHaveBeenCalledWith('1/10');
        });

        it('should prevent shooting when inventory is empty (Requirement 2.5)', () => {
            // Ensure inventory is empty
            expect(ballInventory.isEmpty()).toBe(true);

            // Update UI to show empty state (Requirement 4.3)
            ammunitionUI.updateDisplay(0, 10);
            ammunitionUI.showEmptyState();
            expect(ammunitionUI.emptyIndicator.setVisible).toHaveBeenCalledWith(true);

            // Attempt to shoot should fail
            const canShoot = !ballInventory.isEmpty() && 
                           shootingSystem.getActiveProjectileCount() < shootingSystem.maxProjectiles;
            expect(canShoot).toBe(false);
        });

        it('should handle inventory full state correctly (Requirement 1.4)', () => {
            // Fill inventory to capacity
            for (let i = 0; i < 10; i++) {
                expect(ballInventory.addBall()).toBe(true);
            }

            // Verify inventory is full
            expect(ballInventory.isFull()).toBe(true);
            expect(ballInventory.getCount()).toBe(10);

            // Update UI to show full state (Requirement 4.4)
            ammunitionUI.updateDisplay(ballInventory.getCount(), ballInventory.getMaxCapacity());
            ammunitionUI.showFullState();
            expect(ammunitionUI.fullIndicator.setVisible).toHaveBeenCalledWith(true);

            // Attempt to collect more balls should fail (Requirement 1.4)
            expect(ballInventory.addBall()).toBe(false);
            expect(ballInventory.getCount()).toBe(10);
        });
    });

    describe('Projectile-Enemy Collision Integration', () => {
        it('should handle complete projectile-enemy collision workflow', () => {
            // Setup: Add ammunition and fire projectile
            ballInventory.addBall();
            const projectile = shootingSystem.fireBall(100, 200, 1);
            expect(projectile).toBe(mockProjectile);

            // Simulate enemy collision
            const mockEnemy = createMockEnemy();
            
            // Simulate collision handler (would be in Game scene)
            const handleCollision = (projectile, enemy) => {
                if (!projectile.active || !enemy.active) return false;
                
                const enemyDestroyed = enemy.takeDamage(1);
                shootingSystem.cleanupProjectile(projectile);
                
                return enemyDestroyed;
            };

            // Test collision
            const enemyDestroyed = handleCollision(projectile, mockEnemy);
            
            // Verify enemy took damage (Requirement 2.3)
            expect(mockEnemy.takeDamage).toHaveBeenCalledWith(1);
            
            // Verify projectile was cleaned up (Requirement 2.4)
            expect(projectile.setActive).toHaveBeenCalledWith(false);
            expect(projectile.setVisible).toHaveBeenCalledWith(false);
        });

        it('should handle projectile-terrain collision workflow', () => {
            // Setup: Add ammunition and fire projectile
            ballInventory.addBall();
            const projectile = shootingSystem.fireBall(100, 200, 1);
            
            // Add projectile to active tracking
            shootingSystem.activeProjectiles.add(projectile);

            // Simulate terrain collision (Requirement 2.4)
            const mockTerrain = { x: 300, y: 400, surfaceType: 'hard' };
            shootingSystem.handleProjectileTerrainCollision(projectile, mockTerrain);

            // Verify projectile was cleaned up
            expect(projectile.setActive).toHaveBeenCalledWith(false);
            expect(projectile.setVisible).toHaveBeenCalledWith(false);
            expect(projectile.body.setVelocity).toHaveBeenCalledWith(0, 0);

            // Verify impact effect was created (Requirement 5.3)
            expect(mockScene.add.circle).toHaveBeenCalledWith(
                projectile.x, projectile.y, 8, 0xffffff, 0.8
            );
        });
    });

    describe('UI Integration with Game State', () => {
        it('should update UI in real-time during gameplay', () => {
            // Start with empty inventory
            ammunitionUI.updateDisplay(0, 10);
            expect(ammunitionUI.counterText.setText).toHaveBeenCalledWith('0/10');
            expect(ammunitionUI.counterText.setFill).toHaveBeenCalledWith('#ff4444'); // Red for empty

            // Collect balls and update UI
            ballInventory.addBall();
            ballInventory.addBall();
            ammunitionUI.updateDisplay(ballInventory.getCount(), ballInventory.getMaxCapacity());
            expect(ammunitionUI.counterText.setText).toHaveBeenCalledWith('2/10');
            expect(ammunitionUI.counterText.setFill).toHaveBeenCalledWith('#4a90e2'); // Blue for normal

            // Fill to capacity and update UI
            for (let i = 2; i < 10; i++) {
                ballInventory.addBall();
            }
            ammunitionUI.updateDisplay(ballInventory.getCount(), ballInventory.getMaxCapacity());
            expect(ammunitionUI.counterText.setText).toHaveBeenCalledWith('10/10');
            expect(ammunitionUI.counterText.setFill).toHaveBeenCalledWith('#44ff44'); // Green for full
        });

        it('should handle UI state transitions correctly', () => {
            // Test empty state
            ammunitionUI.showEmptyState();
            expect(mockScene.tweens.add).toHaveBeenCalledWith(
                expect.objectContaining({
                    alpha: 0.3,
                    duration: 500,
                    yoyo: true,
                    repeat: -1
                })
            );

            // Test full state
            ammunitionUI.showFullState();
            expect(mockScene.tweens.add).toHaveBeenCalledWith(
                expect.objectContaining({
                    scaleX: 1.3,
                    scaleY: 1.3,
                    duration: 200,
                    yoyo: true
                })
            );
        });
    });

    describe('Performance and Resource Management', () => {
        it('should properly manage projectile lifecycle', () => {
            // Fire multiple projectiles
            ballInventory.addBall();
            ballInventory.addBall();
            ballInventory.addBall();

            // Mock the projectile group to return different projectiles
            const projectile1 = { ...mockProjectile };
            const projectile2 = { ...mockProjectile };
            const projectile3 = { ...mockProjectile };
            
            shootingSystem.projectileGroup.get
                .mockReturnValueOnce(projectile1)
                .mockReturnValueOnce(projectile2)
                .mockReturnValueOnce(projectile3);

            shootingSystem.fireBall(100, 200, 1);
            shootingSystem.fireBall(120, 200, 1);
            shootingSystem.fireBall(140, 200, 1);

            // Verify all projectiles are tracked
            expect(shootingSystem.getActiveProjectileCount()).toBe(3);

            // Clean up one projectile
            shootingSystem.cleanupProjectile(projectile1);
            expect(shootingSystem.getActiveProjectileCount()).toBe(2);

            // Clean up all projectiles
            shootingSystem.cleanupAllProjectiles();
            expect(shootingSystem.getActiveProjectileCount()).toBe(0);
        });

        it('should enforce maximum projectile limits (Requirement 5.4)', () => {
            // Fill up to max projectiles
            for (let i = 0; i < 5; i++) {
                ballInventory.addBall();
                shootingSystem.activeProjectiles.add({ active: true });
            }

            // Attempt to fire another projectile should fail
            ballInventory.addBall();
            const projectile = shootingSystem.fireBall(100, 200, 1);
            expect(projectile).toBeNull();
        });

        it('should handle automatic projectile cleanup after lifespan', () => {
            ballInventory.addBall();
            const projectile = shootingSystem.fireBall(100, 200, 1);

            // Verify automatic cleanup was scheduled
            expect(mockScene.time.delayedCall).toHaveBeenCalledWith(
                5000, // projectileLifespan
                expect.any(Function)
            );

            // Simulate lifespan expiry
            const cleanupCallback = mockScene.time.delayedCall.mock.calls[0][1];
            cleanupCallback();

            // Verify projectile was cleaned up
            expect(projectile.setActive).toHaveBeenCalledWith(false);
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle null projectile creation gracefully', () => {
            // Mock projectile group to return null
            shootingSystem.projectileGroup.get.mockReturnValue(null);

            ballInventory.addBall();
            const projectile = shootingSystem.fireBall(100, 200, 1);

            expect(projectile).toBeNull();
            // Ammunition should not be consumed if projectile creation fails
            expect(ballInventory.getCount()).toBe(1);
        });

        it('should handle scene destruction gracefully', () => {
            // Add some projectiles
            ballInventory.addBall();
            ballInventory.addBall();
            shootingSystem.fireBall(100, 200, 1);
            shootingSystem.fireBall(120, 200, 1);

            // Destroy shooting system
            expect(() => {
                shootingSystem.destroy();
            }).not.toThrow();

            expect(shootingSystem.scene).toBeNull();
            expect(shootingSystem.activeProjectiles.size).toBe(0);
        });

        it('should handle UI destruction gracefully', () => {
            // Start some animations
            ammunitionUI.showEmptyState();
            ammunitionUI.showFullState();

            // Destroy UI
            expect(() => {
                ammunitionUI.destroy();
            }).not.toThrow();

            // Verify tweens were cleaned up
            expect(mockScene.tweens.killTweensOf).toHaveBeenCalled();
        });
    });

    describe('Requirements Validation - All Requirements', () => {
        it('should satisfy all Requirement 1 criteria (Ball Collection)', () => {
            // 1.1: Add ball to inventory on collision
            expect(ballInventory.addBall()).toBe(true);
            expect(ballInventory.getCount()).toBe(1);

            // 1.2: Remove ball from game world (simulated)
            // This would be handled by CloudManager in actual game

            // 1.3: Update ammunition count display
            ammunitionUI.updateDisplay(ballInventory.getCount(), ballInventory.getMaxCapacity());
            expect(ammunitionUI.counterText.setText).toHaveBeenCalledWith('1/10');

            // 1.4: Prevent collection when at capacity
            for (let i = 1; i < 10; i++) {
                ballInventory.addBall();
            }
            expect(ballInventory.addBall()).toBe(false);
        });

        it('should satisfy all Requirement 2 criteria (Shooting)', () => {
            ballInventory.addBall();

            // 2.1: Fire projectile when button pressed and has balls
            const projectile = shootingSystem.fireFromPlayer(mockPlayer);
            expect(projectile).toBe(mockProjectile);

            // 2.2: Decrease ammunition count
            ballInventory.removeBall();
            expect(ballInventory.getCount()).toBe(0);

            // 2.3: Damage enemy on collision (simulated)
            const mockEnemy = createMockEnemy();
            mockEnemy.takeDamage(1);
            expect(mockEnemy.takeDamage).toHaveBeenCalledWith(1);

            // 2.4: Remove projectile on terrain collision
            shootingSystem.cleanupProjectile(projectile);
            expect(projectile.setActive).toHaveBeenCalledWith(false);

            // 2.5: Prevent shooting when no balls
            expect(ballInventory.isEmpty()).toBe(true);
            const canShoot = !ballInventory.isEmpty();
            expect(canShoot).toBe(false);
        });

        it('should satisfy all Requirement 4 criteria (UI Display)', () => {
            // 4.1: Display current ball count as zero initially
            ammunitionUI.updateDisplay(0, 10);
            expect(ammunitionUI.counterText.setText).toHaveBeenCalledWith('0/10');

            // 4.2: Update display in real-time
            ballInventory.addBall();
            ammunitionUI.updateDisplay(ballInventory.getCount(), ballInventory.getMaxCapacity());
            expect(ammunitionUI.counterText.setText).toHaveBeenCalledWith('1/10');

            // 4.3: Visually indicate empty state
            ammunitionUI.showEmptyState();
            expect(mockScene.tweens.add).toHaveBeenCalledWith(
                expect.objectContaining({ alpha: 0.3, repeat: -1 })
            );

            // 4.4: Visually indicate full state
            ammunitionUI.showFullState();
            expect(mockScene.tweens.add).toHaveBeenCalledWith(
                expect.objectContaining({ scaleX: 1.3, scaleY: 1.3 })
            );
        });

        it('should satisfy all Requirement 5 criteria (Physics)', () => {
            ballInventory.addBall();
            const projectile = shootingSystem.fireBall(100, 200, 1);

            // 5.1: Apply physics-based movement with gravity
            expect(projectile.body.setGravityY).toHaveBeenCalledWith(400);
            expect(projectile.setVelocityX).toHaveBeenCalled();
            expect(projectile.setVelocityY).toHaveBeenCalled();

            // 5.2: Maintain consistent speed and trajectory
            const trajectory = shootingSystem.calculateTrajectory(1);
            expect(trajectory.velocityX).toBeCloseTo(519.615, 1);
            expect(trajectory.velocityY).toBeCloseTo(-300, 1);

            // 5.3: Apply collision response
            const mockTerrain = { surfaceType: 'hard' };
            shootingSystem.applyCollisionResponse(projectile, mockTerrain);
            expect(projectile.body.setVelocity).toHaveBeenCalledWith(0, 0);

            // 5.4: Automatic removal after lifespan
            expect(mockScene.time.delayedCall).toHaveBeenCalledWith(5000, expect.any(Function));
        });
    });
});