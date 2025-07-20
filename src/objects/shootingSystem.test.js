import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ShootingSystem } from './shootingSystem.js';

// Mock Phaser scene and physics
const createMockScene = () => ({
    physics: {
        add: {
            group: vi.fn(() => ({
                defaults: {
                    setGravityY: vi.fn(),
                    setBounce: vi.fn(),
                    setCollideWorldBounds: vi.fn()
                },
                get: vi.fn()
            }))
        },
        world: {
            bounds: {
                x: 0,
                y: 0,
                width: 800,
                height: 600
            }
        }
    },
    time: {
        delayedCall: vi.fn()
    },
    events: {
        on: vi.fn(),
        off: vi.fn()
    }
});

const createMockProjectile = () => ({
    setActive: vi.fn().mockReturnThis(),
    setVisible: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setScale: vi.fn().mockReturnThis(),
    setVelocityX: vi.fn().mockReturnThis(),
    setVelocityY: vi.fn().mockReturnThis(),
    clearTint: vi.fn().mockReturnThis(),
    body: {
        setSize: vi.fn(),
        setVelocity: vi.fn()
    },
    active: true,
    x: 100,
    y: 100
});

describe('ShootingSystem', () => {
    let shootingSystem;
    let mockScene;
    let mockProjectile;

    beforeEach(() => {
        mockScene = createMockScene();
        mockProjectile = createMockProjectile();
        shootingSystem = new ShootingSystem(mockScene);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with correct default values', () => {
            expect(shootingSystem.projectileSpeed).toBe(600);
            expect(shootingSystem.maxProjectiles).toBe(5);
            expect(shootingSystem.projectileLifespan).toBe(5000);
            expect(shootingSystem.scene).toBe(mockScene);
        });

        it('should create projectile group with correct configuration', () => {
            expect(mockScene.physics.add.group).toHaveBeenCalledWith({
                defaultKey: 'ball',
                maxSize: 5,
                runChildUpdate: true
            });
        });

        it('should configure projectile group defaults', () => {
            const groupDefaults = shootingSystem.projectileGroup.defaults;
            expect(groupDefaults.setGravityY).toHaveBeenCalledWith(300);
            expect(groupDefaults.setBounce).toHaveBeenCalledWith(0.3);
            expect(groupDefaults.setCollideWorldBounds).toHaveBeenCalledWith(false);
        });

        it('should initialize empty active projectiles set', () => {
            expect(shootingSystem.activeProjectiles.size).toBe(0);
        });
    });

    describe('fireBall', () => {
        beforeEach(() => {
            shootingSystem.projectileGroup.get.mockReturnValue(mockProjectile);
        });

        it('should create and configure projectile correctly', () => {
            const result = shootingSystem.fireBall(100, 200, 1);

            expect(shootingSystem.projectileGroup.get).toHaveBeenCalledWith(100, 200, 'ball');
            expect(mockProjectile.setActive).toHaveBeenCalledWith(true);
            expect(mockProjectile.setVisible).toHaveBeenCalledWith(true);
            expect(mockProjectile.setDepth).toHaveBeenCalledWith(18);
            expect(mockProjectile.setScale).toHaveBeenCalledWith(0.5);
            expect(result).toBe(mockProjectile);
        });

        it('should set correct physics properties', () => {
            shootingSystem.fireBall(100, 200, 1);

            expect(mockProjectile.body.setSize).toHaveBeenCalledWith(16, 16);
            expect(mockProjectile.setVelocityX).toHaveBeenCalledWith(600);
            expect(mockProjectile.setVelocityY).toHaveBeenCalledWith(-200);
        });

        it('should handle left direction correctly', () => {
            shootingSystem.fireBall(100, 200, -1);

            expect(mockProjectile.setVelocityX).toHaveBeenCalledWith(-600);
        });

        it('should add projectile to active tracking', () => {
            shootingSystem.fireBall(100, 200, 1);

            expect(shootingSystem.activeProjectiles.has(mockProjectile)).toBe(true);
            expect(shootingSystem.getActiveProjectileCount()).toBe(1);
        });

        it('should set up automatic cleanup', () => {
            shootingSystem.fireBall(100, 200, 1);

            expect(mockScene.time.delayedCall).toHaveBeenCalledWith(
                5000,
                expect.any(Function)
            );
        });

        it('should return null when max projectiles reached', () => {
            // Fill up to max projectiles
            for (let i = 0; i < 5; i++) {
                shootingSystem.activeProjectiles.add({ active: true });
            }

            const result = shootingSystem.fireBall(100, 200, 1);

            expect(result).toBeNull();
            expect(shootingSystem.projectileGroup.get).not.toHaveBeenCalled();
        });

        it('should return null when projectile group returns null', () => {
            shootingSystem.projectileGroup.get.mockReturnValue(null);

            const result = shootingSystem.fireBall(100, 200, 1);

            expect(result).toBeNull();
        });
    });

    describe('setupBoundaryChecking', () => {
        it('should add boundary check event listener', () => {
            shootingSystem.setupBoundaryChecking(mockProjectile);

            expect(mockScene.events.on).toHaveBeenCalledWith('update', expect.any(Function));
            expect(mockProjectile.boundaryCheck).toBeDefined();
        });
    });

    describe('cleanupProjectile', () => {
        beforeEach(() => {
            mockProjectile.boundaryCheck = vi.fn();
            shootingSystem.activeProjectiles.add(mockProjectile);
        });

        it('should remove projectile from active tracking', () => {
            shootingSystem.cleanupProjectile(mockProjectile);

            expect(shootingSystem.activeProjectiles.has(mockProjectile)).toBe(false);
        });

        it('should remove boundary check event listener', () => {
            const boundaryCheckFn = mockProjectile.boundaryCheck;
            
            shootingSystem.cleanupProjectile(mockProjectile);

            expect(mockScene.events.off).toHaveBeenCalledWith('update', boundaryCheckFn);
            expect(mockProjectile.boundaryCheck).toBeUndefined();
        });

        it('should deactivate and hide projectile', () => {
            shootingSystem.cleanupProjectile(mockProjectile);

            expect(mockProjectile.setActive).toHaveBeenCalledWith(false);
            expect(mockProjectile.setVisible).toHaveBeenCalledWith(false);
        });

        it('should reset projectile physics and properties', () => {
            shootingSystem.cleanupProjectile(mockProjectile);

            expect(mockProjectile.body.setVelocity).toHaveBeenCalledWith(0, 0);
            expect(mockProjectile.setScale).toHaveBeenCalledWith(1);
            expect(mockProjectile.clearTint).toHaveBeenCalled();
        });

        it('should handle inactive projectiles gracefully', () => {
            mockProjectile.active = false;

            expect(() => {
                shootingSystem.cleanupProjectile(mockProjectile);
            }).not.toThrow();
        });

        it('should handle null projectiles gracefully', () => {
            expect(() => {
                shootingSystem.cleanupProjectile(null);
            }).not.toThrow();
        });
    });

    describe('getActiveProjectileCount', () => {
        it('should return correct count of active projectiles', () => {
            const activeProjectile1 = { active: true };
            const activeProjectile2 = { active: true };
            
            shootingSystem.activeProjectiles.add(activeProjectile1);
            shootingSystem.activeProjectiles.add(activeProjectile2);

            expect(shootingSystem.getActiveProjectileCount()).toBe(2);
        });

        it('should clean up inactive projectiles from tracking', () => {
            const activeProjectile = { active: true };
            const inactiveProjectile = { active: false };
            
            shootingSystem.activeProjectiles.add(activeProjectile);
            shootingSystem.activeProjectiles.add(inactiveProjectile);

            const count = shootingSystem.getActiveProjectileCount();

            expect(count).toBe(1);
            expect(shootingSystem.activeProjectiles.has(inactiveProjectile)).toBe(false);
            expect(shootingSystem.activeProjectiles.has(activeProjectile)).toBe(true);
        });
    });

    describe('cleanupAllProjectiles', () => {
        it('should cleanup all active projectiles', () => {
            const projectile1 = createMockProjectile();
            const projectile2 = createMockProjectile();
            
            shootingSystem.activeProjectiles.add(projectile1);
            shootingSystem.activeProjectiles.add(projectile2);

            const cleanupSpy = vi.spyOn(shootingSystem, 'cleanupProjectile');

            shootingSystem.cleanupAllProjectiles();

            expect(cleanupSpy).toHaveBeenCalledWith(projectile1);
            expect(cleanupSpy).toHaveBeenCalledWith(projectile2);
        });
    });

    describe('destroy', () => {
        it('should cleanup all projectiles and destroy group', () => {
            const cleanupAllSpy = vi.spyOn(shootingSystem, 'cleanupAllProjectiles');
            shootingSystem.projectileGroup.destroy = vi.fn();

            shootingSystem.destroy();

            expect(cleanupAllSpy).toHaveBeenCalled();
            expect(shootingSystem.projectileGroup.destroy).toHaveBeenCalled();
            expect(shootingSystem.activeProjectiles.size).toBe(0);
            expect(shootingSystem.scene).toBeNull();
        });
    });

    describe('update', () => {
        it('should exist and be callable', () => {
            expect(() => {
                shootingSystem.update();
            }).not.toThrow();
        });
    });
});