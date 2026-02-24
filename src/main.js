import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { UpgradeScene } from './scenes/UpgradeScene.js';
import { UpgradeSystem } from './UpgradeSystem.js';
import { AudioManager } from './AudioManager.js';
import { GameManager } from './GameManager.js';

// Initialize persistent systems (survive scene transitions)
const upgradeSystem = new UpgradeSystem();
const audioManager = new AudioManager();

const config = {
  type: Phaser.AUTO,
  width: 480,
  height: 800,
  backgroundColor: '#050510',
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 480,
    height: 800
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, UpgradeScene],
  callbacks: {
    preBoot: (game) => {
      // Store persistent systems in registry
      game.registry.set('upgradeSystem', upgradeSystem);
      game.registry.set('audioManager', audioManager);

      // Factory function — creates a fresh GameManager for each run
      const createGameManager = () => {
        const gm = new GameManager(upgradeSystem);
        game.registry.set('gameManager', gm);
        return gm;
      };

      // Create the initial GameManager
      createGameManager();

      // Expose factory so GameScene can refresh it on each play
      game.registry.set('createGameManager', createGameManager);

      // Debug helpers
      window.game = game;
      window.upgradeSystem = upgradeSystem;
      window.audioManager = audioManager;

      // Spec: window.game.riskEngine access
      Object.defineProperty(window.game, 'riskEngine', {
        get: () => {
          const gm = game.registry.get('gameManager');
          return gm ? gm.riskEngine : null;
        },
        configurable: true
      });
    }
  }
};

const game = new Phaser.Game(config);

export default game;
