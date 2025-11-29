// Global game state
const gameState = {
    miniGameCompleted: false,
    triviaCompleted: false,
    volume: 0.5,
    hints: {
        miniGame: "The first gift, on your birthday, is something to do with 3 columns!",
        trivia: "The second gift, 2 days after your birthday, is something you can wear!"
    }
};

// ============ SOUND MANAGER ============
const soundManager = {
    sounds: {},
    loaded: false,

    // Initialize and preload all sounds
    init: function (scene) {
        const soundFiles = [
            'click', 'hover', 'complete', 'countdown',
            'blow', 'correct', 'wrong', 'reveal'
        ];

        soundFiles.forEach(name => {
            try {
                // Try to load sound, but don't fail if file doesn't exist
                scene.load.audio(name, `audio/${name}.mp3`);
            } catch (e) {
                console.log(`Sound ${name} not available (placeholder)`);
            }
        });
    },

    // Create sound objects after loading
    create: function (scene) {
        const soundFiles = [
            'click', 'hover', 'complete', 'countdown',
            'blow', 'correct', 'wrong', 'reveal'
        ];

        soundFiles.forEach(name => {
            try {
                this.sounds[name] = scene.sound.add(name, { volume: gameState.volume });
            } catch (e) {
                // Placeholder - sound file doesn't exist yet
                this.sounds[name] = null;
            }
        });
        this.loaded = true;
    },

    // Play a sound
    play: function (name) {
        if (this.loaded && this.sounds[name]) {
            this.sounds[name].setVolume(gameState.volume);
            this.sounds[name].play();
        }
    },

    // Update all sound volumes
    updateVolume: function (volume) {
        Object.values(this.sounds).forEach(sound => {
            if (sound) sound.setVolume(volume);
        });
    }
};

