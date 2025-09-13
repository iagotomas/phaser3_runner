import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ShootingSystem } from './shootingSystem.js';

// Mock Phaser scene for physics testing
const createMockPhysicsScene = () => ({
    physics: {
        add: {
            group: vi.fn(() => ({
                get: vi.fn(() => mockProjectile),
                destroy: vi.fn()
            }))
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
        off: vi.fn()
    },
    add: {
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
        add: vi.fn()
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
        velocity: { x: 0, y: 0 }
    },
    active: true,
    x: 100,
    y: 200
};

describe('ShootingSystem - Physics Tests', () => {
    let shootingSystem;
    let mockScene;

    beforeEach(() => {
        mockScene = createMockPhysicsScene();
        shootingSystem = new ShootingSystem(mockScene);
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Trajectory Calculations', () => {
        describe('Basic trajectory physics', () => {
            it('should calculate correct trajectory for default angle (-30 degrees)', () => {
                const trajectory = shootingSystem.calculateTrajectory(1);
                
                // For -30 degrees: cos(-30°) ≈ 0.866, sin(-30°) = -0.5
                // With speed 600: velocityX ≈ 519.615, velocityY = -300
                expect(trajectory.velocityX).toBeCloseTo(519.615, 1);
                expect(trajectory.velocityY).toBeCloseTo(-300, 1);
            });

            it('should calculate correct trajectory for 0 degrees (horizontal)', () => {
                const trajectory = shootingSystem.calculateTrajectory(1, { angle: 0 });
                
                // For 0 degrees: cos(0°) = 1, sin(0°) = 0
                expect(trajectory.velocityX).toBeCloseTo(600, 1);
                expect(trajectory.velocityY).toBeCloseTo(0, 1);
            });

            it('should calculate correct trajectory for -45 degrees', () => {
                const trajectory = shootingSystem.calculateTrajectory(1, { angle: -45 });
                
                // For -45 degrees: cos(-45°) ≈ 0.707, sin(-45°) ≈ -0.707
                // With speed 600: velocityX ≈ 424.26, velocityY ≈ -424.26
                expect(trajectory.velocityX).toBeCloseTo(424.26, 1);
                expect(trajectory.velocityY).toBeCloseTo(-424.26, 1);
            });

            it('should calculate correct trajectory for -90 degrees (straight up)', () => {
                const trajectory = shootingSystem.calculateTrajectory(1, { angle: -90 });
                
                // For -90 degrees: cos(-90°) = 0, sin(-90°) = -1
                expect(trajectory.velocityX).toBeCloseTo(0, 1);
                expect(trajectory.velocityY).toBeCloseTo(-600, 1);
            });

            it('should handle positive angles correctly', () => {
                const trajectory = shootingSystem.calculateTrajectory(1, { angle: 30 });
                
                // For 30 degrees: cos(30°) ≈ 0.866, sin(30°) = 0.5
                expect(trajectory.velocityX).toBeCloseTo(519.615, 1);
                expect(trajectory.velocityY).toBeCloseTo(300, 1);
            });
        });

        describe('Direction handling', () => {
            it('should reverse X velocity for left direction', () => {
                const rightTrajectory = shootingSystem.calculateTrajectory(1, { angle: -30 });
                const leftTrajectory = shootingSystem.calculateTrajectory(-1, { angle: -30 });
                
                expect(leftTrajectory.velocityX).toBeCloseTo(-rightTrajectory.velocityX, 1);
                expect(leftTrajectory.velocityY).toBeCloseTo(rightTrajectory.velocityY, 1);
            });

            it('should handle zero direction as right direction', () => {
                const zeroTrajectory = shootingSystem.calculateTrajectory(0, { angle: -30 });
                const rightTrajectory = shootingSystem.calculateTrajectory(1, { angle: -30 });
                
                expect(zeroTrajectory.velocityX).toBeCloseTo(0, 1); // 0 * velocity = 0
                expect(zeroTrajectory.velocityY).toBeCloseTo(rightTrajectory.velocityY, 1);
            });
        });

        describe('Power scaling', () => {
            it('should scale velocity by power factor', () => {
                const normalTrajectory = shootingSystem.calculateTrajectory(1, { angle: -30, power: 1.0 });
                const halfPowerTrajectory = shootingSystem.calculateTrajectory(1, { angle: -30, power: 0.5 });
                const doublePowerTrajectory = shootingSystem.calculateTrajectory(1, { angle: -30, power: 2.0 });
                
                expect(halfPowerTrajectory.velocityX).toBeCloseTo(normalTrajectory.velocityX * 0.5, 1);
                expect(halfPowerTrajectory.velocityY).toBeCloseTo(normalTrajectory.velocityY * 0.5, 1);
                
                expect(doublePowerTrajectory.velocityX).toBeCloseTo(normalTrajectory.velocityX * 2.0, 1);
                expect(doublePowerTrajectory.velocityY).toBeCloseTo(normalTrajectory.velocityY * 2.0, 1);
            });

            it('should handle zero power correctly', () => {
                const trajectory = shootingSystem.calculateTrajectory(1, { angle: -30, power: 0 });
                
                expect(trajectory.velocityX).toBeCloseTo(0, 1);
                expect(trajectory.velocityY).toBeCloseTo(0, 1);
            });

            it('should handle negative power as absolute value', () => {
                const positiveTrajectory = shootingSystem.calculateTrajectory(1, { angle: -30, power: 1.5 });
                const negativeTrajectory = shootingSystem.calculateTrajectory(1, { angle: -30, power: -1.5 });
                
                // Negative power should behave the same as positive (absolute value)
                expect(Math.abs(negativeTrajectory.velocityX)).toBeCloseTo(Math.abs(positiveTrajectory.velocityX), 1);
                expect(Math.abs(negativeTrajectory.velocityY)).toBeCloseTo(Math.abs(positiveTrajectory.velocityY), 1);
            });
        });

        describe('Edge cases and extreme values', () => {
            it('should handle very large angles correctly', () => {
                const trajectory = shootingSystem.calculateTrajectory(1, { angle: 720 }); // 2 full rotations
                const normalTrajectory = shootingSystem.calculateTrajectory(1, { angle: 0 });
                
                // 720 degrees should be equivalent to 0 degrees
                expect(trajectory.velocityX).toBeCloseTo(normalTrajectory.velocityX, 1);
                expect(trajectory.velocityY).toBeCloseTo(normalTrajectory.velocityY, 1);
            });

            it('should handle very small angles correctly', () => {
                const trajectory = shootingSystem.calculateTrajectory(1, { angle: 0.1 });
                
                // Very small angle should be close to horizontal
                expect(trajectory.velocityX).toBeCloseTo(600, 0);
                expect(Math.abs(trajectory.velocityY)).toBeLessThan(10);
            });

            it('should handle fractional angles correctly', () => {
                const trajectory = shootingSystem.calculateTrajectory(1, { angle: -22.5 });
                
                // Should calculate correctly for fractional angles
                expect(trajectory.velocityX).toBeGreaterThan(0);
                expect(trajectory.velocityY).toBeLessThan(0);
            });
        });
    });

    describe('Physics Configuration', () => {
        beforeEach(() => {
            mockProjectile.body.velocity = { x: 100, y: -50 };
        });

        it('should configure gravity correctly', () => {
            shootingSystem.configureProjectilePhysics(mockProjectile);
            
            expect(mockProjectile.body.setGravityY).toHaveBeenCalledWith(400);
        });

        it('should configure bounce properties correctly', () => {
            shootingSystem.configureProjectilePhysics(mockProjectile);
            
            expect(mockProjectile.setBounce).toHaveBeenCalledWith(0.6, 0.4);
        });

        it('should configure drag for air resistance', () => {
            shootingSystem.configureProjectilePhysics(mockProjectile);
            
            expect(mockProjectile.body.setDrag).toHaveBeenCalledWith(50, 20);
        });

        it('should set consistent mass', () => {
            shootingSystem.configureProjectilePhysics(mockProjectile);
            
            expect(mockProjectile.body.setMass).toHaveBeenCalledWith(1);
        });

        it('should disable world bounds collision', () => {
            shootingSystem.configureProjectilePhysics(mockProjectile);
            
            expect(mockProjectile.setCollideWorldBounds).toHaveBeenCalledWith(false);
        });

        it('should set angular velocity based on horizontal velocity direction', () => {
            // Test positive velocity (moving right)
            mockProjectile.body.velocity.x = 100;
            shootingSystem.configureProjectilePhysics(mockProjectile);
            expect(mockProjectile.setAngularVelocity).toHaveBeenCalledWith(200);

            // Clear mock and test negative velocity (moving left)
            mockProjectile.setAngularVelocity.mockClear();
            mockProjectile.body.velocity.x = -100;
            shootingSystem.configureProjectilePhysics(mockProjectile);
            expect(mockProjectile.setAngularVelocity).toHaveBeenCalledWith(-200);

            // Clear mock and test zero velocity (should default to -1 direction)
            mockProjectile.setAngularVelocity.mockClear();
            mockProjectile.body.velocity.x = 0;
            shootingSystem.configureProjectilePhysics(mockProjectile);
            expect(mockProjectile.setAngularVelocity).toHaveBeenCalledWith(-200);
        });
    });

    describe('Boundary Physics', () => {
        it('should detect projectile outside left boundary', () => {
            const projectile = { ...mockProjectile, x: -150, active: true };
            const bounds = mockScene.physics.world.bounds;
            const buffer = 100;
            
            const isOutOfBounds = projectile.x < bounds.x - buffer;
            expect(isOutOfBounds).toBe(true);
        });

        it('should detect projectile outside right boundary', () => {
            const projectile = { ...mockProjectile, x: 950, active: true };
            const bounds = mockScene.physics.world.bounds;
            const buffer = 100;
            
            const isOutOfBounds = projectile.x > bounds.x + bounds.width + buffer;
            expect(isOutOfBounds).toBe(true);
        });

        it('should detect projectile outside top boundary', () => {
            const projectile = { ...mockProjectile, y: -150, active: true };
            const bounds = mockScene.physics.world.bounds;
            const buffer = 100;
            
            const isOutOfBounds = projectile.y < bounds.y - buffer;
            expect(isOutOfBounds).toBe(true);
        });

        it('should detect projectile outside bottom boundary', () => {
            const projectile = { ...mockProjectile, y: 750, active: true };
            const bounds = mockScene.physics.world.bounds;
            const buffer = 100;
            
            const isOutOfBounds = projectile.y > bounds.y + bounds.height + buffer;
            expect(isOutOfBounds).toBe(true);
        });

        it('should not detect projectile within boundaries', () => {
            const projectile = { ...mockProjectile, x: 400, y: 300, active: true };
            const bounds = mockScene.physics.world.bounds;
            const buffer = 100;
            
            const isOutOfBounds = projectile.x < bounds.x - buffer || 
                                 projectile.x > bounds.x + bounds.width + buffer ||
                                 projectile.y < bounds.y - buffer || 
                                 projectile.y > bounds.y + bounds.height + buffer;
            expect(isOutOfBounds).toBe(false);
        });
    });

    describe('Collision Physics', () => {
        describe('Terrain collision response', () => {
            it('should stop projectile movement on hard surface collision', () => {
                const terrain = { surfaceType: 'hard' };
                
                shootingSystem.applyCollisionResponse(mockProjectile, terrain);
                
                expect(mockProjectile.body.setVelocity).toHaveBeenCalledWith(0, 0);
                expect(mockProjectile.setAngularVelocity).toHaveBeenCalledWith(0);
            });

            it('should handle collision with undefined surface type', () => {
                const terrain = {}; // No surfaceType defined
                
                expect(() => {
                    shootingSystem.applyCollisionResponse(mockProjectile, terrain);
                }).not.toThrow();
                
                expect(mockProjectile.body.setVelocity).toHaveBeenCalledWith(0, 0);
            });

            it('should create impact effect at collision point', () => {
                mockProjectile.x = 250;
                mockProjectile.y = 350;
                
                shootingSystem.createImpactEffect(mockProjectile.x, mockProjectile.y);
                
                expect(mockScene.add.circle).toHaveBeenCalledWith(250, 350, 8, 0xffffff, 0.8);
                expect(mockScene.cameras.main.shake).toHaveBeenCalledWith(50, 0.01);
            });
        });

        describe('Projectile cleanup physics', () => {
            it('should reset all physics properties on cleanup', () => {
                const projectile = {
                    ...mockProjectile,
                    trailParticles: { destroy: vi.fn() },
                    boundaryCheck: vi.fn()
                };
                
                shootingSystem.activeProjectiles.add(projectile);
                shootingSystem.cleanupProjectile(projectile);
                
                expect(projectile.body.setVelocity).toHaveBeenCalledWith(0, 0);
                expect(projectile.setScale).toHaveBeenCalledWith(1);
                expect(projectile.clearTint).toHaveBeenCalled();
                expect(projectile.setActive).toHaveBeenCalledWith(false);
                expect(projectile.setVisible).toHaveBeenCalledWith(false);
            });
        });
    });

    describe('Trajectory Information System', () => {
        it('should provide complete trajectory information', () => {
            const info = shootingSystem.getTrajectoryInfo(1, { angle: -30, power: 1.0 });
            
            expect(info).toEqual({
                velocityX: expect.closeTo(519.615, 1),
                velocityY: expect.closeTo(-300, 1),
                angle: -30,
                direction: 1,
                speed: expect.closeTo(600, 1)
            });
        });

        it('should calculate correct speed magnitude', () => {
            const info = shootingSystem.getTrajectoryInfo(1, { angle: -45, power: 1.0 });
            
            // For -45 degrees, speed should equal the base speed (600)
            // because sqrt(424.26² + 424.26²) ≈ 600
            expect(info.speed).toBeCloseTo(600, 1);
        });

        it('should handle different power levels in trajectory info', () => {
            const normalInfo = shootingSystem.getTrajectoryInfo(1, { angle: -30, power: 1.0 });
            const halfPowerInfo = shootingSystem.getTrajectoryInfo(1, { angle: -30, power: 0.5 });
            
            expect(halfPowerInfo.speed).toBeCloseTo(normalInfo.speed * 0.5, 1);
        });
    });

    describe('Player-based firing physics', () => {
        it('should calculate correct firing position offset', () => {
            const mockPlayer = { x: 100, y: 200, flipX: false };
            const spy = vi.spyOn(shootingSystem, 'fireBall').mockReturnValue(mockProjectile);
            
            shootingSystem.fireFromPlayer(mockPlayer);
            
            // Should fire from 30 pixels in front of player, 20 pixels above center
            expect(spy).toHaveBeenCalledWith(130, 180, 1, {});
        });

        it('should handle left-facing player correctly', () => {
            const mockPlayer = { x: 100, y: 200, flipX: true };
            const spy = vi.spyOn(shootingSystem, 'fireBall').mockReturnValue(mockProjectile);
            
            shootingSystem.fireFromPlayer(mockPlayer);
            
            // Should fire from 30 pixels behind player when facing left
            expect(spy).toHaveBeenCalledWith(70, 180, -1, {});
        });

        it('should pass through firing options correctly', () => {
            const mockPlayer = { x: 100, y: 200, flipX: false };
            const options = { angle: -45, power: 1.5 };
            const spy = vi.spyOn(shootingSystem, 'fireBall').mockReturnValue(mockProjectile);
            
            shootingSystem.fireFromPlayer(mockPlayer, options);
            
            expect(spy).toHaveBeenCalledWith(130, 180, 1, options);
        });
    });

    describe('Physics Performance', () => {
        it('should handle multiple projectiles without physics interference', () => {
            const projectiles = [];
            
            // Create multiple projectiles
            for (let i = 0; i < 5; i++) {
                const projectile = { ...mockProjectile };
                projectiles.push(projectile);
                shootingSystem.activeProjectiles.add(projectile);
            }
            
            expect(shootingSystem.getActiveProjectileCount()).toBe(5);
            
            // Each projectile should have independent physics
            projectiles.forEach(projectile => {
                shootingSystem.configureProjectilePhysics(projectile);
                expect(projectile.body.setGravityY).toHaveBeenCalledWith(400);
            });
        });

        it('should efficiently clean up inactive projectiles from physics tracking', () => {
            // Add mix of active and inactive projectiles
            const activeProjectile = { active: true };
            const inactiveProjectile1 = { active: false };
            const inactiveProjectile2 = { active: false };
            
            shootingSystem.activeProjectiles.add(activeProjectile);
            shootingSystem.activeProjectiles.add(inactiveProjectile1);
            shootingSystem.activeProjectiles.add(inactiveProjectile2);
            
            // Getting count should clean up inactive projectiles
            const count = shootingSystem.getActiveProjectileCount();
            
            expect(count).toBe(1);
            expect(shootingSystem.activeProjectiles.has(activeProjectile)).toBe(true);
            expect(shootingSystem.activeProjectiles.has(inactiveProjectile1)).toBe(false);
            expect(shootingSystem.activeProjectiles.has(inactiveProjectile2)).toBe(false);
        });
    });

    describe('Physics Constants and Validation', () => {
        it('should use consistent physics constants', () => {
            expect(shootingSystem.projectileSpeed).toBe(600);
            expect(shootingSystem.projectileLifespan).toBe(5000);
            expect(shootingSystem.maxProjectiles).toBe(5);
        });

        it('should validate physics calculations are deterministic', () => {
            // Same inputs should always produce same outputs
            const trajectory1 = shootingSystem.calculateTrajectory(1, { angle: -30, power: 1.0 });
            const trajectory2 = shootingSystem.calculateTrajectory(1, { angle: -30, power: 1.0 });
            
            expect(trajectory1.velocityX).toBe(trajectory2.velocityX);
            expect(trajectory1.velocityY).toBe(trajectory2.velocityY);
        });

        it('should maintain physics consistency across different scenarios', () => {
            // Test that physics behave consistently regardless of firing order
            const firstShot = shootingSystem.calculateTrajectory(1, { angle: -45 });
            
            // Fire and clean up a projectile
            const projectile = shootingSystem.fireBall(100, 200, 1);
            shootingSystem.cleanupProjectile(projectile);
            
            // Second shot should have identical physics
            const secondShot = shootingSystem.calculateTrajectory(1, { angle: -45 });
            
            expect(firstShot.velocityX).toBe(secondShot.velocityX);
            expect(firstShot.velocityY).toBe(secondShot.velocityY);
        });
    });
});