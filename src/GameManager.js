import RiskEngine from './RiskEngine.js';
import { getEventsCenter } from './EventsCenter.js';

export class GameManager {
  constructor(upgradeSystem) {
    this.upgradeSystem = upgradeSystem;
    this.riskEngine = new RiskEngine();
    this.events = getEventsCenter();

    // Run state
    this.floor = 1;
    this.unbankedScore = 0;
    this.bankedScore = 0;
    this.shield = 0;
    this.saveTokens = 0;
    this.revivesLeft = 0;
    this.autoBankFloor = null;
    this.runActive = false;
    this.currentFloorData = null;

    // Mission tracking
    this.missionStats = {
      riskyDoorssurvived: 0,
      fortureTriggered: false,
      usedShield: false,
      maxFloor: 0,
      totalBanked: 0
    };
  }

  startRun() {
    const stats = this.upgradeSystem.getStats();

    this.floor = 1;
    this.unbankedScore = stats.startingScore;
    this.bankedScore = 0;
    this.shield = stats.startingShield;
    this.saveTokens = 0;
    this.revivesLeft = stats.revives;
    this.autoBankFloor = stats.autoBank ? 20 : null; // default auto-bank at floor 20 if enabled
    this.runActive = true;

    this.missionStats = {
      riskyDoorsSurvived: 0,
      fortuneTriggered: false,
      usedShield: false,
      maxFloor: 1,
      totalBanked: 0
    };

    // Reseed RNG
    this.riskEngine.reseed(Date.now());
    this.upgradeStats = stats;

    this.generateFloor();
    this.events.emit('run-started', this.getDisplayStats());
  }

  generateFloor() {
    this.currentFloorData = this.riskEngine.getFloorData(this.floor, this.upgradeStats);

    // Check auto-bank
    if (this.autoBankFloor && this.floor >= this.autoBankFloor) {
      setTimeout(() => this.bankAndExit(), 500);
      return;
    }

    this.events.emit('floor-generated', this.currentFloorData);
  }

  attemptDoor(doorId) {
    if (!this.runActive) return { success: false, reason: 'run-not-active' };

    const door = this.currentFloorData.doors.find(d => d.id === doorId);
    if (!door) return { success: false, reason: 'door-not-found' };

    const { failed, nearMiss } = this.riskEngine.rng.rollWithNearMiss(door.riskPercent);

    if (failed) {
      return this.handleFailure(door, nearMiss);
    } else {
      return this.applyReward(door, nearMiss);
    }
  }

  applyReward(door, nearMiss = false) {
    const stats = this.upgradeStats;
    let reward = 0;

    if (door.rewardType === 'flat') {
      reward = Math.floor(door.rewardValue * stats.rewardMultiplier);
      this.unbankedScore += reward;
    } else if (door.rewardType === 'multiply') {
      const newScore = Math.floor(this.unbankedScore * door.rewardValue * (stats.rewardMultiplier > 1 ? stats.rewardMultiplier : 1));
      reward = newScore - this.unbankedScore;
      this.unbankedScore = newScore;
    } else if (door.rewardType === 'shield') {
      this.shield += 1;
      reward = 0;
    } else if (door.rewardType === 'fortune') {
      // Fortune is handled specially
      reward = 0;
    }

    // Track risky door survivals
    if (door.riskPercent >= 30) {
      this.missionStats.riskyDoorsSurvived = (this.missionStats.riskyDoorsSurvived || 0) + 1;
    }
    if (this.currentFloorData.specialEvent === 'fortune') {
      this.missionStats.fortuneTriggered = true;
    }

    const result = {
      success: true,
      nearMiss,
      reward,
      rewardType: door.rewardType,
      newScore: this.unbankedScore,
      shield: this.shield
    };

    this.events.emit('reward-applied', result);

    // Advance floor
    this.floor++;
    this.missionStats.maxFloor = Math.max(this.missionStats.maxFloor || 0, this.floor);

    setTimeout(() => {
      this.events.emit('floor-complete', { floor: this.floor, previousFloor: this.floor - 1 });
      this.generateFloor();
    }, 100);

    return result;
  }

