// Main Game Configuration
const config = {
    type: Phaser.AUTO,
    width: 960,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    render: {
        pixelArt: true,
        antialias: false
    },
    scene: [BootScene, GameScene, CompleteScene],
    parent: 'game-container'
};

const game = new Phaser.Game(config);

// Boot Scene - Load assets
class BootScene extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        // Create simple pixel art graphics
        this.createPixelArt();
    }

    create() {
        this.scene.start('Game');
    }

    createPixelArt() {
        // Create a graphics object to generate pixel sprites
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });

        // Player sprite
        graphics.fillStyle(0x00FF00, 1);
        graphics.fillRect(0, 0, 16, 24);
        graphics.fillStyle(0xFFFFCC, 1);
        graphics.fillRect(2, 1, 12, 8);
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(4, 3, 2, 2);
        graphics.fillRect(10, 3, 2, 2);
        graphics.generateTexture('player', 16, 24);

        // Enemy sprite - demon/injustice
        graphics.fillStyle(0xFF0000, 1);
        graphics.fillRect(0, 0, 16, 20);
        graphics.fillStyle(0xFF6600, 1);
        graphics.fillRect(2, 1, 12, 10);
        graphics.fillStyle(0xFFFF00, 1);
        graphics.fillRect(3, 3, 3, 3);
        graphics.fillRect(10, 3, 3, 3);
        graphics.generateTexture('enemy', 16, 20);

        // NPC sprite - person in need
        graphics.fillStyle(0x0066FF, 1);
        graphics.fillRect(0, 0, 14, 22);
        graphics.fillStyle(0xFFCCCC, 1);
        graphics.fillRect(2, 1, 10, 8);
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(4, 2, 2, 2);
        graphics.fillRect(8, 2, 2, 2);
        graphics.generateTexture('npc', 14, 22);

        // Heart (kindness buff)
        graphics.fillStyle(0xFF1493, 1);
        graphics.fillRect(2, 0, 6, 6);
        graphics.fillRect(8, 0, 6, 6);
        graphics.fillRect(1, 1, 12, 8);
        graphics.generateTexture('heart', 14, 10);

        // Projectile
        graphics.fillStyle(0xFFFF00, 1);
        graphics.fillRect(0, 0, 6, 6);
        graphics.generateTexture('projectile', 6, 6);

        graphics.destroy();
    }
}

