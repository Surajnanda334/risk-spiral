import { getTierForFloor, SPECIAL_EVENTS } from './data/floorConfig.js';
import ProbabilitySystem from './ProbabilitySystem.js';

export class RiskEngine {
  constructor() {
    this.rng = new ProbabilitySystem(Date.now());
    this._lastSpecialEventFloor = 0;
    this._nextSpecialEventIn = this._randomSpecialInterval();
  }

  _randomSpecialInterval() {
    // Special events appear every 7–15 floors
    return 7 + Math.floor(Math.random() * 9);
  }

  reseed(seed) {
    this.rng.reseed(seed);
    this._lastSpecialEventFloor = 0;
    this._nextSpecialEventIn = this._randomSpecialInterval();
  }

  shouldTriggerSpecialEvent(floorNum) {
    if (floorNum % 10 === 0) return false; // Stability floor, no special event
    if (floorNum < 3) return false; // No special events on first 2 floors
    const floorssinceLastEvent = floorNum - this._lastSpecialEventFloor;
    return floorssinceLastEvent >= this._nextSpecialEventIn;
  }

  getSpecialEvent(floorNum) {
    this._lastSpecialEventFloor = floorNum;
    this._nextSpecialEventIn = this._randomSpecialInterval();
    const events = Object.keys(SPECIAL_EVENTS);
    return this.rng.pick(events);
  }

  getRiskForFloor(floorNum, baseRisk, upgradeStats = {}) {
    const riskReduction = (upgradeStats.riskReduction || 0) * 100; // convert to percentage points
    const adjusted = Math.max(1, baseRisk - riskReduction);
    return Math.round(adjusted);
  }

  _lerp(a, b, t) {
    return a + (b - a) * t;
  }

  _generateDoors(floorNum, tier, upgradeStats, specialEvent) {
    const doors = [];
    const doorCount = specialEvent === 'chaos' ? 3 : 2;
    const isDouble = specialEvent === 'double';
    const isMystery = specialEvent === 'mystery';

    for (let i = 0; i < doorCount; i++) {
      const isHighRisk = (doorCount === 3) ? (i === 1) : (i === 1); // center/right is higher risk
      const doorLabel = doorCount === 3 ? ['A', 'B', 'C'][i] : ['A', 'B'][i];

      let riskBase, rewardType, rewardValue;

      if (doorCount === 3 && i === 1) {
        // Chaos center door: best reward, highest risk
        const chaosRisk = Math.min(75, tier.riskBMax + 15);
        riskBase = tier.riskBMin + Math.floor(this.rng.nextFloat() * (chaosRisk - tier.riskBMin));
        rewardType = 'multiply';
        rewardValue = parseFloat((tier.multiplyMax * 1.5).toFixed(1));
      } else if (isHighRisk) {
        // Higher risk door (B)
        riskBase = tier.riskBMin + Math.floor(this.rng.nextFloat() * (tier.riskBMax - tier.riskBMin + 1));
        rewardType = 'multiply';
        rewardValue = parseFloat(this.rng.between(tier.multiplyMin, tier.multiplyMax).toFixed(1));
      } else {
        // Lower risk door (A)
        riskBase = tier.riskAMin + Math.floor(this.rng.nextFloat() * (tier.riskAMax - tier.riskAMin + 1));
        rewardType = 'flat';
        rewardValue = Math.floor(this.rng.between(tier.flatRewardMin, tier.flatRewardMax));
      }

      const riskPercent = this.getRiskForFloor(floorNum, riskBase, upgradeStats);

      // Apply double event multiplier
      if (isDouble && rewardType === 'flat') {
        rewardValue *= 2;
      } else if (isDouble && rewardType === 'multiply') {
        rewardValue = parseFloat((rewardValue * 1.5).toFixed(1));
      }

      let label;
      if (rewardType === 'flat') {
        label = isDouble ? `+${rewardValue} ×2!` : `+${rewardValue}`;
      } else {
        label = isDouble ? `×${rewardValue}!` : `×${rewardValue}`;
      }

      doors.push({
        id: doorLabel,
        label,
        rewardType,
        rewardValue,
        riskPercent,
        riskHidden: isMystery,
        isHighRisk
      });
    }

    return doors;
  }

  getFloorData(floorNum, upgradeStats = {}) {
    const tier = getTierForFloor(floorNum);
    const isStabilityFloor = floorNum % 10 === 0;

    let specialEvent = null;
    if (!isStabilityFloor && this.shouldTriggerSpecialEvent(floorNum)) {
      specialEvent = this.getSpecialEvent(floorNum);
    }

    // Shield event: single door, no risk
    if (specialEvent === 'shield') {
      return {
        floorNumber: floorNum,
        isStabilityFloor: false,
        specialEvent: 'shield',
        tier: tier.name,
        bgColor: tier.bgColor,
        accentColor: tier.accentColor,
        doors: [{
          id: 'A',
          label: '+SHIELD',
          rewardType: 'shield',
          rewardValue: 1,
          riskPercent: 0,
          riskHidden: false
        }]
      };
    }

    // Fortune event: single door, coin flip
    if (specialEvent === 'fortune') {
      return {
        floorNumber: floorNum,
        isStabilityFloor: false,
        specialEvent: 'fortune',
        tier: tier.name,
        bgColor: tier.bgColor,
        accentColor: tier.accentColor,
        doors: [{
          id: 'A',
          label: 'FLIP',
          rewardType: 'fortune',
          rewardValue: 2.0,
          riskPercent: 50,
          riskHidden: false
        }]
      };
    }

    // Stability floor: guaranteed safe reward
    if (isStabilityFloor) {
      const rewardValue = Math.floor(
        this.rng.between(tier.stabilityRewardMin, tier.stabilityRewardMax)
      );
      return {
        floorNumber: floorNum,
        isStabilityFloor: true,
        specialEvent: null,
        tier: tier.name,
        bgColor: tier.bgColor,
        accentColor: tier.accentColor,
        doors: [{
          id: 'A',
          label: `+${rewardValue}`,
          rewardType: 'flat',
          rewardValue,
          riskPercent: 0,
          riskHidden: false,
          isStability: true
        }]
      };
    }

    // Normal floor with doors
    const doors = this._generateDoors(floorNum, tier, upgradeStats, specialEvent);

    return {
      floorNumber: floorNum,
      isStabilityFloor: false,
      specialEvent,
      tier: tier.name,
      bgColor: tier.bgColor,
      accentColor: tier.accentColor,
      doors
    };
  }
}

export default RiskEngine;
