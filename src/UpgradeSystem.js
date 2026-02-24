import { UPGRADES } from './data/upgrades.js';

const STORAGE_KEYS = {
  bestFloor: 'riskSpiral_bestFloor',
  totalBanked: 'riskSpiral_totalBanked',
  currency: 'riskSpiral_currency',
  upgrades: 'riskSpiral_upgrades',
  dailyReward: 'riskSpiral_dailyReward',
  achievements: 'riskSpiral_achievements',
  missions: 'riskSpiral_missions'
};

export class UpgradeSystem {
  constructor() {
    this._upgradeLevels = {};
    this._currency = 0;
    this._bestFloor = 0;
    this._totalBanked = 0;
    this._achievements = [];
    this.load();
  }

  load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.upgrades);
      this._upgradeLevels = saved ? JSON.parse(saved) : {};

      this._currency = parseInt(localStorage.getItem(STORAGE_KEYS.currency) || '0', 10);
      this._bestFloor = parseInt(localStorage.getItem(STORAGE_KEYS.bestFloor) || '0', 10);
      this._totalBanked = parseInt(localStorage.getItem(STORAGE_KEYS.totalBanked) || '0', 10);

      const achSaved = localStorage.getItem(STORAGE_KEYS.achievements);
      this._achievements = achSaved ? JSON.parse(achSaved) : [];
    } catch (e) {
      console.warn('UpgradeSystem: Failed to load from localStorage', e);
      this._upgradeLevels = {};
      this._currency = 0;
      this._bestFloor = 0;
      this._totalBanked = 0;
      this._achievements = [];
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEYS.upgrades, JSON.stringify(this._upgradeLevels));
      localStorage.setItem(STORAGE_KEYS.currency, String(this._currency));
      localStorage.setItem(STORAGE_KEYS.bestFloor, String(this._bestFloor));
      localStorage.setItem(STORAGE_KEYS.totalBanked, String(this._totalBanked));
      localStorage.setItem(STORAGE_KEYS.achievements, JSON.stringify(this._achievements));
    } catch (e) {
      console.warn('UpgradeSystem: Failed to save to localStorage', e);
    }
  }

  getLevel(upgradeId) {
    return this._upgradeLevels[upgradeId] || 0;
  }

  getUpgradeData(upgradeId) {
    return UPGRADES.find(u => u.id === upgradeId);
  }

  canPurchase(upgradeId) {
    const upgrade = this.getUpgradeData(upgradeId);
    if (!upgrade) return false;
    const level = this.getLevel(upgradeId);
    if (level >= upgrade.maxLevel) return false;
    const cost = upgrade.cost[level];
    return this._currency >= cost;
  }

  purchase(upgradeId) {
    if (!this.canPurchase(upgradeId)) return false;
    const upgrade = this.getUpgradeData(upgradeId);
    const level = this.getLevel(upgradeId);
    const cost = upgrade.cost[level];
    this._currency -= cost;
    this._upgradeLevels[upgradeId] = level + 1;
    this.save();
    return true;
  }

  getCurrency() {
    return this._currency;
  }

  addCurrency(amount) {
    this._currency += amount;
    this.save();
  }

  getBestFloor() {
    return this._bestFloor;
  }

  updateBestFloor(floor) {
    if (floor > this._bestFloor) {
      this._bestFloor = floor;
      this.save();
      return true; // new record
    }
    return false;
  }

  getTotalBanked() {
    return this._totalBanked;
  }

  addTotalBanked(amount) {
    this._totalBanked += amount;
    this.save();
  }

  // Returns aggregate stats from all current upgrades
  getStats() {
    const stats = {
      riskReduction: 0,        // flat % reduction (e.g., 0.03 = 3%)
      startingShield: 0,
      revives: 0,
      rewardMultiplier: 1.0,   // total multiplier
      revealRisk: false,
      autoBank: false,
      autoBankFloor: null,
      startingScore: 0
    };

    for (const upgrade of UPGRADES) {
      const level = this.getLevel(upgrade.id);
      if (level === 0) continue;

      const ef = upgrade.effect;
      if (ef.riskReduction) stats.riskReduction += ef.riskReduction * level;
      if (ef.startingShield) stats.startingShield += ef.startingShield * level;
      if (ef.revives) stats.revives += ef.revives * level;
      if (ef.rewardMultiplier) stats.rewardMultiplier += ef.rewardMultiplier * level;
      if (ef.revealRisk) stats.revealRisk = true;
      if (ef.autoBank) stats.autoBank = true;
      if (ef.startingScore) stats.startingScore += ef.startingScore * level;
    }

    return stats;
  }

  getCharacterVisuals() {
    const totalLevels = Object.values(this._upgradeLevels).reduce((s, v) => s + v, 0);
    const tier = Math.floor(totalLevels / 3);

    const auraColors = [0x00FFFF, 0x0088FF, 0x8800FF, 0xFF00FF, 0xFF4400, 0xFFFF00];
    const trailColors = [0x004488, 0x003388, 0x440088, 0x880044, 0x882200, 0x886600];

    const colorIdx = Math.min(tier, auraColors.length - 1);
    return {
      auraColor: auraColors[colorIdx],
      glowIntensity: 0.5 + totalLevels * 0.1,
      trailColor: trailColors[colorIdx]
    };
  }

  // Achievements
  hasAchievement(id) {
    return this._achievements.includes(id);
  }

  unlockAchievement(id) {
    if (!this.hasAchievement(id)) {
      this._achievements.push(id);
      this.save();
      return true; // newly unlocked
    }
    return false;
  }

  getAchievements() {
    return [...this._achievements];
  }

  // Daily reward
  checkDailyReward() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const saved = localStorage.getItem(STORAGE_KEYS.dailyReward);
      const state = saved ? JSON.parse(saved) : null;
      return !state || state.date !== today || !state.claimed;
    } catch (e) {
      return true;
    }
  }

  claimDailyReward() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const reward = 50 + Math.floor(Math.random() * 51); // 50–100 currency
      localStorage.setItem(STORAGE_KEYS.dailyReward, JSON.stringify({ date: today, claimed: true }));
      this._currency += reward;
      this.save();
      return reward;
    } catch (e) {
      return 50;
    }
  }

  // Daily missions
  getDailyMissions() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const saved = localStorage.getItem(STORAGE_KEYS.missions);
      const state = saved ? JSON.parse(saved) : null;

      if (state && state.date === today) {
        return state.missions;
      }

      return [];
    } catch (e) {
      return [];
    }
  }

  saveMissions(missions) {
    try {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(STORAGE_KEYS.missions, JSON.stringify({ date: today, missions }));
    } catch (e) {}
  }

  getAllUpgrades() {
    return UPGRADES.map(u => ({
      ...u,
      currentLevel: this.getLevel(u.id),
      canPurchase: this.canPurchase(u.id),
      nextCost: u.cost[this.getLevel(u.id)] || null
    }));
  }

  reset() {
    this._upgradeLevels = {};
    this._currency = 0;
    this._bestFloor = 0;
    this._totalBanked = 0;
    this._achievements = [];
    this.save();
  }
}

export default UpgradeSystem;