  handleFortune() {
    if (!this.runActive) return null;
    const won = Math.random() < 0.5;
    if (won) {
      const bonus = this.unbankedScore;
      this.unbankedScore *= 2;
      this.events.emit('fortune-result', { won: true, bonus });
    } else {
      this.events.emit('fortune-result', { won: false, bonus: 0 });
    }

    this.missionStats.fortuneTriggered = true;

    // Fortune doesn't count as a door — it's a bonus. Still advance floor.
    this.floor++;
    this.missionStats.maxFloor = Math.max(this.missionStats.maxFloor || 0, this.floor);

    setTimeout(() => {
      this.events.emit('floor-complete', { floor: this.floor, previousFloor: this.floor - 1 });
      this.generateFloor();
    }, 800);

    return { won, newScore: this.unbankedScore };
  }

  handleFailure(door, nearMiss = false) {
    // Check shield first
    if (this.shield > 0) {
      this.shield--;
      this.missionStats.usedShield = true;

      const result = {
        success: true,
        shieldAbsorbed: true,
        nearMiss,
        reward: 0,
        rewardType: 'shield-absorb',
        newScore: this.unbankedScore,
        shield: this.shield
      };

      this.events.emit('shield-absorbed', result);
      // Continue on current floor with shield absorbed — regenerate same floor
      this.generateFloor();
      return result;
    }

    // Check revive
    if (this.revivesLeft > 0) {
      this.revivesLeft--;
      const result = {
        success: true,
        revived: true,
        nearMiss,
        reward: 0,
        rewardType: 'revive',
        newScore: this.unbankedScore,
        shield: this.shield
      };
      this.events.emit('revive-used', result);
      // Regenerate same floor after revive
      this.generateFloor();
      return result;
    }

    // Hard fail — lose all unbanked score
    this.runActive = false;
    const lostScore = this.unbankedScore;
    this.unbankedScore = 0;

    const result = {
      success: false,
      failed: true,
      nearMiss,
      lostScore,
      bankedScore: this.bankedScore,
      floorReached: this.floor,
      missionStats: { ...this.missionStats }
    };

    this.events.emit('run-failed', result);
    return result;
  }

  bankAndExit() {
    if (!this.runActive) return null;
    this.runActive = false;
    this.bankedScore += this.unbankedScore;
    this.missionStats.totalBanked = this.bankedScore;

    const currencyEarned = Math.floor(this.bankedScore / 100) + Math.floor(this.floor / 5);
    this.upgradeSystem.addCurrency(currencyEarned);
    this.upgradeSystem.addTotalBanked(this.bankedScore);
    const isNewRecord = this.upgradeSystem.updateBestFloor(this.floor);

    const result = {
      bankedScore: this.bankedScore,
      floorReached: this.floor,
      currencyEarned,
      isNewRecord,
      missionStats: { ...this.missionStats }
    };

    this.events.emit('run-banked', result);
    return result;
  }

  // Called when run ends via failure (after failure animation)
  finalizeFailedRun() {
    const currencyEarned = Math.floor(this.bankedScore / 100) + Math.floor(this.floor / 5);
    if (this.bankedScore > 0) {
      this.upgradeSystem.addCurrency(currencyEarned);
      this.upgradeSystem.addTotalBanked(this.bankedScore);
    }
    const isNewRecord = this.upgradeSystem.updateBestFloor(this.floor);
    return {
      bankedScore: this.bankedScore,
      floorReached: this.floor,
      currencyEarned,
      isNewRecord
    };
  }

  getDisplayStats() {
    return {
      floor: this.floor,
      unbankedScore: this.unbankedScore,
      bankedScore: this.bankedScore,
      shield: this.shield,
      revivesLeft: this.revivesLeft,
      runActive: this.runActive,
      upgradeStats: this.upgradeStats
    };
  }

  setAutoBankFloor(floor) {
    this.autoBankFloor = floor;
  }
}

export default GameManager;
