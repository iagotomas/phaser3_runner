import { describe, it, expect, vi } from 'vitest'
import Boss from './boss'

describe('Boss', () => {
    it('should initialize with correct health', () => {
        const mockScene = {
            add: { graphics: vi.fn().mockReturnValue({ clear: vi.fn(), fillStyle: vi.fn(), fillRect: vi.fn(), destroy: vi.fn() }) },
            events: { emit: vi.fn() },
            sys: { 
                queueDepthSort: vi.fn(),
                displayList: { add: vi.fn() }, 
                updateList: { add: vi.fn() },
                events: { on: vi.fn() }
            },
            scene: {
                events: { emit: vi.fn() }
            },
            anims: {
                create: vi.fn(),
                get: vi.fn()
            },
            game: {
                events: { on: vi.fn() }
            }
        }
        mockScene.sys.game = mockScene.game
        
        const boss = new Boss(mockScene, 100, 100, 'boss', 'frame', { health: 50 })
        expect(boss.health).toBe(50)
        expect(boss.maxHealth).toBe(50)
    })

    it('should change phase when health drops', () => {
        const mockScene = {
            add: { graphics: vi.fn().mockReturnValue({ clear: vi.fn(), fillStyle: vi.fn(), fillRect: vi.fn(), destroy: vi.fn() }) },
            events: { emit: vi.fn() }
        }
        const boss = new Boss(mockScene, 100, 100, 'boss', 'frame', { health: 100 })
        
        boss.takeDamage(40) // 60/100 = 0.6 (Phase 2)
        expect(boss.phase).toBe(2)
        
        boss.takeDamage(40) // 20/100 = 0.2 (Phase 3)
        expect(boss.phase).toBe(3)
    })
})
