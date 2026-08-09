import Phaser from 'phaser'

const LEVEL_WIDTH = 6400

export default class SpaceLevel extends Phaser.Scene {
    constructor() {
        super('spaceLevel')
        this.completed = false
    }

    create() {
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x090b2a).setOrigin(0)
        const stars = this.add.graphics()
        for (let i = 0; i < 180; i += 1) {
            stars.fillStyle(i % 5 === 0 ? 0x8ee7ff : 0xffffff, 0.65)
            stars.fillCircle(Phaser.Math.Between(0, LEVEL_WIDTH), Phaser.Math.Between(20, this.scale.height - 80), Phaser.Math.Between(1, 3))
        }
        this.physics.world.setBounds(0, 0, LEVEL_WIDTH, this.scale.height)
        this.player = this.physics.add.rectangle(120, this.scale.height / 2, 42, 42, 0x65f4ff)
        this.player.body.setAllowGravity(false)
        this.player.body.setCollideWorldBounds(true)
        this.cursors = this.input.keyboard.createCursorKeys()

        const obstacles = this.physics.add.staticGroup()
        for (let x = 650; x < LEVEL_WIDTH - 400; x += 700) {
            obstacles.add(this.add.rectangle(x, Phaser.Math.Between(140, this.scale.height - 180), 80, 80, 0xff5f8f))
        }
        this.physics.add.overlap(this.player, obstacles, () => this.player.setPosition(120, this.scale.height / 2))

        const goal = this.add.rectangle(LEVEL_WIDTH - 120, this.scale.height / 2, 40, this.scale.height, 0x7dff9b, 0)
        this.physics.add.existing(goal, true)
        this.physics.add.overlap(this.player, goal, this.complete, null, this)
        this.add.text(24, 24, 'LEVEL 2 - GALAXY', { fontSize: '32px', color: '#8ee7ff' }).setScrollFactor(0)
        this.cameras.main.setBounds(0, 0, LEVEL_WIDTH, this.scale.height)
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08)
    }

    update() {
        if (!this.player || this.completed) return
        this.player.body.setVelocity(260, 0)
        if (this.cursors.up.isDown) this.player.body.setVelocityY(-220)
        if (this.cursors.down.isDown) this.player.body.setVelocityY(220)
    }

    complete() {
        if (this.completed) return
        this.completed = true
        this.scene.start('mazeChallenge', {
            parentScene: this,
            onComplete: () => this.scene.start('game', { level: 3 })
        })
    }
}