// Main Game Scene
class GameScene extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    init() {
        this.gameTime = 0;
        this.maxGameTime = 900000; // 15 minutes in milliseconds
        this.questsCompleted = 0;
        this.injusticeDefeated = 0;
        this.kindnessSpread = 0;
    }

    create() {
        this.cameras.main.setBackgroundColor('#87CEEB');
        
        // Create world
        this.createWorld();
        
        // Create player
        this.createPlayer();
        
        // Create enemies
        this.enemies = this.physics.add.group();
        this.spawnEnemies();
        
        // Create NPCs
        this.npcs = this.physics.add.group();
        this.spawnNPCs();
        
        // Create items
        this.items = this.physics.add.group();
        
        // Projectiles
        this.projectiles = this.physics.add.group();
        
        // Colliders
        this.physics.add.overlap(this.projectiles, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.npcs, this.talkToNPC, null, this);
        this.physics.add.overlap(this.player, this.items, this.collectItem, null, this);
        this.physics.add.overlap(this.enemies, this.player, this.hitByEnemy, null, this);
        
        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown-SPACE', this.attackEnemy, this);
        
        // UI
        this.createUI();
        
        // Start spawning
        this.time.addEvent({
            delay: 3000,
            callback: this.spawnEnemies,
            callbackScope: this,
            loop: true
        });

        this.time.addEvent({
            delay: 5000,
            callback: this.spawnNPCs,
            callbackScope: this,
            loop: true
        });
    }

    createWorld() {
        // Add some background visual elements
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0x90EE90, 0.3);
        graphics.fillRect(0, 400, 960, 200);
        graphics.generateTexture('ground', 960, 200);
        graphics.destroy();

        this.add.sprite(480, 500, 'ground');
    }

    createPlayer() {
        this.player = this.physics.add.sprite(480, 300, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0.2);
        this.player.health = 100;
        this.player.maxHealth = 100;
        this.player.attackCooldown = 0;
        this.player.maxAttackCooldown = 300;
        
        // Add name
        this.add.text(this.player.x - 15, this.player.y - 35, 'You', {
            fontSize: '12px',
            fill: '#000000',
            backgroundColor: '#FFFFFF',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5);
    }

    createUI() {
        this.uiTexts = {
            health: this.add.text(10, 10, '', { fontSize: '16px', fill: '#FF0000' }),
            quest: this.add.text(10, 40, '', { fontSize: '14px', fill: '#0066FF' }),
            stats: this.add.text(10, 70, '', { fontSize: '12px', fill: '#000000' }),
            time: this.add.text(850, 10, '', { fontSize: '14px', fill: '#000000' })
        };
        this.uiTexts.health.setScrollFactor(0);
        this.uiTexts.quest.setScrollFactor(0);
        this.uiTexts.stats.setScrollFactor(0);
        this.uiTexts.time.setScrollFactor(0);
    }

    update(time, delta) {
        this.gameTime += delta;

        // Check time limit
        if (this.gameTime >= this.maxGameTime) {
            this.scene.start('Complete', {
                questsCompleted: this.questsCompleted,
                injusticeDefeated: this.injusticeDefeated,
                kindnessSpread: this.kindnessSpread
            });
        }

        // Player movement
        this.player.setVelocity(0);
        if (this.cursors.left.isDown) this.player.setVelocityX(-160);
        if (this.cursors.right.isDown) this.player.setVelocityX(160);
        if (this.cursors.up.isDown) this.player.setVelocityY(-160);
        if (this.cursors.down.isDown) this.player.setVelocityY(160);

        // Update attack cooldown
        if (this.player.attackCooldown > 0) {
            this.player.attackCooldown -= delta;
        }

        // Enemy AI
        this.enemies.children.entries.forEach(enemy => {
            const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
            if (distance < 200) {
                const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                enemy.setVelocity(Math.cos(angle) * 80, Math.sin(angle) * 80);
            } else {
                enemy.setVelocity(0);
            }
        });

        // Update UI
        this.updateUI(time);

        // Remove off-world projectiles
        this.projectiles.children.entries.forEach(projectile => {
            if (projectile.x < 0 || projectile.x > 960 || projectile.y < 0 || projectile.y > 600) {
                projectile.destroy();
            }
        });
    }

    updateUI(time) {
        const timeRemaining = Math.max(0, 15 - Math.floor(this.gameTime / 60000));
        this.uiTexts.health.setText(`❤ ${this.player.health}/${this.player.maxHealth}`);
        this.uiTexts.quest.setText(`📋 Quests: ${this.questsCompleted}`);
        this.uiTexts.stats.setText(`⚔ Injustice Defeated: ${this.injusticeDefeated} | 💕 Kindness: ${this.kindnessSpread}`);
        this.uiTexts.time.setText(`Time: ${timeRemaining}m`);
    }

    attackEnemy() {
        if (this.player.attackCooldown > 0) return;

        this.player.attackCooldown = this.player.maxAttackCooldown;

        // Fire projectile in direction player is facing
        const angle = this.player.flipX ? Math.PI : 0;
        const projectile = this.physics.add.sprite(this.player.x, this.player.y, 'projectile');
        projectile.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300);
        this.projectiles.add(projectile);

        // Sound effect (visual feedback)
        this.tweens.add({
            targets: this.player,
            scaleX: 1.1,
            scaleY: 0.9,
            duration: 50,
            yoyo: true
        });
    }

    spawnEnemies() {
        if (this.enemies.children.entries.length < 5) {
            const x = Phaser.Math.Between(0, 960);
            const y = Phaser.Math.Between(0, 300);
            const enemy = this.physics.add.sprite(x, y, 'enemy');
            enemy.setCollideWorldBounds(true);
            enemy.setBounce(0.8);
            enemy.health = 20;
            this.enemies.add(enemy);

            const questText = [
                'Corrupt System',
                'Greed',
                'Inequality',
                'Injustice',
                'Selfishness'
            ];
            
            this.add.text(enemy.x - 25, enemy.y - 30, questText[Phaser.Math.Between(0, 4)], {
                fontSize: '10px',
                fill: '#FF0000',
                backgroundColor: '#FFFFFF'
            }).setOrigin(0.5);
        }
    }

    spawnNPCs() {
        if (this.npcs.children.entries.length < 3) {
            const x = Phaser.Math.Between(100, 860);
            const y = Phaser.Math.Between(50, 350);
            const npc = this.physics.add.sprite(x, y, 'npc');
            npc.questCompleted = false;
            npc.questType = Phaser.Utils.Array.GetRandom([
                'Help the needy',
                'Protect the weak',
                'Share resources',
                'Show compassion',
                'Build community'
            ]);
            this.npcs.add(npc);

            this.add.text(npc.x - 20, npc.y - 30, npc.questType, {
                fontSize: '10px',
                fill: '#0066FF',
                backgroundColor: '#FFFFCC'
            }).setOrigin(0.5);
        }
    }

    hitEnemy(projectile, enemy) {
        projectile.destroy();
        enemy.health -= 10;

        this.tweens.add({
            targets: enemy,
            tint: 0xFF0000,
            duration: 100,
            yoyo: true
        });

        if (enemy.health <= 0) {
            enemy.destroy();
            this.injusticeDefeated++;
            
            // Drop a heart
            const heart = this.physics.add.sprite(enemy.x, enemy.y, 'heart');
            this.items.add(heart);
        }
    }

    talkToNPC(player, npc) {
        if (!npc.questCompleted) {
            npc.questCompleted = true;
            this.questsCompleted++;
            this.kindnessSpread += 25;

            this.tweens.add({
                targets: npc,
                scaleX: 1.3,
                scaleY: 1.3,
                duration: 300,
                yoyo: true
            });

            // Show text
            this.add.text(npc.x, npc.y - 40, '✓ Quest Complete!', {
                fontSize: '12px',
                fill: '#00FF00',
                backgroundColor: '#000000'
            }).setOrigin(0.5).setDepth(10).setScrollFactor(0);

            setTimeout(() => npc.destroy(), 100);
        }
    }

    collectItem(player, item) {
        item.destroy();
        this.player.health = Math.min(this.player.maxHealth, this.player.health + 15);
        this.kindnessSpread += 10;

        this.tweens.add({
            targets: this.player,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 200,
            yoyo: true
        });
    }

    hitByEnemy(player, enemy) {
        this.player.health -= 5;

        this.tweens.add({
            targets: this.player,
            tint: 0xFF0000,
            duration: 100,
            yoyo: true
        });

        if (this.player.health <= 0) {
            this.scene.start('Complete', {
                questsCompleted: this.questsCompleted,
                injusticeDefeated: this.injusticeDefeated,
                kindnessSpread: this.kindnessSpread
            });
        }
    }
}

