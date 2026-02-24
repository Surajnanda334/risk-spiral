import { getEventsCenter } from '../EventsCenter.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    const { width, height } = this.scale;
    this.W = width;
    this.H = height;

    // Create a fresh GameManager for each run
    const createGameManager = this.registry.get('createGameManager');
    if (createGameManager) createGameManager();

    // Get systems from registry
    this.gameManager = this.registry.get('gameManager');
    this.audioManager = this.registry.get('audioManager');
    this.upgradeSystem = this.registry.get('upgradeSystem');
    this.events_center = getEventsCenter();

    // Init audio
    if (this.audioManager) {
      this.audioManager.init();
    }

    // State
    this._doorInteractive = false;
    this._currentFloorData = null;
    this._doorContainers = [];
    this._transitionActive = false;

    // Create layers
    this._bg = this.add.container(0, 0);
    this._worldLayer = this.add.container(0, 0);
    this._uiLayer = this.add.container(0, 0);
    this._fxLayer = this.add.container(0, 0);

    this._drawBackground();
    this._createUI();
    this._createCharacter();
    this._setupEvents();

    // Start run
    this.gameManager.startRun();

    if (this.audioManager) {
      this.audioManager.playAmbient();
    }
  }

  _drawBackground() {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x050510, 0x050510, 0x080520, 0x080520, 1);
    bg.fillRect(0, 0, this.W, this.H);
    this._bg.add(bg);

    // Grid lines
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x111133, 0.3);
    for (let y = 0; y < this.H; y += 40) {
      grid.strokeLineShape(new Phaser.Geom.Line(0, y, this.W, y));
    }
    for (let x = 0; x < this.W; x += 40) {
      grid.strokeLineShape(new Phaser.Geom.Line(x, 0, x, this.H));
    }
    this._bg.add(grid);

    // Spiral path indicator
    this._spiralGraphic = this.add.graphics();
    this._bg.add(this._spiralGraphic);
    this._drawSpiralPath(1);
  }

  _drawSpiralPath(floor) {
    if (!this._spiralGraphic) return;
    this._spiralGraphic.clear();
    const riskLevel = Math.min(1, (floor - 1) / 100);
    // Interpolate from teal (low risk) to red (high risk)
    const r = Math.floor(riskLevel * 150);
    const g = Math.floor((1 - riskLevel) * 50);
    const b = Math.floor((1 - riskLevel) * 100);
    const color = Phaser.Display.Color.GetColor(r, g, b);
    this._spiralGraphic.lineStyle(1, color, 0.12);
    this._spiralGraphic.beginPath();
    const cx = this.W / 2, cy = this.H * 0.6;
    for (let a = 0; a < Math.PI * 6; a += 0.05) {
      const r = 15 + a * 15;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r * 0.4;
      if (a === 0) this._spiralGraphic.moveTo(x, y);
      else this._spiralGraphic.lineTo(x, y);
    }
    this._spiralGraphic.strokePath();
  }

  _createUI() {
    // Top HUD
    const hud = this.add.graphics();
    hud.fillStyle(0x000011, 0.85);
    hud.fillRect(0, 0, this.W, 70);
    hud.lineStyle(1, 0x112233, 0.6);
    hud.strokeLineShape(new Phaser.Geom.Line(0, 70, this.W, 70));
    this._uiLayer.add(hud);

    // Floor counter
    this.add.text(16, 12, 'FLOOR', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '11px',
      color: '#446688'
    });
    this._floorText = this.add.text(16, 26, 'F-1', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#00FFFF'
    });

    // Score display
    this.add.text(this.W / 2, 12, 'SCORE', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '11px',
      color: '#446688'
    }).setOrigin(0.5, 0);
    this._scoreText = this.add.text(this.W / 2, 27, '0', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#FFFFFF'
    }).setOrigin(0.5, 0);

    // Shield / status icons
    this._shieldContainer = this.add.container(this.W - 16, 22);
    this._uiLayer.add(this._shieldContainer);
    this._updateShieldDisplay(0);

    // Tier badge
    this._tierText = this.add.text(this.W / 2, 55, '', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '10px',
      color: '#446688',
      letterSpacing: 3
    }).setOrigin(0.5);

    // Bank & Exit button
    this._bankBtn = this._createBankButton();

    // Event label (shown for special events)
    this._eventLabel = this.add.text(this.W / 2, this.H * 0.37, '', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#FFCC00',
      stroke: '#221100',
      strokeThickness: 3
    }).setOrigin(0.5).setAlpha(0);
  }

  _createBankButton() {
    const x = this.W / 2;
    const y = this.H - 55;
    const w = 200, h = 44;

    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0x001122, 0.9);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    bg.lineStyle(2, 0x00FF88, 0.9);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);

    const label = this.add.text(0, 0, '💰 BANK & EXIT', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#00FF88'
    }).setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x00FF88, 0.15);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
      bg.lineStyle(2, 0x00FF88, 1);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x001122, 0.9);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
      bg.lineStyle(2, 0x00FF88, 0.9);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    });

    container.on('pointerdown', () => {
      if (!this._doorInteractive) return;
      if (this.audioManager) this.audioManager.playBankSound();
      this.tweens.add({ targets: container, scaleX: 0.95, scaleY: 0.95, duration: 80, yoyo: true });
      this._doorInteractive = false;
      setTimeout(() => this.gameManager.bankAndExit(), 200);
    });

    return container;
  }

  _createCharacter() {
    const visuals = this.upgradeSystem ? this.upgradeSystem.getCharacterVisuals() : { auraColor: 0x00FFFF, glowIntensity: 0.5, trailColor: 0x004488 };

    const charX = this.W / 2;
    const charY = this.H * 0.78;

    // Aura glow behind character
    this._charAura = this.add.graphics();
    this._charAura.fillStyle(visuals.auraColor, 0.08);
    this._charAura.fillEllipse(charX, charY + 4, 50, 20);

    // Character sprite
    this._character = this.add.image(charX, charY, 'character');
    this._character.setScale(1.5);
    this._character.setTint(visuals.auraColor);

    // Idle bob animation
    this.tweens.add({
      targets: this._character,
      y: charY - 6,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });
    this.tweens.add({
      targets: this._charAura,
      alpha: 0.04,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });

    this._charVisuals = visuals;
    this._charBaseY = charY;
    this._charX = charX;
  }

  _setupEvents() {
    const ec = this.events_center;

    ec.on('floor-generated', this._onFloorGenerated, this);
    ec.on('reward-applied', this._onRewardApplied, this);
    ec.on('run-failed', this._onRunFailed, this);
    ec.on('run-banked', this._onRunBanked, this);
    ec.on('floor-complete', this._onFloorComplete, this);
    ec.on('shield-absorbed', this._onShieldAbsorbed, this);
    ec.on('revive-used', this._onReviveUsed, this);
    ec.on('fortune-result', this._onFortuneResult, this);
  }

  _onFloorGenerated(floorData) {
    this._currentFloorData = floorData;
    this._transitionActive = false;

    // Reset character to home position
    if (this._character) {
      this.tweens.killTweensOf(this._character);
      this.tweens.add({
        targets: this._character,
        x: this._charX,
        y: this._charBaseY,
        duration: 250,
        ease: 'Back.Out',
        onComplete: () => {
          // Re-start idle bob
          this.tweens.add({
            targets: this._character,
            y: this._charBaseY - 6,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut'
          });
        }
      });
    }

    this.renderFloor(floorData);

    if (this.audioManager) {
      this.audioManager.setFloor(floorData.floorNumber);
    }
  }

  _onFloorComplete(data) {
    if (this.audioManager) {
      this.audioManager.playFloorAscend();
      this.audioManager.setFloor(data.floor);
    }
    this._drawSpiralPath(data.floor);
  }

  _onRewardApplied(result) {
    this._updateHUD(result.newScore);
    this._updateShieldDisplay(result.shield);
    if (result.rewardType !== 'shield') {
      this._showFloatingScore('+' + result.reward, result.nearMiss);
    }
    if (this.audioManager) {
      if (result.nearMiss) this.audioManager.playNearMiss();
      else this.audioManager.playRewardChime();
    }
    if (result.rewardType === 'shield') {
      this._showFloatingText('+SHIELD', 0x00FF88);
      if (this.audioManager) this.audioManager.playShieldPickup();
    }
  }

  _onShieldAbsorbed(result) {
    this._updateShieldDisplay(result.shield);
    this._showShieldAbsorbAnimation();
    this._showFloatingText('SHIELD!', 0x00FFFF);
    if (this.audioManager) this.audioManager.playShieldPickup();
  }

  _onReviveUsed(result) {
    this._showFloatingText('REVIVE!', 0xFF00FF);
  }

  _onFortuneResult(result) {
    if (result.won) {
      this._showFloatingText('DOUBLED!', 0xFFCC00);
      this._showFloatingScore('+' + result.bonus, false);
      this._triggerParticleBurst(this.W / 2, this.H / 2, 'particle_gold', 30);
    } else {
      this._showFloatingText('SAFE!', 0x00FF88);
    }
    if (this.audioManager) {
      this.audioManager.playFortune(result.won);
    }
    this._updateHUD(this.gameManager.unbankedScore);
  }

  _onRunFailed(result) {
    this._doorInteractive = false;
    this._playFailAnimation(() => {
      // Navigate to GameOver after animation
      const finalData = this.gameManager.finalizeFailedRun();
      if (this.audioManager) this.audioManager.stopAmbient();
      this._cleanupEvents();
      this.scene.start('GameOverScene', {
        success: false,
        bankedScore: finalData.bankedScore,
        floorReached: finalData.floorReached,
        currencyEarned: finalData.currencyEarned,
        isNewRecord: finalData.isNewRecord,
        lostScore: result.lostScore
      });
    });
  }

  _onRunBanked(result) {
    this._doorInteractive = false;
    this._playBankAnimation(() => {
      if (this.audioManager) this.audioManager.stopAmbient();
      this._cleanupEvents();
      this.scene.start('GameOverScene', {
        success: true,
        bankedScore: result.bankedScore,
        floorReached: result.floorReached,
        currencyEarned: result.currencyEarned,
        isNewRecord: result.isNewRecord
      });
    });
  }

  _cleanupEvents() {
    const ec = this.events_center;
    ec.off('floor-generated', this._onFloorGenerated, this);
    ec.off('reward-applied', this._onRewardApplied, this);
    ec.off('run-failed', this._onRunFailed, this);
    ec.off('run-banked', this._onRunBanked, this);
    ec.off('floor-complete', this._onFloorComplete, this);
    ec.off('shield-absorbed', this._onShieldAbsorbed, this);
    ec.off('revive-used', this._onReviveUsed, this);
    ec.off('fortune-result', this._onFortuneResult, this);
  }

  renderFloor(floorData) {
    // Clear existing doors
    this._clearDoors();

    const floor = floorData.floorNumber;

    // Update HUD
    this._floorText.setText(`F-${floor}`);
    this._tierText.setText(floorData.tier ? `— ${floorData.tier.toUpperCase()} ZONE —` : '');

    // Show event label if special
    if (floorData.specialEvent) {
      this._showEventLabel(floorData.specialEvent, floorData);
    } else {
      this._eventLabel.setAlpha(0);
    }

    // Stability floor announcement
    if (floorData.isStabilityFloor) {
      this._showEventLabel('STABILITY', floorData);
    }

    // Determine door layout
    const doors = floorData.doors;
    const doorCount = doors.length;
    // For 3-door chaos: use narrower cards/spacing to fit in 480px
    const doorW = doorCount === 3 ? 138 : 150;
    const spacing = doorCount === 3 ? 152 : 170;
    const startX = this.W / 2 - (doorCount - 1) * (spacing / 2);
    const doorY = this.H * 0.52;

    doors.forEach((door, i) => {
      const x = doorCount === 1 ? this.W / 2 : startX + i * spacing;
      this._createDoorCard(door, x, doorY, floorData, i, doors.length, doorW);
    });

    // Allow interaction after brief delay
    this.time.delayedCall(300, () => {
      this._doorInteractive = true;
    });
  }

  _getDoorTextureForRisk(riskPercent, isStability) {
    if (isStability || riskPercent === 0) return 'door_safe';
    if (riskPercent <= 15) return 'door_low';
    if (riskPercent <= 30) return 'door_mid';
    if (riskPercent <= 45) return 'door_high';
    return 'door_high';
  }

  _getDoorColor(riskPercent, isStability) {
    if (isStability || riskPercent === 0) return 0x00FF88;
    if (riskPercent <= 15) return 0x00FFFF;
    if (riskPercent <= 25) return 0x44FFAA;
    if (riskPercent <= 35) return 0xFFAA00;
    if (riskPercent <= 45) return 0xFF4400;
    return 0xFF0022;
  }

  _createDoorCard(door, x, y, floorData, index, totalDoors, cardW = 150) {
    const container = this.add.container(x, y);
    const w = cardW, h = 185;
    const riskColor = this._getDoorColor(door.riskPercent, door.isStability);
    const isHidden = door.riskHidden;
    const isFortune = door.rewardType === 'fortune';
    const isShield = door.rewardType === 'shield';
    const isStability = floorData.isStabilityFloor || door.isStability;

    // Main card background
    const bg = this.add.graphics();
    bg.fillStyle(0x000018, 0.95);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
    bg.lineStyle(2, riskColor, 0.9);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);

    // Inner glow
    const glow = this.add.graphics();
    glow.lineStyle(1, riskColor, 0.3);
    glow.strokeRoundedRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 10);

    // Door arch graphic
    const arch = this.add.graphics();
    arch.fillStyle(riskColor, 0.08);
    arch.fillRoundedRect(-w / 2 + 15, -h / 2 + 12, w - 30, 70, 6);
    arch.lineStyle(1, riskColor, 0.3);
    arch.strokeRoundedRect(-w / 2 + 15, -h / 2 + 12, w - 30, 70, 6);

    // Door label (A/B/C)
    const doorId = this.add.text(0, -h / 2 + 35, door.id, {
      fontFamily: 'Orbitron, monospace',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#' + riskColor.toString(16).padStart(6, '0')
    }).setOrigin(0.5);

    // Reward text
    let rewardDisplay = door.label;
    if (isFortune) rewardDisplay = '🪙 FLIP';
    else if (isShield) rewardDisplay = '🛡 +SHIELD';

    const rewardText = this.add.text(0, -h / 2 + 100, rewardDisplay, {
      fontFamily: 'Orbitron, monospace',
      fontSize: rewardDisplay.length > 8 ? '14px' : '18px',
      fontStyle: 'bold',
      color: '#FFCC00'
    }).setOrigin(0.5);

    // Risk display
    let riskDisplay;
    let riskDisplayColor = '#' + riskColor.toString(16).padStart(6, '0');

    if (isStability) {
      riskDisplay = '✓ SAFE';
      riskDisplayColor = '#00FF88';
    } else if (isHidden) {
      riskDisplay = '? RISK';
      riskDisplayColor = '#AA44FF';
    } else if (isFortune) {
      riskDisplay = '50% CHANCE';
      riskDisplayColor = '#FFCC00';
    } else if (isShield || door.riskPercent === 0) {
      riskDisplay = '✓ FREE';
      riskDisplayColor = '#00FF88';
    } else {
      // Only show risk if True Sight unlocked or always show (for now always show)
      const showExact = this.upgradeSystem && this.upgradeSystem.getStats().revealRisk;
      if (showExact) {
        riskDisplay = `${door.riskPercent}% RISK`;
      } else {
        // Show approximate risk level
        const level = this._getRiskLevel(door.riskPercent);
        riskDisplay = `${level} RISK`;
      }
    }

    const riskText = this.add.text(0, -h / 2 + 130, riskDisplay, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '12px',
      color: riskDisplayColor
    }).setOrigin(0.5);

    // Risk percentage in small text (always show exact for transparency)
    if (!isStability && !isShield && !isFortune && door.riskPercent > 0) {
      const pctText = this.add.text(0, -h / 2 + 148, `(${door.riskPercent}%)`, {
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '10px',
        color: '#' + riskColor.toString(16).padStart(6, '0')
      }).setOrigin(0.5).setAlpha(0.5);
      container.add(pctText);
    }

    // "CLICK TO ENTER" prompt
    const enterText = this.add.text(0, h / 2 - 20, 'ENTER', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '10px',
      color: '#' + riskColor.toString(16).padStart(6, '0'),
      letterSpacing: 3
    }).setOrigin(0.5);

    container.add([bg, glow, arch, doorId, rewardText, riskText, enterText]);

    // Danger pulse for high-risk doors
    if (door.riskPercent > 40) {
      this.tweens.add({
        targets: bg,
        alpha: 0.85,
        duration: 600,
        yoyo: true,
        repeat: -1
      });
    }

    // Hover effects
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });
    container.setAlpha(0);
    container.setScale(0.9);

    // Entry animation
    this.tweens.add({
      targets: container,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      delay: index * 80,
      ease: 'Back.Out'
    });

    container.on('pointerover', () => {
      if (!this._doorInteractive) return;
      this.tweens.add({ targets: container, scaleX: 1.05, scaleY: 1.05, duration: 100 });
      bg.clear();
      bg.fillStyle(riskColor, 0.12);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
      bg.lineStyle(2, riskColor, 1);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
      if (this.audioManager) this.audioManager.playDoorTension();
    });

    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 });
      bg.clear();
      bg.fillStyle(0x000018, 0.95);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
      bg.lineStyle(2, riskColor, 0.9);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
    });

    container.on('pointerdown', () => {
      if (!this._doorInteractive || this._transitionActive) return;
      this._transitionActive = true;
      this._doorInteractive = false;
      this._onDoorClick(door, container, x, y);
    });

    this._doorContainers.push(container);
  }

  _getRiskLevel(riskPercent) {
    if (riskPercent <= 10) return 'LOW';
    if (riskPercent <= 20) return 'MOD';
    if (riskPercent <= 35) return 'HIGH';
    if (riskPercent <= 50) return 'VERY HIGH';
    return 'EXTREME';
  }

  _onDoorClick(door, cardContainer, cardX, cardY) {
    // Animate character dash toward door
    const charDashX = cardX;
    const charDashY = this._charBaseY - 100;

    this.tweens.add({
      targets: this._character,
      x: charDashX,
      y: charDashY,
      duration: 300,
      ease: 'Quad.In',
      onComplete: () => {
        // Flash the door
        this.tweens.add({
          targets: cardContainer,
          alpha: 0,
          duration: 80,
          yoyo: true,
          repeat: 2,
          onComplete: () => {
            // Handle fortune event specially
            if (door.rewardType === 'fortune') {
              this.gameManager.handleFortune();
            } else {
              this.gameManager.attemptDoor(door.id);
            }
          }
        });
      }
    });
  }

  _clearDoors() {
    for (const c of this._doorContainers) {
      this.tweens.killTweensOf(c);
      c.destroy();
    }
    this._doorContainers = [];
  }

  _updateHUD(score) {
    this._scoreText.setText(score.toLocaleString());
    // Flash score on update
    this.tweens.add({
      targets: this._scoreText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 80,
      yoyo: true
    });
  }

  _updateShieldDisplay(shieldCount) {
    this._shieldContainer.removeAll(true);
    for (let i = 0; i < shieldCount; i++) {
      const shield = this.add.text(-i * 18, 0, '🛡', {
        fontSize: '16px'
      }).setOrigin(1, 0.5);
      this._shieldContainer.add(shield);
    }
  }

  _showEventLabel(eventType, floorData) {
    const LABELS = {
      chaos: '⚡ CHAOS FLOOR',
      double: '×2 DOUBLE REWARDS',
      mystery: '? MYSTERY DOOR',
      shield: '🛡 SAFE PASSAGE',
      fortune: '🪙 FORTUNE FLIP',
      STABILITY: '✓ STABILITY FLOOR'
    };
    const label = LABELS[eventType] || eventType;

    const COLORS = {
      chaos: '#FF2200', double: '#FFAA00', mystery: '#AA44FF',
      shield: '#00FF88', fortune: '#FFCC00', STABILITY: '#00FF88'
    };
    const color = COLORS[eventType] || '#FFCC00';

    this._eventLabel.setText(label);
    this._eventLabel.setStyle({ color });
    this._eventLabel.setAlpha(0);
    this.tweens.add({
      targets: this._eventLabel,
      alpha: 1,
      y: this.H * 0.365,
      duration: 300,
      ease: 'Back.Out'
    });
  }

  _showFloatingScore(text, isNearMiss) {
    const color = isNearMiss ? '#FFAA00' : '#FFCC00';
    const floater = this.add.text(this.W / 2, this.H * 0.44, text, {
      fontFamily: 'Orbitron, monospace',
      fontSize: '22px',
      fontStyle: 'bold',
      color,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.tweens.add({
      targets: floater,
      y: this.H * 0.38,
      alpha: 0,
      duration: 1000,
      ease: 'Cubic.Out',
      onComplete: () => floater.destroy()
    });
  }

  _showFloatingText(text, color) {
    const hex = '#' + color.toString(16).padStart(6, '0');
    const floater = this.add.text(this.W / 2, this.H * 0.5, text, {
      fontFamily: 'Orbitron, monospace',
      fontSize: '26px',
      fontStyle: 'bold',
      color: hex,
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.tweens.add({
      targets: floater,
      y: this.H * 0.44,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0,
      duration: 1200,
      ease: 'Cubic.Out',
      onComplete: () => floater.destroy()
    });
  }

  _triggerParticleBurst(x, y, textureKey, count = 20) {
    for (let i = 0; i < count; i++) {
      const p = this.add.image(x, y, textureKey);
      p.setScale(0.5 + Math.random() * 0.5);
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 200;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      this.tweens.add({
        targets: p,
        x: x + vx * 0.8,
        y: y + vy * 0.8,
        alpha: 0,
        scaleX: 0.1,
        scaleY: 0.1,
        duration: 600 + Math.random() * 400,
        ease: 'Cubic.Out',
        onComplete: () => p.destroy()
      });
    }
  }

  _showShieldAbsorbAnimation() {
    // Flash white ring
    const ring = this.add.graphics();
    ring.lineStyle(4, 0x00FFFF, 1);
    ring.strokeCircle(this.W / 2, this._charBaseY, 40);
    this.tweens.add({
      targets: ring,
      scaleX: 2.5,
      scaleY: 2.5,
      alpha: 0,
      duration: 600,
      ease: 'Cubic.Out',
      onComplete: () => ring.destroy()
    });

    // Screen flash
    const flash = this.add.graphics();
    flash.fillStyle(0x00FFFF, 0.3);
    flash.fillRect(0, 0, this.W, this.H);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 400,
      onComplete: () => flash.destroy()
    });
  }

  _playFailAnimation(onComplete) {
    if (this.audioManager) this.audioManager.playFailure();

    // Screen shake
    this.cameras.main.shake(500, 0.03);

    // Red flash overlay
    const flash = this.add.graphics();
    flash.fillStyle(0xFF0000, 0.6);
    flash.fillRect(0, 0, this.W, this.H);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 800,
      onComplete: () => flash.destroy()
    });

    // Character dissolve
    this.tweens.killTweensOf(this._character);
    this.tweens.add({
      targets: this._character,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 600,
      ease: 'Cubic.Out'
    });

    // "FAILED" text
    const failText = this.add.text(this.W / 2, this.H / 2, 'FAILED', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#FF0000',
      stroke: '#440000',
      strokeThickness: 6
    }).setOrigin(0.5).setAlpha(0).setScale(0.5);

    this.tweens.add({
      targets: failText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: 'Back.Out',
      onComplete: () => {
        this.time.delayedCall(1000, () => {
          this.tweens.add({
            targets: failText,
            alpha: 0,
            duration: 400,
            onComplete
          });
        });
      }
    });
  }

  _playBankAnimation(onComplete) {
    // Gold flash
    const flash = this.add.graphics();
    flash.fillStyle(0xFFCC00, 0.4);
    flash.fillRect(0, 0, this.W, this.H);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 600,
      onComplete: () => flash.destroy()
    });

    // "BANKED!" text
    const bankText = this.add.text(this.W / 2, this.H / 2, 'BANKED!', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '44px',
      fontStyle: 'bold',
      color: '#FFCC00',
      stroke: '#443300',
      strokeThickness: 6
    }).setOrigin(0.5).setAlpha(0).setScale(0.5);

    this.tweens.add({
      targets: bankText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: 'Back.Out',
      onComplete: () => {
        this._triggerParticleBurst(this.W / 2, this.H / 2, 'particle_gold', 30);
        this.time.delayedCall(1200, () => {
          this.tweens.add({
            targets: bankText,
            alpha: 0,
            duration: 400,
            onComplete
          });
        });
      }
    });
  }

  shutdown() {
    this._cleanupEvents();
    if (this._particleTimer) this._particleTimer.remove();
    this._clearDoors();
  }
}

export default GameScene;
