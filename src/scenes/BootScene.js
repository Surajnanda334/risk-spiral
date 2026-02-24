export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    this._updateLoadingBar(30);
    // No external assets to load — all textures generated procedurally in create()
  }

  _updateLoadingBar(pct) {
    const bar = document.getElementById('loading-bar');
    if (bar) bar.style.width = pct + '%';
  }

  _generateTextures() {
    // Character texture (20x30 neon humanoid)
    this._createCharacterTexture();

    // Door textures
    this._createDoorTexture('door_low', 0x00FFFF, 0x003344);
    this._createDoorTexture('door_mid', 0xFF00FF, 0x330033);
    this._createDoorTexture('door_high', 0xFF2200, 0x330000);
    this._createDoorTexture('door_safe', 0x00FF88, 0x003322);
    this._createDoorTexture('door_special', 0xFFCC00, 0x332200);

    // Particle textures
    this._createParticleTexture('particle_cyan', 0x00FFFF);
    this._createParticleTexture('particle_gold', 0xFFCC00);
    this._createParticleTexture('particle_red', 0xFF2200);
    this._createParticleTexture('particle_green', 0x00FF88);
    this._createParticleTexture('particle_white', 0xFFFFFF);

    // Glow texture
    this._createGlowTexture();

    // Button textures
    this._createButtonTexture('btn_primary', 0x00FFFF, 0x001122);
    this._createButtonTexture('btn_danger', 0xFF2200, 0x220000);
    this._createButtonTexture('btn_gold', 0xFFCC00, 0x221100);
    this._createButtonTexture('btn_upgrade', 0x8800FF, 0x110022);
  }

  _createCharacterTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const w = 20, h = 30;

    // Body glow
    g.fillStyle(0x00FFFF, 0.15);
    g.fillEllipse(w / 2, h / 2, w + 8, h + 8);

    // Body
    g.fillStyle(0x00CCCC, 1);
    g.fillRect(7, 10, 6, 12);

    // Head
    g.fillStyle(0x00FFFF, 1);
    g.fillEllipse(w / 2, 7, 8, 8);

    // Arms
    g.fillStyle(0x00AAAA, 1);
    g.fillRect(3, 11, 4, 8);
    g.fillRect(13, 11, 4, 8);

    // Legs
    g.fillRect(7, 22, 3, 7);
    g.fillRect(10, 22, 3, 7);

    // Neon outline
    g.lineStyle(1, 0x00FFFF, 1);
    g.strokeEllipse(w / 2, 7, 8, 8);
    g.strokeRect(7, 10, 6, 12);

    g.generateTexture('character', w, h);
    g.destroy();
  }

  _createDoorTexture(key, borderColor, fillColor) {
    const w = 160, h = 200;
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Background
    g.fillStyle(fillColor, 1);
    g.fillRoundedRect(0, 0, w, h, 16);

    // Inner panel
    g.fillStyle(0x000011, 0.7);
    g.fillRoundedRect(6, 6, w - 12, h - 12, 12);

    // Border glow
    g.lineStyle(2, borderColor, 0.8);
    g.strokeRoundedRect(1, 1, w - 2, h - 2, 16);
    g.lineStyle(1, borderColor, 0.4);
    g.strokeRoundedRect(4, 4, w - 8, h - 8, 14);

    // Door arch shape at top
    g.fillStyle(borderColor, 0.15);
    g.fillRoundedRect(20, 15, w - 40, 80, 8);

    // Door handle
    g.fillStyle(borderColor, 0.6);
    g.fillCircle(w / 2, h / 2 + 20, 5);
    g.lineStyle(1, borderColor, 0.6);
    g.strokeCircle(w / 2, h / 2 + 20, 8);

    g.generateTexture(key, w, h);
    g.destroy();
  }

  _createParticleTexture(key, color) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(color, 1);
    g.fillCircle(4, 4, 4);
    g.fillStyle(color, 0.5);
    g.fillCircle(4, 4, 6);
    g.generateTexture(key, 8, 8);
    g.destroy();
  }

  _createGlowTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 64;
    // Radial gradient glow using concentric circles
    for (let r = size; r > 0; r -= 2) {
      const alpha = (1 - r / size) * 0.15;
      g.fillStyle(0xFFFFFF, alpha);
      g.fillCircle(size, size, r);
    }
    g.generateTexture('glow', size * 2, size * 2);
    g.destroy();
  }

  _createButtonTexture(key, borderColor, fillColor) {
    const w = 200, h = 50;
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    g.fillStyle(fillColor, 1);
    g.fillRoundedRect(0, 0, w, h, 10);

    g.lineStyle(2, borderColor, 1);
    g.strokeRoundedRect(1, 1, w - 2, h - 2, 10);

    // Shine
    g.fillStyle(borderColor, 0.1);
    g.fillRoundedRect(4, 4, w - 8, h / 2 - 4, 8);

    g.generateTexture(key, w, h);
    g.destroy();
  }

  create() {
    this._updateLoadingBar(60);
    this._generateTextures();
    this._updateLoadingBar(100);

    // Fade out loading overlay
    setTimeout(() => {
      const overlay = document.getElementById('loading-overlay');
      if (overlay) {
        overlay.classList.add('hidden');
        setTimeout(() => { overlay.style.display = 'none'; }, 600);
      }
    }, 200);

    this.scene.start('MenuScene');
  }
}

export default BootScene;
