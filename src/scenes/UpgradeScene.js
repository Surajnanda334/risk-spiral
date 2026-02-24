export class UpgradeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UpgradeScene' });
  }

  create() {
    const { width, height } = this.scale;
    this.W = width;
    this.H = height;

    this.upgradeSystem = this.registry.get('upgradeSystem');
    this.audioManager = this.registry.get('audioManager');

    this._drawBackground();
    this._drawHeader();
    this._upgradeCardGroup = this.add.container(0, 0);
    this._drawUpgradeGrid();
    this._drawBackButton();
  }

  _drawBackground() {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x050510, 0x050510, 0x100520, 0x100520, 1);
    bg.fillRect(0, 0, this.W, this.H);

    const grid = this.add.graphics();
    grid.lineStyle(1, 0x111133, 0.2);
    for (let y = 0; y < this.H; y += 40) grid.strokeLineShape(new Phaser.Geom.Line(0, y, this.W, y));
    for (let x = 0; x < this.W; x += 40) grid.strokeLineShape(new Phaser.Geom.Line(x, 0, x, this.H));
  }

  _drawHeader() {
    const hdr = this.add.graphics();
    hdr.fillStyle(0x000011, 0.9);
    hdr.fillRect(0, 0, this.W, 60);
    hdr.lineStyle(1, 0x224466, 0.6);
    hdr.strokeLineShape(new Phaser.Geom.Line(0, 60, this.W, 60));

    this.add.text(this.W / 2, 18, 'UPGRADES', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#AA44FF'
    }).setOrigin(0.5);

    const currency = this.upgradeSystem ? this.upgradeSystem.getCurrency() : 0;
    this._currencyText = this.add.text(this.W / 2, 42, `◈ ${currency} available`, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '12px',
      color: '#FFCC00'
    }).setOrigin(0.5);
  }

  _drawUpgradeGrid() {
    if (!this.upgradeSystem) return;
    const upgrades = this.upgradeSystem.getAllUpgrades();

    const cols = 2;
    const cardW = 210, cardH = 140;
    const gapX = 16, gapY = 12;
    const totalW = cols * cardW + (cols - 1) * gapX;
    const startX = (this.W - totalW) / 2 + cardW / 2;
    const startY = 80 + cardH / 2;

    this._upgradeCardObjects = [];

    upgrades.forEach((upgrade, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = startX + col * (cardW + gapX);
      const cy = startY + row * (cardH + gapY);
      const card = this._createUpgradeCard(upgrade, cx, cy, cardW, cardH);
      this._upgradeCardObjects.push(card);
    });
  }

  _createUpgradeCard(upgrade, cx, cy, w, h) {
    const level = upgrade.currentLevel;
    const maxLevel = upgrade.maxLevel;
    const canBuy = upgrade.canPurchase;
    const isMaxed = level >= maxLevel;

    const borderColor = isMaxed ? 0xFFCC00 : (canBuy ? 0x8800FF : 0x334455);
    const fillColor = isMaxed ? 0x221800 : (canBuy ? 0x110022 : 0x050515);
    const borderHex = '#' + borderColor.toString(16).padStart(6, '0');

    const container = this.add.container(cx, cy);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(fillColor, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    bg.lineStyle(2, borderColor, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    container.add(bg);

    // Icon + Name row
    const nameText = this.add.text(-w / 2 + 10, -h / 2 + 10, `${upgrade.icon || '●'} ${upgrade.name}`, {
      fontFamily: 'Orbitron, monospace',
      fontSize: '11px',
      fontStyle: 'bold',
      color: isMaxed ? '#FFCC00' : '#CCCCFF'
    });
    container.add(nameText);

    // Description
    const descText = this.add.text(-w / 2 + 10, -h / 2 + 32, upgrade.desc, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '9px',
      color: '#4477AA',
      wordWrap: { width: w - 20 }
    });
    container.add(descText);

    // Level pips
    const pipY = h / 2 - 42;
    for (let p = 0; p < maxLevel; p++) {
      const pipX = -w / 2 + 12 + p * 16;
      const pip = this.add.graphics();
      if (p < level) {
        pip.fillStyle(isMaxed ? 0xFFCC00 : 0x8800FF, 1);
        pip.fillCircle(pipX, pipY, 5);
      } else {
        pip.lineStyle(1, 0x334455, 0.8);
        pip.strokeCircle(pipX, pipY, 5);
      }
      container.add(pip);
    }

    // Level label
    const levelLabel = this.add.text(w / 2 - 8, -h / 2 + 10, `Lv ${level}/${maxLevel}`, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '9px',
      color: '#446688'
    }).setOrigin(1, 0);
    container.add(levelLabel);

    // Buy / Maxed button
    const btnY = h / 2 - 20;
    const btnBg = this.add.graphics();
    container.add(btnBg);

    let btnLabel, btnTextColor;
    if (isMaxed) {
      btnLabel = '★ MAXED';
      btnTextColor = '#FFCC00';
      btnBg.fillStyle(0x221800, 1);
      btnBg.fillRoundedRect(-w / 2 + 10, btnY - 13, w - 20, 26, 5);
      btnBg.lineStyle(1, 0x886600, 0.8);
      btnBg.strokeRoundedRect(-w / 2 + 10, btnY - 13, w - 20, 26, 5);
    } else if (canBuy) {
      btnLabel = `BUY  ◈ ${upgrade.nextCost}`;
      btnTextColor = '#AA66FF';
      btnBg.fillStyle(0x220044, 1);
      btnBg.fillRoundedRect(-w / 2 + 10, btnY - 13, w - 20, 26, 5);
      btnBg.lineStyle(1, 0x8800FF, 0.9);
      btnBg.strokeRoundedRect(-w / 2 + 10, btnY - 13, w - 20, 26, 5);
    } else {
      btnLabel = upgrade.nextCost ? `◈ ${upgrade.nextCost} needed` : 'MAXED';
      btnTextColor = '#334455';
      btnBg.fillStyle(0x050510, 1);
      btnBg.fillRoundedRect(-w / 2 + 10, btnY - 13, w - 20, 26, 5);
      btnBg.lineStyle(1, 0x223344, 0.5);
      btnBg.strokeRoundedRect(-w / 2 + 10, btnY - 13, w - 20, 26, 5);
    }

    const btnText = this.add.text(0, btnY, btnLabel, {
      fontFamily: 'Orbitron, monospace',
      fontSize: '10px',
      fontStyle: 'bold',
      color: btnTextColor
    }).setOrigin(0.5);
    container.add(btnText);

    // Interaction — only if can buy
    if (!isMaxed && canBuy) {
      container.setSize(w, h);
      container.setInteractive({ useHandCursor: true });

      container.on('pointerover', () => {
        this.tweens.add({ targets: container, scaleX: 1.03, scaleY: 1.03, duration: 100 });
        bg.clear();
        bg.fillStyle(0x330066, 1);
        bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
        bg.lineStyle(2, borderColor, 1);
        bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
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
        if (this.audioManager) { this.audioManager.init(); this.audioManager.playRewardChime(); }
        this.tweens.add({ targets: container, scaleX: 0.97, scaleY: 0.97, duration: 80, yoyo: true });
        this.time.delayedCall(100, () => this._onPurchase(upgrade.id));
      });
    }

    return container;
  }

  _onPurchase(upgradeId) {
    if (!this.upgradeSystem) return;
    const success = this.upgradeSystem.purchase(upgradeId);
    if (!success) return;

    // Destroy existing card objects
    this._upgradeCardObjects.forEach(c => c.destroy());
    this._upgradeCardObjects = [];

    // Update currency
    this._currencyText.setText(`◈ ${this.upgradeSystem.getCurrency()} available`);

    // Redraw grid
    this._drawUpgradeGrid();

    // Flash
    const flash = this.add.graphics();
    flash.fillStyle(0x8800FF, 0.25);
    flash.fillRect(0, 0, this.W, this.H);
    this.tweens.add({ targets: flash, alpha: 0, duration: 500, onComplete: () => flash.destroy() });

    // Floating +purchased text
    const popup = this.add.text(this.W / 2, this.H / 2, 'UPGRADED!', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#AA44FF',
      stroke: '#220044',
      strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0).setScale(0.6);

    this.tweens.add({
      targets: popup,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.Out',
      onComplete: () => {
        this.time.delayedCall(600, () => {
          this.tweens.add({ targets: popup, alpha: 0, y: this.H / 2 - 40, duration: 400, onComplete: () => popup.destroy() });
        });
      }
    });
  }

  _drawBackButton() {
    const container = this.add.container(50, this.H - 36);

    const bg = this.add.graphics();
    bg.fillStyle(0x001122, 1);
    bg.fillRoundedRect(-44, -18, 88, 36, 8);
    bg.lineStyle(1, 0x224466, 0.8);
    bg.strokeRoundedRect(-44, -18, 88, 36, 8);
    container.add(bg);

    const label = this.add.text(0, 0, '← BACK', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '12px',
      color: '#446688'
    }).setOrigin(0.5);
    container.add(label);

    container.setSize(88, 36);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => label.setColor('#00AACC'));
    container.on('pointerout', () => label.setColor('#446688'));
    container.on('pointerdown', () => {
      if (this.audioManager) { this.audioManager.init(); this.audioManager.playClick(); }
      this.scene.start('MenuScene');
    });
  }
}

export default UpgradeScene;