// Completion Scene
class CompleteScene extends Phaser.Scene {
    constructor() {
        super('Complete');
    }

    init(data) {
        this.finalStats = data;
    }

    create() {
        this.cameras.main.setBackgroundColor('#FFD700');

        this.add.text(480, 100, 'Mission Complete!', {
            fontSize: '48px',
            fill: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(480, 200, `Quests Completed: ${this.finalStats.questsCompleted}`, {
            fontSize: '24px',
            fill: '#0066FF'
        }).setOrigin(0.5);

        this.add.text(480, 250, `Injustice Defeated: ${this.finalStats.injusticeDefeated}`, {
            fontSize: '24px',
            fill: '#FF0000'
        }).setOrigin(0.5);

        this.add.text(480, 300, `Kindness Spread: ${this.finalStats.kindnessSpread}`, {
            fontSize: '24px',
            fill: '#FF1493'
        }).setOrigin(0.5);

        const totalScore = this.finalStats.questsCompleted * 100 + this.finalStats.injusticeDefeated * 50 + this.finalStats.kindnessSpread;
        this.add.text(480, 380, `Total Score: ${totalScore}`, {
            fontSize: '32px',
            fill: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(480, 500, 'Press SPACE to play again', {
            fontSize: '18px',
            fill: '#000000'
        }).setOrigin(0.5);

        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('Game');
        });
    }
}
