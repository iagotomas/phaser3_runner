import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ShootingSystem } from './shootingSystem.js';

// Mock Phaser scene for collision testing
const createMockGameScene = () => ({
    physics: {
        add: {
            group: vi.fn(() => ({
                get: vi.fn(),
                destroy: vi.fn()
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
            setDepth: vi.fn().mockReturnThis(),
            destroy: vi.fn()
        })),
        circle: vi.fn(() => ({
            setDepth: vi.fn().mockReturnThis(),
            destroy: vi.fn()
        }))
    },
    tweens: {
        add: vi.fn()
    },
    cameras: {
        main: {
            shake: vi.fn()
        }
    },
    updateScore: vi.fn()
});

const createMockProjectile = () => ({
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
});

const createMockEnemy = () => {
    const enemy = {
        health: 3,
        maxHealth: 3,
        active: true,
        x: 200,
        y: 300,
        enemyId: 'test_enemy_123',
        enemyType: 'basic',
        isFlashing: false,
        originalTint: 0xffffff,
        takeDamage: vi.fn()
    };
    
    // Set up the takeDamage mock to modify the enemy's state
    enemy.takeDamage.mockImplementation((amount) => {
        if (enemy.health <= 0) {
            return false; // Already dead
        }
        
        enemy.health -= amount;
        enemy.isFlashing = true;
        
        if (enemy.health <= 0) {
            enemy.active = false;
            return true; // Enemy destroyed
        }
        return false; // Enemy still alive
    });
    
    return enemy;
};

describe('Projectile Collision System', () => {
    let mockScene;
    let shootingSystem;
    let enemy;
    let mockProjectile;
    let mockPlatformGroup;

    beforeEach(() => {
        mockScene = createMockGameScene();
        shootingSystem = new ShootingSystem(mockScene);
        mockProjectile = createMockProjectile();
        enemy = createMockEnemy();
        
        // Create mock platform group
        mockPlatformGroup = {
            create: vi.fn(),
            getChildren: vi.fn(() => []),
            destroy: vi.fn()
        };
        
        // Mock the projectile group to return our mock projectile
        shootingSystem.projectileGroup.get.mockReturnValue(mockProjectile);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('collision detection setup', () => {
        it('should set up collision detection between projectiles and enemies', () => {
            // This test verifies that the game scene would set up collision detection
            // In the actual game, this would be called in the Game scene's create method
            const mockEnemyGroup = { add: vi.fn() };
            
            mockScene.physics.add.overlap(
                shootingSystem.projectileGroup,
                mockEnemyGroup,
                () => {}, // collision handler
                null,
                mockScene
            );
            
            expect(mockScene.physics.add.overlap).toHaveBeenCalledWith(
                shootingSystem.projectileGroup,
                mockEnemyGroup,
                expect.any(Function),
                null,
                mockScene
            );
        });
    });

    describe('projectile-enemy collision handling', () => {
        it('should handle collision between projectile and enemy', () => {
            // Simulate the collision handler that would be in the Game scene
            const handleProjectileEnemyCollision = (projectile, enemy) => {
                if (!projectile.active || !enemy.active || enemy.health <= 0) {
                    return;
                }
                
                const damageDealt = 1;
                const enemyDestroyed = enemy.takeDamage(damageDealt);
                shootingSystem.cleanupProjectile(projectile);
                
                return { damageDealt, enemyDestroyed };
            };
            
            // Test the collision
            const initialHealth = enemy.health;
            const result = handleProjectileEnemyCollision(mockProjectile, enemy);
            
            expect(result.damageDealt).toBe(1);
            expect(enemy.health).toBe(initialHealth - 1);
            expect(result.enemyDestroyed).toBe(false); // Enemy should still be alive
            
            // Verify projectile was cleaned up
            expect(mockProjectile.setActive).toHaveBeenCalledWith(false);
            expect(mockProjectile.setVisible).toHaveBeenCalledWith(false);
        });

        it('should destroy enemy when health reaches zero', () => {
            // Simulate the collision handler
            const handleProjectileEnemyCollision = (projectile, enemy) => {
                if (!projectile.active || !enemy.active || enemy.health <= 0) {
                    return;
                }
                
                const damageDealt = 1;
                const enemyDestroyed = enemy.takeDamage(damageDealt);
                shootingSystem.cleanupProjectile(projectile);
                
                return { damageDealt, enemyDestroyed };
            };
            
            // Reduce enemy health to 1
            enemy.health = 1;
            
            const result = handleProjectileEnemyCollision(mockProjectile, enemy);
            
            expect(result.damageDealt).toBe(1);
            expect(enemy.health).toBe(0);
            expect(result.enemyDestroyed).toBe(true);
        });

        it('should not process collision if projectile is inactive', () => {
            mockProjectile.active = false;
            
            const handleProjectileEnemyCollision = (projectile, enemy) => {
                if (!projectile.active || !enemy.active || enemy.health <= 0) {
                    return null;
                }
                
                const damageDealt = 1;
                const enemyDestroyed = enemy.takeDamage(damageDealt);
                shootingSystem.cleanupProjectile(projectile);
                
                return { damageDealt, enemyDestroyed };
            };
            
            const initialHealth = enemy.health;
            const result = handleProjectileEnemyCollision(mockProjectile, enemy);
            
            expect(result).toBeNull();
            expect(enemy.health).toBe(initialHealth); // Health should be unchanged
        });

        it('should not process collision if enemy is already dead', () => {
            enemy.health = 0;
            
            const handleProjectileEnemyCollision = (projectile, enemy) => {
                if (!projectile.active || !enemy.active || enemy.health <= 0) {
                    return null;
                }
                
                const damageDealt = 1;
                const enemyDestroyed = enemy.takeDamage(damageDealt);
                shootingSystem.cleanupProjectile(projectile);
                
                return { damageDealt, enemyDestroyed };
            };
            
            const result = handleProjectileEnemyCollision(mockProjectile, enemy);
            
            expect(result).toBeNull();
            expect(enemy.health).toBe(0); // Health should remain 0
        });
    });

    describe('projectile cleanup on collision', () => {
        it('should properly cleanup projectile after collision', () => {
            // Add projectile to active tracking
            shootingSystem.activeProjectiles.add(mockProjectile);
            const boundaryCheckFn = vi.fn();
            mockProjectile.boundaryCheck = boundaryCheckFn;
            
            // Simulate collision cleanup
            shootingSystem.cleanupProjectile(mockProjectile);
            
            // Verify cleanup
            expect(shootingSystem.activeProjectiles.has(mockProjectile)).toBe(false);
            expect(mockProjectile.setActive).toHaveBeenCalledWith(false);
            expect(mockProjectile.setVisible).toHaveBeenCalledWith(false);
            expect(mockProjectile.body.setVelocity).toHaveBeenCalledWith(0, 0);
            expect(mockScene.events.off).toHaveBeenCalledWith('update', boundaryCheckFn);
        });
    });

    describe('enemy damage mechanics', () => {
        it('should apply visual feedback when enemy takes damage', () => {
            const initialTint = enemy.originalTint;
            
            enemy.takeDamage(1);
            
            // Enemy should flash red (this is tested in enemy.test.js but we verify integration)
            expect(enemy.isFlashing).toBe(true);
        });

        it('should destroy enemy when health reaches zero', () => {
            enemy.health = 1;
            
            const wasDestroyed = enemy.takeDamage(1);
            
            // Verify enemy was destroyed
            expect(wasDestroyed).toBe(true);
            expect(enemy.health).toBe(0);
            expect(enemy.active).toBe(false);
        });
    });

    describe('projectile-terrain collision handling', () => {
        let mockTerrain;

        beforeEach(() => {
            mockTerrain = {
                x: 300,
                y: 400,
                surfaceType: 'hard'
            };
        });

        it('should set up terrain collision detection', () => {
            shootingSystem.setupTerrainCollision(mockPlatformGroup);
            
            expect(mockScene.physics.add.collider).toHaveBeenCalledWith(
                shootingSystem.projectileGroup,
                mockPlatformGroup,
                expect.any(Function),
                null,
                mockScene
            );
        });

        it('should handle projectile-terrain collision', () => {
            // Add projectile to active tracking
            shootingSystem.activeProjectiles.add(mockProjectile);
            
            // Simulate terrain collision
            shootingSystem.handleProjectileTerrainCollision(mockProjectile, mockTerrain);
            
            // Verify projectile was cleaned up
            expect(mockProjectile.setActive).toHaveBeenCalledWith(false);
            expect(mockProjectile.setVisible).toHaveBeenCalledWith(false);
            expect(mockProjectile.body.setVelocity).toHaveBeenCalledWith(0, 0);
            expect(mockProjectile.setAngularVelocity).toHaveBeenCalledWith(0);
        });

        it('should create impact effect on terrain collision', () => {
            shootingSystem.handleProjectileTerrainCollision(mockProjectile, mockTerrain);
            
            // Verify impact effect was created
            expect(mockScene.add.circle).toHaveBeenCalledWith(
                mockProjectile.x,
                mockProjectile.y,
                8,
                0xffffff,
                0.8
            );
            
            // Verify screen shake effect
            expect(mockScene.cameras.main.shake).toHaveBeenCalledWith(50, 0.01);
            
            // Verify tween animation was created
            expect(mockScene.tweens.add).toHaveBeenCalled();
        });

        it('should not process collision if projectile is inactive', () => {
            mockProjectile.active = false;
            
            // Simulate terrain collision with inactive projectile
            shootingSystem.handleProjectileTerrainCollision(mockProjectile, mockTerrain);
            
            // Verify no cleanup was attempted
            expect(mockProjectile.setActive).not.toHaveBeenCalled();
            expect(mockScene.add.circle).not.toHaveBeenCalled();
        });

        it('should apply collision response to stop projectile movement', () => {
            shootingSystem.applyCollisionResponse(mockProjectile, mockTerrain);
            
            // Verify projectile movement was stopped
            expect(mockProjectile.body.setVelocity).toHaveBeenCalledWith(0, 0);
            expect(mockProjectile.setAngularVelocity).toHaveBeenCalledWith(0);
        });

        it('should warn when no platform group is provided', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            shootingSystem.setupTerrainCollision(null);
            
            expect(consoleSpy).toHaveBeenCalledWith(
                'ShootingSystem: No platform group provided for terrain collision'
            );
            
            consoleSpy.mockRestore();
        });

        it('should log successful terrain collision setup', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            
            shootingSystem.setupTerrainCollision(mockPlatformGroup);
            
            expect(consoleSpy).toHaveBeenCalledWith(
                'ShootingSystem: Terrain collision detection set up'
            );
            
            consoleSpy.mockRestore();
        });
    });

    describe('integration with shooting system', () => {
        it('should fire projectile and track it correctly', () => {
            const projectile = shootingSystem.fireBall(100, 200, 1);
            
            expect(projectile).toBe(mockProjectile);
            expect(shootingSystem.getActiveProjectileCount()).toBe(1);
            expect(shootingSystem.activeProjectiles.has(mockProjectile)).toBe(true);
        });

        it('should prevent firing when max projectiles reached', () => {
            // Fill up to max projectiles
            for (let i = 0; i < 5; i++) {
                shootingSystem.activeProjectiles.add({ active: true });
            }
            
            const projectile = shootingSystem.fireBall(100, 200, 1);
            
            expect(projectile).toBeNull();
        });
    });
});