// ============ MENU SCENE ============
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    preload() {
        // Load all sounds
        soundManager.init(this);
    }

    create() {
        // Initialize sounds (first time only)
        if (!soundManager.loaded) {
            soundManager.create(this);
        }

        const { width, height } = this.cameras.main;

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0xFFD4E5);

        // Title
        const title = this.add.text(width / 2, 150, 'MINI BIRTHDAY GIFT!', {
            fontSize: '64px',
            fontFamily: 'Fredoka One, Comic Sans MS',
            color: '#EFB0C9',
            stroke: '#FFFFFF',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Note
        this.add.text(width / 2, 220, 'You can zoom out if the frame is too big, I recommend 80%', {
            fontSize: '10px',
            fontFamily: 'Fredoka One, Comic Sans MS',
            color: '#D9605C',
            alpha: 0.7
        }).setOrigin(0.5);

        // Buttons
        this.createButton(width / 2, 300, 'Start', () => {
            this.scene.start('HubScene');
        });

        this.createButton(width / 2, 400, 'Settings', () => {
            this.scene.launch('SettingsScene');
            this.scene.pause();
        });

        this.createButton(width / 2, 500, 'Cake', () => {
            this.scene.launch('CakeScene');
            this.scene.pause();
        });
    }

    createButton(x, y, text, callback) {
        const button = this.add.container(x, y);

        const bg = this.add.rectangle(0, 0, 250, 70, 0xFFDAB9)
            .setStrokeStyle(4, 0xFFFFFF);

        const label = this.add.text(0, 0, text, {
            fontSize: '32px',
            fontFamily: 'Fredoka One, Comic Sans MS',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        button.add([bg, label]);
        button.setSize(250, 70);
        button.setInteractive({ useHandCursor: true });

        button.on('pointerover', () => {
            bg.setFillStyle(0xEFB0C9);
            button.setScale(1.05);
            soundManager.play('hover');
        });

        button.on('pointerout', () => {
            bg.setFillStyle(0xFFDAB9);
            button.setScale(1);
        });

        button.on('pointerdown', () => {
            soundManager.play('click');
            // Scale animation
            this.tweens.add({
                targets: button,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 100,
                yoyo: true
            });
            callback();
        });

        return button;
    }
}

// ============ CAKE SCENE ============
class CakeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CakeScene' });
    }

    create() {
        const { width, height } = this.cameras.main;

        // Semi-transparent overlay
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5);

        // Popup container
        const popup = this.add.container(width / 2, height / 2);

        // Popup background
        const popupBg = this.add.rectangle(0, 0, 500, 600, 0xFFD4E5)
            .setStrokeStyle(5, 0xFFFFFF);

        // Instruction note
        const instructionNote = this.add.text(0, 210, 'Press "Make a Wish" to start a countdown,\nthen blow the cake when the countdown ends!   Don\'t forget to make a wish!!', {
            fontSize: '11px',
            fontFamily: 'Fredoka One, Comic Sans MS',
            color: '#D9605C',
            alpha: 0.7,
            align: 'center',
            wordWrap: { width: 280 }
        }).setOrigin(0.5);

        // Cake placeholder
        // const cakeBase = this.add.rectangle(0, -50, 200, 100, 0xFFD4E5);
        const cakeBase = this.add.rectangle(0, -30, 200, 100, 0xD9605C);
        const cakeMiddle = this.add.rectangle(0, -100, 160, 80, 0xD94446);
        const cakeTop = this.add.rectangle(0, -160, 120, 60, 0xFA5053);

        // Candle
        const candle = this.add.rectangle(0, -210, 10, 40, 0xFFFFE0);
        const flame = this.add.circle(0, -235, 8, 0xFFA500);
        this.flame = flame;

        // Button
        const button = this.createButton(0, 150, 'Make a Wish', () => {
            this.startCountdown();
        });

        popup.add([popupBg, instructionNote, cakeBase, cakeMiddle, cakeTop, candle, flame, button]);

        // Close button
        this.createCloseButton(width / 2 + 220, height / 2 - 280);
    }

    startCountdown() {
        const { width, height } = this.cameras.main;

        let count = 3;
        const countText = this.add.text(width / 2, height / 2 - 100, count.toString(), {
            fontSize: '120px',
            fontFamily: 'Fredoka One, Comic Sans MS',
            color: '#EFB0C9',
            stroke: '#FFFFFF',
            strokeThickness: 8
        }).setOrigin(0.5);

        const timer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                count--;
                soundManager.play('countdown');
                if (count > 0) {
                    countText.setText(count.toString());
                } else {
                    countText.destroy();
                    this.blowCandle();
                }
            },
            repeat: 2
        });
    }

    blowCandle() {
        soundManager.play('blow');
        // Blow out candle
        this.tweens.add({
            targets: this.flame,
            alpha: 0,
            duration: 300
        });

        // Confetti particles
        const { width, height } = this.cameras.main;
        const colors = [0xEFB0C9, 0xFFDAB9, 0xFFD4E5, 0xC8E6C9, 0xFFE8CC];

        for (let i = 0; i < 50; i++) {
            const x = width / 2 + Phaser.Math.Between(-100, 100);
            const y = height / 2 - 200;
            const color = Phaser.Utils.Array.GetRandom(colors);

            const particle = this.add.rectangle(x, y, 10, 10, color);

            this.tweens.add({
                targets: particle,
                x: x + Phaser.Math.Between(-200, 200),
                y: y + Phaser.Math.Between(200, 400),
                rotation: Phaser.Math.Between(0, 360),
                alpha: 0,
                duration: 2000,
                ease: 'Cubic.out'
            });
        }

        // Happy Birthday text
        const text = this.add.text(width / 2, height / 2 + 150, 'Happy Birthday!', {
            fontSize: '48px',
            fontFamily: 'Fredoka One, Comic Sans MS',
            color: '#EFB0C9',
            stroke: '#FFFFFF',
            strokeThickness: 6
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: text,
            alpha: 1,
            scale: 1.2,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
    }

    createButton(x, y, text, callback) {
        const button = this.add.container(x, y);

        const bg = this.add.rectangle(0, 0, 250, 70, 0xFFDAB9)
            .setStrokeStyle(4, 0xFFFFFF);

        const label = this.add.text(0, 0, text, {
            fontSize: '28px',
            fontFamily: 'Fredoka One, Comic Sans MS',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        button.add([bg, label]);
        button.setSize(250, 70);
        button.setInteractive({ useHandCursor: true });

        button.on('pointerover', () => bg.setFillStyle(0xEFB0C9));
        button.on('pointerout', () => bg.setFillStyle(0xFFDAB9));
        button.on('pointerdown', callback);

        return button;
    }

    createCloseButton(x, y) {
        const closeBtn = this.add.text(x, y, '✕', {
            fontSize: '32px',
            color: '#EFB0C9'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        closeBtn.on('pointerdown', () => {
            this.scene.stop();
            this.scene.resume('MenuScene');
        });
    }
}

// ============ SETTINGS SCENE ========== ==
class SettingsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SettingsScene' });
    }

    create() {
        const { width, height } = this.cameras.main;

        // Semi-transparent overlay
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5);

        // Popup background
        const popupBg = this.add.rectangle(width / 2, height / 2, 500, 400, 0xFFD4E5)
            .setStrokeStyle(5, 0xFFFFFF);

        // Title
        this.add.text(width / 2, height / 2 - 150, 'Settings', {
            fontSize: '40px',
            fontFamily: 'Fredoka One, Comic Sans MS',
            color: '#EFB0C9',
            stroke: '#FFFFFF',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Volume slider (functional)
        this.add.text(width / 2 - 200, height / 2 - 50, 'Volume:', {
            fontSize: '24px',
            fontFamily: 'Fredoka One, Comic Sans MS',
            color: '#EFB0C9'
        }).setOrigin(0, 0.5);

        const sliderBg = this.add.rectangle(width / 2 + 50, height / 2 - 50, 200, 20, 0xFFDAB9)
            .setStrokeStyle(2, 0xFFFFFF);

        // Calculate handle position
        const minX = width / 2 - 50;
        const maxX = width / 2 + 150;
        const handleX = minX + (gameState.volume * 200);

        const sliderHandle = this.add.circle(handleX, height / 2 - 50, 15, 0xEFB0C9)
            .setStrokeStyle(2, 0xFFFFFF)
            .setInteractive({ draggable: true, useHandCursor: true });

        // Volume percentage display
        const volumeText = this.add.text(width / 2 + 50, height / 2 - 90, `${Math.round(gameState.volume * 100)}%`, {
            fontSize: '20px',
            fontFamily: 'Fredoka One, Comic Sans MS',
            color: '#EFB0C9'
        }).setOrigin(0.5);

        // Make slider interactive
        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            if (gameObject === sliderHandle) {
                const clampedX = Phaser.Math.Clamp(dragX, minX, maxX);
                sliderHandle.x = clampedX;
                gameState.volume = (clampedX - minX) / 200;
                volumeText.setText(`${Math.round(gameState.volume * 100)}%`);
                this.sound.volume = gameState.volume;
                soundManager.updateVolume(gameState.volume);
            }
        });

        // Sound Check Button
        this.createButton(width / 2, height / 2 + 50, 'Sound Check', () => {
            this.playSoundEffect();
        });

        // Note
        this.add.text(width / 2, height / 2 + 110, 'I recommend not doing 100% volume', {
            fontSize: '12px',
            fontFamily: 'Fredoka One, Comic Sans MS',
            color: '#D9605C',
            alpha: 0.6,
            align: 'center',
            wordWrap: { width: 350 }
        }).setOrigin(0.5);

        // Close button
        this.createCloseButton(width / 2 + 220, height / 2 - 180);
    }

    playSoundEffect() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 440;
        gainNode.gain.value = gameState.volume;

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);

        const { width, height } = this.cameras.main;
        const soundText = this.add.text(width / 2, height / 2 + 150, '♪ Sound Check ♪', {
            fontSize: '24px',
            fontFamily: 'Fredoka One, Comic Sans MS',
            color: '#EFB0C9'
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: soundText,
            alpha: 1,
            duration: 300,
            yoyo: true,
            onComplete: () => soundText.destroy()
        });
    }

    createButton(x, y, text, callback) {
        const button = this.add.container(x, y);

        const bg = this.add.rectangle(0, 0, 250, 70, 0xFFDAB9)
            .setStrokeStyle(4, 0xFFFFFF);

        const label = this.add.text(0, 0, text, {
            fontSize: '28px',
            fontFamily: 'Fredoka One, Comic Sans MS',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        button.add([bg, label]);
        button.setSize(250, 70);
        button.setInteractive({ useHandCursor: true });

        button.on('pointerover', () => bg.setFillStyle(0xEFB0C9));
        button.on('pointerout', () => bg.setFillStyle(0xFFDAB9));
        button.on('pointerdown', callback);

        return button;
    }

    createCloseButton(x, y) {
        const closeBtn = this.add.text(x, y, '✕', {
            fontSize: '32px',
            color: '#EFB0C9'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        closeBtn.on('pointerdown', () => {
            this.scene.stop();
            this.scene.resume('MenuScene');
        });
    }
}

// ============ HUB SCENE ============
class HubScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HubScene' });
    }

    create() {
        const { width, height } = this.cameras.main;

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0xFFD4E5);

        // Title
        this.add.text(width / 2, 100, 'Choose Your Adventure', {
            fontSize: '40px',
            fontFamily: 'Fredoka One, Comic Sans MS',
            color: '#EFB0C9',
            stroke: '#FFFFFF',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Hint instruction text
        this.add.text(width / 2, 160, 'Press completed games again to see hints!', {
            fontSize: '18px',
            fontFamily: 'Fredoka One, Comic Sans MS',
            color: '#D9605C',
            alpha: 0.8
        }).setOrigin(0.5);

        // Mini Game Button
        this.createGameButton(width / 2 - 150, 300, 'Mini Game',
            gameState.miniGameCompleted,
            () => {
                if (gameState.miniGameCompleted) {
                    this.showHint(gameState.hints.miniGame);
                } else {
                    this.scene.start('MiniGameScene');
                }
            }
        );

        // Trivia Button
        this.createGameButton(width / 2 + 150, 300, 'Trivia',
            gameState.triviaCompleted,
            () => {
                if (gameState.triviaCompleted) {
                    this.showHint(gameState.hints.trivia);
                } else {
                    this.scene.start('TriviaScene');
                }
            }
        );

        // Surprise Button
        if (gameState.miniGameCompleted && gameState.triviaCompleted) {
            this.createSurpriseButton(width / 2, 500);
        }

        // Back button
        this.createBackButton(50, 50);
    }

    createGameButton(x, y, text, isCompleted, callback) {
        const button = this.add.container(x, y);

        const color = isCompleted ? 0xEFB0C9 : 0xFFDAB9;
        const borderColor = isCompleted ? 0xFFD700 : 0xFFFFFF;
        const borderWidth = isCompleted ? 6 : 4;

        let glow;
        if (isCompleted) {
            glow = this.add.circle(0, 0, 110, 0xFFD700, 0.4);
            button.add(glow);

            this.tweens.add({
                targets: glow,
                scale: 1.15,
                alpha: 0.6,
                duration: 800,
                yoyo: true,
                repeat: -1
            });
        }

        const bg = this.add.rectangle(0, 0, 200, 200, color)
            .setStrokeStyle(borderWidth, borderColor);

        const icon = this.add.text(0, -10, text === 'Mini Game' ? '👾' : '🧠', {
            fontSize: '50px'
        }).setOrigin(0.5);

        const label = this.add.text(0, 60, text, {
            fontSize: '24px',
            fontFamily: 'Fredoka One, Comic Sans MS',
            color: '#FFFFFF',
            align: 'center',
            wordWrap: { width: 180 }
        }).setOrigin(0.5);

        button.add([bg, icon, label]);

        if (isCompleted) {
            // Large checkmark
            const checkmark = this.add.text(-70, -70, '✓', {
                fontSize: '60px',
                fontFamily: 'Comic Sans MS',
                color: '#FFD700',
                stroke: '#FFFFFF',
                strokeThickness: 4
            }).setOrigin(0.5);

            button.add(checkmark);

            // Pulse animation for checkmark
            this.tweens.add({
                targets: checkmark,
                scale: 1.2,
                duration: 1000,
                yoyo: true,
                repeat: -1
            });
        }

        button.setSize(200, 200);
        button.setInteractive({ useHandCursor: true });

        button.on('pointerover', () => {
            button.setScale(1.05);
            soundManager.play('hover');
        });
        button.on('pointerout', () => button.setScale(1));
        button.on('pointerdown', () => {
            soundManager.play('click');
            callback();
        });

        return button;
    }

    createSurpriseButton(x, y) {
        const button = this.add.container(x, y);

        const bg = this.add.rectangle(0, 0, 300, 80, 0xEFB0C9)
            .setStrokeStyle(5, 0xFFFFFF);

        const label = this.add.text(0, 0, '🎁 SURPRISE! 🎁', {
            fontSize: '32px',
            fontFamily: 'Fredoka One, Comic Sans MS',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        button.add([bg, label]);
        button.setSize(300, 80);
        button.setInteractive({ useHandCursor: true });

        this.tweens.add({
            targets: button,
            scale: 1.1,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        button.on('pointerdown', () => {
            this.openYouTube();
        });

        return button;
    }

    showHint(hintText) {
        const { width, height } = this.cameras.main;

        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5)
            .setInteractive();

        const popup = this.add.rectangle(width / 2, height / 2, 500, 300, 0xFFD4E5)
            .setStrokeStyle(5, 0xFFFFFF);

        const title = this.add.text(width / 2, height / 2 - 80, 'Hint', {
            fontSize: '36px',
            fontFamily: 'Fredoka One, Comic Sans MS',
            color: '#EFB0C9',
            stroke: '#FFFFFF',
            strokeThickness: 4
        }).setOrigin(0.5);

        const hint = this.add.text(width / 2, height / 2, hintText, {
            fontSize: '20px',
            fontFamily: 'Fredoka One, Comic Sans MS',
            color: '#EFB0C9',
            align: 'center',
            wordWrap: { width: 450 }
        }).setOrigin(0.5);

        const closeBtn = this.add.text(width / 2, height / 2 + 100, 'Close', {
            fontSize: '28px',
            fontFamily: 'Fredoka One, Comic Sans MS',
            color: '#FFFFFF',
            backgroundColor: '#EFB0C9',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        closeBtn.on('pointerdown', () => {
            overlay.destroy();
            popup.destroy();
            title.destroy();
            hint.destroy();
            closeBtn.destroy();
        });
    }

    openYouTube() {
        window.open('https://bit.ly/fortheloveofmylifevis', '_blank');

        const { width, height } = this.cameras.main;

        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
            .setInteractive();

        const message = this.add.text(width / 2, height / 2, 'Opening video in new tab...\n\nClick anywhere to continue', {
            fontSize: '28px',
            fontFamily: 'Fredoka One, Comic Sans MS',
            color: '#FFFFFF',
            align: 'center'
        }).setOrigin(0.5);

        overlay.once('pointerdown', () => {
            overlay.destroy();
            message.destroy();
        });

        this.time.delayedCall(2000, () => {
            if (overlay.active) {
                overlay.destroy();
                message.destroy();
            }
        });
    }

    createBackButton(x, y) {
        const btn = this.add.text(x, y, '← Back', {
            fontSize: '24px',
            fontFamily: 'Fredoka One, Comic Sans MS',
            color: '#EFB0C9'
        }).setInteractive({ useHandCursor: true });

        btn.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }
}

// ============ MINI GAME SCENE ============
class MiniGameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MiniGameScene' });
    }

    preload() {
        // Load sun image
        this.load.image('sun', 'images/Sun_PvZ2.png');
        // Load local zombie image
        this.load.image('zombie', 'images/Zombie_PvZ.png');
    }

    create() {
        const { width, height } = this.cameras.main;
        this.score = 0;

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0xFFD4E5);

        // Title
        this.add.text(width / 2, 50, 'Whack-A-Zombie!', {
            fontSize: '40px',
            fontFamily: 'Fredoka One, Comic Sans MS',
            color: '#EFB0C9',
            stroke: '#FFFFFF',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Score display
        this.scoreText = this.add.text(width / 2, 120, 'Score: 0 / 10', {
            fontSize: '28px',
            fontFamily: 'Fredoka One, Comic Sans MS',
            color: '#EFB0C9'
        }).setOrigin(0.5);

        // Scoring instructions
        const instructionY = 165;
        this.add.text(width / 2 - 150, instructionY, '👾 Zombie = +1', {
            fontSize: '20px',
            fontFamily: 'Fredoka One, Comic Sans MS',
            color: '#EFB0C9',
            backgroundColor: '#FFFFFF',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);

        this.add.text(width / 2 + 150, instructionY, '🌻 Sun = -1', {
            fontSize: '20px',
            fontFamily: 'Fredoka One, Comic Sans MS',
            color: '#EFB0C9',
            backgroundColor: '#FFFFFF',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);

        // Create 3x3 grid - CENTERED
        const startX = width / 2 - 110;  // Fixed centering
        const startY = height / 2 - 40;   // Fixed centering
        const spacing = 110;

        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const x = startX + col * spacing;
                const y = startY + row * spacing;

                // Hole background
                this.add.circle(x, y, 45, 0x9E8B7B).setStrokeStyle(3, 0xFFDAB9);
                this.add.circle(x, y, 40, 0x7B6B5B);
            }
        }

        // Start spawning
        this.time.addEvent({
            delay: 2000,
            callback: () => this.spawnEntity(),
            loop: true
        });

        // Back button
        this.createBackButton(50, 50);
    }

    spawnEntity() {
        if (this.score >= 10) return;

        const { width, height } = this.cameras.main;
        const startX = width / 2 - 110;  // Fixed centering
        const startY = height / 2 - 40;   // Fixed centering
        const spacing = 110;

        const row = Phaser.Math.Between(0, 2);
        const col = Phaser.Math.Between(0, 2);
        const x = startX + col * spacing;
        const y = startY + row * spacing;

        // 70% zombie, 30% sun
        const isZombie = Math.random() > 0.3;

        let entity;
        if (isZombie) {
            entity = this.add.image(x, y, 'zombie')
                .setOrigin(0.5)
                .setDisplaySize(80, 100);

            entity.setData('type', 'zombie');
        } else {
            entity = this.add.image(x, y, 'sun')
                .setOrigin(0.5)
                .setDisplaySize(100, 100);

            entity.setData('type', 'sun');
        }

        entity.setInteractive({ useHandCursor: true });
        entity.on('pointerdown', () => this.hitEntity(entity));

        // Auto-remove after 3 seconds
        this.time.delayedCall(2000, () => {
            if (entity.active) {
                this.removeEntity(entity);
            }
        });
    }

    hitEntity(entity) {
        const type = entity.getData('type');

        if (type === 'zombie') {
            this.score++;
            soundManager.play('correct');
            const text = this.add.text(entity.x, entity.y, '+1', {
                fontSize: '32px',
                fontFamily: 'Fredoka One, Comic Sans MS',
                color: '#81C784'
            }).setOrigin(0.5);

            this.tweens.add({
                targets: text,
                y: entity.y - 50,
                alpha: 0,
                duration: 1000,
                onComplete: () => text.destroy()
            });
        } else {
            this.score--;
            soundManager.play('wrong');
            const text = this.add.text(entity.x, entity.y, '-1', {
                fontSize: '32px',
                fontFamily: 'Fredoka One, Comic Sans MS',
                color: '#E57373'
            }).setOrigin(0.5);

            this.tweens.add({
                targets: text,
                y: entity.y - 50,
                alpha: 0,
                duration: 1000,
                onComplete: () => text.destroy()
            });
        }

        this.scoreText.setText(`Score: ${this.score} / 10`);
        this.removeEntity(entity);

        if (this.score >= 10) {
            this.gameWon();
        }
    }

    removeEntity(entity) {
        const type = entity.getData('type');
        if (type === 'zombie') {
            const eyes = entity.getData('eyes');
            if (eyes) eyes.destroy();
        } else {
            const center = entity.getData('center');
            if (center) center.destroy();
        }
        entity.destroy();
    }

    gameWon() {
        gameState.miniGameCompleted = true;
        soundManager.play('complete');

        const { width, height } = this.cameras.main;
        const winText = this.add.text(width / 2, height / 2, 'YOU WIN!', {
            fontSize: '64px',
            fontFamily: 'Fredoka One, Comic Sans MS',
            color: '#EFB0C9',
            stroke: '#FFFFFF',
            strokeThickness: 8
        }).setOrigin(0.5);

        this.time.delayedCall(2000, () => {
            this.scene.start('HubScene');
        });
    }

    createBackButton(x, y) {
        const btn = this.add.text(x, y, '← Back', {
            fontSize: '24px',
            fontFamily: 'Fredoka One, Comic Sans MS',
            color: '#EFB0C9'
        }).setInteractive({ useHandCursor: true });

        btn.on('pointerdown', () => {
            this.scene.start('HubScene');
        });
    }
}

// ============ TRIVIA SCENE ============
class TriviaScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TriviaScene' });
        this.questions = [
            {
                question: "Hadiah apa yang aku pernah kasih kamu?",
                answers: ["A) Bunga", "B) Mobil", "C) Baju", "D) Kacamata"],
                correct: 0
            },
            {
                question: "Bulan apa kita wisuda SMA?",
                answers: ["A) October", "B) July", "C) May", "D) March"],
                correct: 2
            },
            {
                question: "Unsur kimia mana yang termasuk ke dalam gas mulia?",
                answers: ["A) Hydrogen", "B) Argon", "C) Carbon", "D) Iodine"],
                correct: 1
            }
        ];
        this.currentQuestion = 0;
        this.correctAnswers = 0;
    }

    create() {
        const { width, height } = this.cameras.main;

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0xFFD4E5);

        // Title
        this.add.text(width / 2, 50, 'Random Stuff Trivia!', {
            fontSize: '40px',
            fontFamily: 'Fredoka One, Comic Sans MS',
            color: '#EFB0C9',
            stroke: '#FFFFFF',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Progress
        this.progressText = this.add.text(width / 2, 120, `Question ${this.currentQuestion + 1} / 3`, {
            fontSize: '24px',
            fontFamily: 'Fredoka One, Comic Sans MS',
            color: '#EFB0C9'
        }).setOrigin(0.5);

        this.displayQuestion();

        // Back button
        this.createBackButton(50, 50);
    }

    displayQuestion() {
        const { width, height } = this.cameras.main;
        const q = this.questions[this.currentQuestion];

        // Clear previous elements
        if (this.questionText) this.questionText.destroy();
        if (this.answerButtons) {
            this.answerButtons.forEach(btn => btn.destroy());
        }

        // Question text
        this.questionText = this.add.text(width / 2, 220, q.question, {
            fontSize: '28px',
            fontFamily: 'Fredoka One, Comic Sans MS',
            color: '#EFB0C9',
            align: 'center',
            wordWrap: { width: 700 }
        }).setOrigin(0.5);

        // Answer buttons
        this.answerButtons = [];
        q.answers.forEach((answer, index) => {
            const btn = this.createAnswerButton(
                width / 2,
                320 + index * 80,
                answer,
                () => this.selectAnswer(index)
            );
            this.answerButtons.push(btn);
        });

        this.progressText.setText(`Question ${this.currentQuestion + 1} / 3`);
    }

    selectAnswer(index) {
        const q = this.questions[this.currentQuestion];
        const { width, height } = this.cameras.main;

        if (index === q.correct) {
            this.correctAnswers++;
            soundManager.play('correct');

            const feedback = this.add.text(width / 2, height - 100, '✓ Correct!', {
                fontSize: '32px',
                fontFamily: 'Fredoka One, Comic Sans MS',
                color: '#81C784',
                stroke: '#FFFFFF',
                strokeThickness: 4
            }).setOrigin(0.5);

            this.time.delayedCall(1000, () => {
                feedback.destroy();
                this.nextQuestion();
            });
        } else {
            soundManager.play('wrong');

            const feedback = this.add.text(width / 2, height - 100, '✗ Wrong! Starting over...', {
                fontSize: '32px',
                fontFamily: 'Fredoka One, Comic Sans MS',
                color: '#E57373',
                stroke: '#FFFFFF',
                strokeThickness: 4
            }).setOrigin(0.5);

            this.time.delayedCall(2000, () => {
                this.scene.restart();
            });
        }
    }

    nextQuestion() {
        this.currentQuestion++;

        if (this.currentQuestion >= this.questions.length) {
            if (this.correctAnswers === 3) {
                this.gameWon();
            }
        } else {
            this.displayQuestion();
        }
    }

    gameWon() {
        soundManager.play('complete');
        gameState.triviaCompleted = true;

        const { width, height } = this.cameras.main;

        if (this.questionText) this.questionText.destroy();
        if (this.answerButtons) {
            this.answerButtons.forEach(btn => btn.destroy());
        }

        const winText = this.add.text(width / 2, height / 2, 'Perfect Score!\n3/3', {
            fontSize: '64px',
            fontFamily: 'Fredoka One, Comic Sans MS',
            color: '#EFB0C9',
            stroke: '#FFFFFF',
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        this.time.delayedCall(2000, () => {
            this.scene.start('HubScene');
        });
    }

    createAnswerButton(x, y, text, callback) {
        const button = this.add.container(x, y);

        const bg = this.add.rectangle(0, 0, 600, 60, 0xFFDAB9)
            .setStrokeStyle(4, 0xFFFFFF);

        const label = this.add.text(0, 0, text, {
            fontSize: '24px',
            fontFamily: 'Fredoka One, Comic Sans MS',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        button.add([bg, label]);
        button.setSize(600, 60);
        button.setInteractive({ useHandCursor: true });

        button.on('pointerover', () => {
            bg.setFillStyle(0xEFB0C9);
            button.setScale(1.02);
        });

        button.on('pointerout', () => {
            bg.setFillStyle(0xFFDAB9);
            button.setScale(1);
        });

        button.on('pointerdown', callback);

        return button;
    }

    createBackButton(x, y) {
        const btn = this.add.text(x, y, '← Back', {
            fontSize: '24px',
            fontFamily: 'Fredoka One, Comic Sans MS',
            color: '#EFB0C9'
        }).setInteractive({ useHandCursor: true });

        btn.on('pointerdown', () => {
            this.scene.start('HubScene');
        });
    }
}

// ============ GAME CONFIG ============
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 700,
    parent: 'game-container',
    backgroundColor: '#FFF0F5',
    scene: [MenuScene, CakeScene, SettingsScene, HubScene, MiniGameScene, TriviaScene],
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    }
};

const game = new Phaser.Game(config);