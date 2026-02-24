export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.runData = data || {};
  }

  create() {
    const { width, height } = this.scale;
    this.W = width;
    this.H = height;

    this.upgradeSystem = this.registry.get('upgradeSystem');
    this.audioManager = this.registry.get('audioManager');

    const success = this.runData.success;
    const bankedScore = this.runData.bankedScore || 0;
    const floorReached = this.runData.floorReached || 1;
    const currencyEarned = this.runData.currencyEarned || 0;
    const isNewRecord = this.runData.isNewRecord || false;
    const lostScore = this.runData.lostScore || 0;

    this._drawBackground(success);
    this._drawHeader(success, width, height);
    this._drawStats(success, bankedScore, floorReached, currencyEarned, lostScore, width, height);

    if (isNewRecord && floorReached > 1) {
      this._animateNewRecord(width, height);
    }

    this._checkAchievements(floorReached, bankedScore);
    this._drawButtons(width, height);

    // Play audio cue
    if (this.audioManager) {
      if (success) {
        this.audioManager.playBankSound();
      }
    }

    this._animateIn();
  }

  _drawBackground(success) {
    const bg = this.add.graphics();
    if (success) {
      bg.fillGradientStyle(0x050510, 0x050510, 0x050520, 0x05201A, 1);
    } else {
      bg.fillGradientStyle(0x050510, 0x050510, 0x200505, 0x200505, 1);
    }
    bg.fillRect(0, 0, this.W, this.H);

    // Grid
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x111133, 0.2);
    for (let y = 0; y < this.H; y += 40) {
      grid.strokeLineShape(new Phaser.Geom.Line(0, y, this.W, y));
    }
  }

  _drawHeader(success, w, h) {
    const title = success ? 'BANKED!' : 'FAILED';
    const color = success ? '#00FF88' : '#FF2200';
    const subcolor = success ? '#00AA66' : '#AA1100';

    this._titleText = this.add.text(w / 2, h * 0.12, title, {
      fontFamily: 'Orbitron, monospace',
      fontSize: '52px',
      fontStyle: 'bold',
      color,
      stroke: subcolor,
      strokeThickness: 4,
      shadow: { x: 0, y: 0, color, blur: 30, stroke: true, fill: true }
    }).setOrigin(0.5).setAlpha(0).setScale(0.5);

    const sub = success ? 'Score secured. Well played.' : 'The spiral has claimed you.';
    this._subText = this.add.text(w / 2, h * 0.2, sub, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '13px',
      color: '#446677'
    }).setOrigin(0.5).setAlpha(0);
  }

  _drawStats(success, bankedScore, floorReached, currencyEarned, lostScore, w, h) {
    const panelY = h * 0.28;

    // Main stats panel
    const panel = this.add.graphics();
    panel.fillStyle(0x001122, 0.9);
    panel.fillRoundedRect(w / 2 - 180, panelY, 360, 220, 14);
    panel.lineStyle(1, success ? 0x00FF88 : 0xFF2200, 0.5);
    panel.strokeRoundedRect(w / 2 - 180, panelY, 360, 220, 14);

    const rows = [
      { label: 'FLOOR REACHED', value: `#${floorReached}`, color: '#00FFFF' },
      { label: 'SCORE BANKED', value: bankedScore.toLocaleString(), color: '#FFCC00' },
      { label: 'CURRENCY EARNED', value: `+${currencyEarned} ◈`, color: '#FFaa44' },
    ];

    if (!success && lostScore > 0) {
      rows.push({ label: 'SCORE LOST', value: lostScore.toLocaleString(), color: '#FF4444' });
    }

    const bestFloor = this.upgradeSystem ? this.upgradeSystem.getBestFloor() : 0;
    rows.push({ label: 'ALL-TIME BEST', value: `#${bestFloor}`, color: '#446688' });

    rows.forEach((row, i) => {
      const rowY = panelY + 30 + i * 38;

      this.add.text(w / 2 - 155, rowY, row.label, {
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '10px',
        color: '#445566'
      });

      const valText = this.add.text(w / 2 + 155, rowY + 8, row.value, {
        fontFamily: 'Orbitron, monospace',
        fontSize: '18px',
        fontStyle: 'bold',
        color: row.color
      }).setOrigin(1, 0.5);

      // Line divider
      if (i < rows.length - 1) {
        const divider = this.add.graphics();
        divider.lineStyle(1, 0x113355, 0.4);
        divider.strokeLineShape(new Phaser.Geom.Line(w / 2 - 155, rowY + 20, w / 2 + 155, rowY + 20));
      }
    });

    this._statsPanel = panel;
  }

  _animateNewRecord(w, h) {
    const badge = this.add.text(w / 2, h * 0.56, '★ NEW RECORD! ★', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#FFCC00',
      stroke: '#443300',
      strokeThickness: 3,
      shadow: { x: 0, y: 0, color: '#FFCC00', blur: 15, stroke: true, fill: true }
    }).setOrigin(0.5).setAlpha(0);

    this.time.delayedCall(600, () => {
      this.tweens.add({
        targets: badge,
        alpha: 1,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 300,
        ease: 'Back.Out',
        onComplete: () => {
          this.tweens.add({
            targets: badge,
            scaleX: 1,
            scaleY: 1,
            duration: 200
          });
        }
      });

      // Particle burst
      for (let i = 0; i < 25; i++) {
        const p = this.add.image(w / 2, h * 0.56, 'particle_gold');
        const angle = Math.random() * Math.PI * 2;
        const speed = 80 + Math.random() * 150;
        this.tweens.add({
          targets: p,
          x: w / 2 + Math.cos(angle) * speed,
          y: h * 0.56 + Math.sin(angle) * speed,
          alpha: 0,
          scaleX: 0.2,
          scaleY: 0.2,
          duration: 700 + Math.random() * 300,
          onComplete: () => p.destroy()
        });
      }
    });
  }

  _checkAchievements(floorReached, bankedScore) {
    if (!this.upgradeSystem) return;

    const { ACHIEVEMENTS } = { ACHIEVEMENTS: [
      { id: 'floor_10', condition: { type: 'floor', value: 10 } },
      { id: 'floor_25', condition: { type: 'floor', value: 25 } },
      { id: 'floor_50', condition: { type: 'floor', value: 50 } },
      { id: 'floor_100', condition: { type: 'floor', value: 100 } },
      { id: 'bank_1000', condition: { type: 'bank', value: 1000 } }
    ]};

    const newUnlocks = [];
    for (const ach of ACHIEVEMENTS) {
      if (this.upgradeSystem.hasAchievement(ach.id)) continue;
      let unlocked = false;
      if (ach.condition.type === 'floor' && floorReached >= ach.condition.value) unlocked = true;
      if (ach.condition.type === 'bank' && bankedScore >= ach.condition.value) unlocked = true;
      if (unlocked) {
        this.upgradeSystem.unlockAchievement(ach.id);
        newUnlocks.push(ach.id);
      }
    }

    if (newUnlocks.length) {
      this._showAchievementUnlocks(newUnlocks);
    }
  }

  _showAchievementUnlocks(ids) {
    const { width, height } = this.scale;
    ids.forEach((id, i) => {
      this.time.delayedCall(800 + i * 600, () => {
        const popup = this.add.text(width / 2, height * 0.62 + i * 30, `🏆 Achievement: ${id.replace('_', ' ')}`, {
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: '12px',
          color: '#FFCC00'
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
          targets: popup,
          alpha: 1,
          y: height * 0.6 + i * 30,
          duration: 400
        });
      });
    });
  }

  _drawButtons(w, h) {
    // Play Again
    this._playAgainBtn = this._createButton(
      w / 2, h * 0.8,
      220, 52,
      'PLAY AGAIN',
      0x00FFFF, 0x001122, 0x00FFFF,
      () => this._onPlayAgain()
    );

    // Main Menu
    this._menuBtn = this._createButton(
      w / 2, h * 0.88,
      180, 44,
      'MAIN MENU',
      0x446688, 0x001122, 0x446688,
      () => this._onMenu()
    );
  }

  _createButton(x, y, w, h, text, borderColor, fillColor, textColor, onClick) {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(fillColor, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    bg.lineStyle(2, borderColor, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);

    const label = this.add.text(0, 0, text, {
      fontFamily: 'Orbitron, monospace',
      fontSize: '16px',
      fontStyle: 'bold',
      color: `#${textColor.toString(16).padStart(6, '0')}`
    }).setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });
    container.setAlpha(0);

    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scaleX: 1.04, scaleY: 1.04, duration: 100 });
    });
    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 });
    });
    container.on('pointerdown', () => {
      if (this.audioManager) { this.audioManager.init(); this.audioManager.playClick(); }
      this.tweens.add({ targets: container, scaleX: 0.95, scaleY: 0.95, duration: 80, yoyo: true });
      setTimeout(onClick, 150);
    });

    return container;
  }

  _animateIn() {
    this.time.delayedCall(100, () => {
      this.tweens.add({
        targets: this._titleText,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 500,
        ease: 'Back.Out'
      });
    });

    this.time.delayedCall(300, () => {
      this.tweens.add({ targets: this._subText, alpha: 1, duration: 400 });
    });

    this.time.delayedCall(500, () => {
      this.tweens.add({ targets: this._playAgainBtn, alpha: 1, duration: 400 });
    });

    this.time.delayedCall(650, () => {
      this.tweens.add({ targets: this._menuBtn, alpha: 1, duration: 400 });
    });
  }

  _onPlayAgain() {
    this.scene.start('GameScene');
  }

  _onMenu() {
    this.scene.start('MenuScene');
  }
}

export default GameOverScene;
