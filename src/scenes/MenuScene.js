export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.scale;
    this.upgradeSystem = this.registry.get('upgradeSystem');
    this.audioManager = this.registry.get('audioManager');

    this._drawBackground(width, height);
    this._drawTitle(width, height);
    this._drawStats(width, height);
    this._drawButtons(width, height);
    this._drawDailyReward(width, height);
    this._drawVersion(width, height);
    this._startAnimations(width, height);
  }

  _drawBackground(w, h) {
    // Dark gradient bg
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x050510, 0x050510, 0x0A0520, 0x0A0520, 1);
    bg.fillRect(0, 0, w, h);

    // Spiral grid lines
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x112233, 0.3);
    for (let y = 0; y < h; y += 40) {
      grid.strokeLineShape(new Phaser.Geom.Line(0, y, w, y));
    }
    for (let x = 0; x < w; x += 40) {
      grid.strokeLineShape(new Phaser.Geom.Line(x, 0, x, h));
    }

    // Decorative spiral path
    const spiral = this.add.graphics();
    spiral.lineStyle(1, 0x00FFFF, 0.08);
    spiral.beginPath();
    const cx = w / 2, cy = h * 0.55;
    for (let a = 0; a < Math.PI * 8; a += 0.05) {
      const r = 20 + a * 20;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r * 0.5;
      if (a === 0) spiral.moveTo(x, y);
      else spiral.lineTo(x, y);
    }
    spiral.strokePath();

    // Ambient floating particles
    this._createAmbientParticles(w, h);
  }

  _createAmbientParticles(w, h) {
    const particles = this.add.graphics();
    this._particles = [];

    for (let i = 0; i < 20; i++) {
      const p = {
        x: Math.random() * w,
        y: Math.random() * h,
        vy: -(0.2 + Math.random() * 0.4),
        alpha: 0.2 + Math.random() * 0.4,
        size: 1 + Math.random() * 2,
        color: [0x00FFFF, 0x8800FF, 0xFF00FF][Math.floor(Math.random() * 3)]
      };
      this._particles.push(p);
    }

    this._particleGraphics = particles;
    this._particleTimer = this.time.addEvent({
      delay: 50,
      callback: this._updateParticles,
      callbackScope: this,
      loop: true
    });
  }

  _updateParticles() {
    if (!this._particleGraphics || !this._particleGraphics.scene) return;
    const { width, height } = this.scale;
    this._particleGraphics.clear();
    for (const p of this._particles) {
      p.y += p.vy;
      if (p.y < -10) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }
      this._particleGraphics.fillStyle(p.color, p.alpha);
      this._particleGraphics.fillCircle(p.x, p.y, p.size);
    }
  }

  _drawTitle(w, h) {
    // Glow behind title
    const glow = this.add.graphics();
    glow.fillStyle(0x00FFFF, 0.05);
    glow.fillEllipse(w / 2, h * 0.18, 400, 100);

    // Title text
    this.add.text(w / 2, h * 0.13, 'RISK', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '52px',
      fontStyle: 'bold',
      color: '#00FFFF',
      stroke: '#003344',
      strokeThickness: 4,
      shadow: { x: 0, y: 0, color: '#00FFFF', blur: 20, stroke: true, fill: true }
    }).setOrigin(0.5);

    this.add.text(w / 2, h * 0.21, 'SPIRAL', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '44px',
      fontStyle: 'bold',
      color: '#FF00FF',
      stroke: '#330022',
      strokeThickness: 4,
      shadow: { x: 0, y: 0, color: '#FF00FF', blur: 20, stroke: true, fill: true }
    }).setOrigin(0.5);

    this.add.text(w / 2, h * 0.28, 'CLIMB. RISK. SPIRAL.', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '12px',
      color: '#446677',
      letterSpacing: 4
    }).setOrigin(0.5);
  }

  _drawStats(w, h) {
    const bestFloor = this.upgradeSystem ? this.upgradeSystem.getBestFloor() : 0;
    const currency = this.upgradeSystem ? this.upgradeSystem.getCurrency() : 0;

    // Stats panel
    const panel = this.add.graphics();
    panel.fillStyle(0x001122, 0.8);
    panel.fillRoundedRect(w / 2 - 150, h * 0.33, 300, 70, 10);
    panel.lineStyle(1, 0x224466, 0.6);
    panel.strokeRoundedRect(w / 2 - 150, h * 0.33, 300, 70, 10);

    this.add.text(w / 2 - 70, h * 0.355, 'BEST FLOOR', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '10px',
      color: '#446677'
    }).setOrigin(0.5);

    this.add.text(w / 2 - 70, h * 0.375, bestFloor > 0 ? `#${bestFloor}` : '--', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '24px',
      fontStyle: 'bold',
      color: bestFloor > 0 ? '#00FFFF' : '#224466'
    }).setOrigin(0.5);

    this.add.text(w / 2 + 70, h * 0.355, 'CURRENCY', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '10px',
      color: '#446677'
    }).setOrigin(0.5);

    this.add.text(w / 2 + 70, h * 0.375, `◈ ${currency}`, {
      fontFamily: 'Orbitron, monospace',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#FFCC00'
    }).setOrigin(0.5);

    // Divider
    panel.lineStyle(1, 0x224466, 0.4);
    panel.strokeLineShape(new Phaser.Geom.Line(w / 2, h * 0.34, w / 2, h * 0.395));
  }

  _drawButtons(w, h) {
    const buttonY = h * 0.53;
    const btnW = 220, btnH = 55;

    // PLAY button
    this._playBtn = this._createButton(
      w / 2, buttonY,
      btnW, btnH,
      'PLAY',
      0x00FFFF, 0x001122, 0x00FFFF,
      () => this._onPlay()
    );

    // UPGRADES button
    this._upgradeBtn = this._createButton(
      w / 2, buttonY + 75,
      btnW, btnH,
      'UPGRADES',
      0x8800FF, 0x110022, 0xAA44FF,
      () => this._onUpgrades()
    );
  }

  _createButton(x, y, w, h, text, borderColor, fillColor, textColor, onClick) {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(fillColor, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    bg.lineStyle(2, borderColor, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);

    // Shine effect
    const shine = this.add.graphics();
    shine.fillStyle(borderColor, 0.1);
    shine.fillRoundedRect(-w / 2 + 4, -h / 2 + 4, w - 8, h / 2 - 4, 6);

    const label = this.add.text(0, 0, text, {
      fontFamily: 'Orbitron, monospace',
      fontSize: '18px',
      fontStyle: 'bold',
      color: `#${textColor.toString(16).padStart(6, '0')}`
    }).setOrigin(0.5);

    container.add([bg, shine, label]);
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scaleX: 1.05, scaleY: 1.05, duration: 100 });
      bg.clear();
      bg.fillStyle(borderColor, 0.15);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
      bg.lineStyle(2, borderColor, 1);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
      if (this.audioManager) this.audioManager.init();
    });

    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 });
      bg.clear();
      bg.fillStyle(fillColor, 1);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
      bg.lineStyle(2, borderColor, 1);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    });

    container.on('pointerdown', () => {
      if (this.audioManager) {
        this.audioManager.init();
        this.audioManager.playClick();
      }
      this.tweens.add({ targets: container, scaleX: 0.95, scaleY: 0.95, duration: 80, yoyo: true });
      setTimeout(onClick, 150);
    });

    return container;
  }

  _drawDailyReward(w, h) {
    const hasReward = this.upgradeSystem && this.upgradeSystem.checkDailyReward();

    if (!hasReward) {
      this.add.text(w / 2, h * 0.73, '✓ Daily reward claimed', {
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '11px',
        color: '#334455'
      }).setOrigin(0.5);
      return;
    }

    // Daily reward button
    const rewardBtn = this._createButton(
      w / 2, h * 0.73,
      200, 44,
      '🎁 DAILY REWARD',
      0xFFCC00, 0x221100, 0xFFCC00,
      () => this._claimDailyReward()
    );

    this._rewardBtn = rewardBtn;

    // Pulsing glow
    this.tweens.add({
      targets: rewardBtn,
      alpha: 0.8,
      duration: 1000,
      yoyo: true,
      repeat: -1
    });
  }

  _claimDailyReward() {
    if (!this.upgradeSystem) return;
    const reward = this.upgradeSystem.claimDailyReward();

    if (this._rewardBtn) {
      this._rewardBtn.destroy();
      this._rewardBtn = null;
    }

    const { width, height } = this.scale;
    const popup = this.add.text(width / 2, height * 0.73, `+${reward} ◈ currency!`, {
      fontFamily: 'Orbitron, monospace',
      fontSize: '16px',
      color: '#FFCC00'
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: popup,
      alpha: 1,
      y: height * 0.68,
      duration: 400,
      ease: 'Back.Out',
      onComplete: () => {
        this.time.delayedCall(1500, () => {
          this.tweens.add({ targets: popup, alpha: 0, duration: 300 });
        });
      }
    });

    if (this.audioManager) this.audioManager.playBankSound();
  }

  _drawVersion(w, h) {
    this.add.text(w / 2, h - 20, 'v1.0 — RISK SPIRAL', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '10px',
      color: '#223344'
    }).setOrigin(0.5);

    // How to play hint
    this.add.text(w / 2, h * 0.86, 'Choose doors. Bank before you fall.', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '11px',
      color: '#335566'
    }).setOrigin(0.5);

    this.add.text(w / 2, h * 0.89, 'Every 10 floors: safe zone.', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '11px',
      color: '#335566'
    }).setOrigin(0.5);
  }

  _startAnimations(w, h) {
    // Title pulse
    const titleObjs = this.children.list.filter(c => c.type === 'Text' && c.text === 'RISK');
    if (titleObjs.length) {
      this.tweens.add({
        targets: titleObjs[0],
        alpha: 0.8,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut'
      });
    }
  }

  _onPlay() {
    if (this._particleTimer) this._particleTimer.remove();
    this.scene.start('GameScene');
  }

  _onUpgrades() {
    if (this._particleTimer) this._particleTimer.remove();
    this.scene.start('UpgradeScene');
  }

  shutdown() {
    if (this._particleTimer) this._particleTimer.remove();
  }
}

export default MenuScene;
