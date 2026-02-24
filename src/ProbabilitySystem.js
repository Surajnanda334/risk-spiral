// Mulberry32 seeded PRNG for fair, reproducible randomness

export class ProbabilitySystem {
  constructor(seed = Date.now()) {
    this._initialSeed = seed;
    this._seed = seed >>> 0;
  }

  reseed(newSeed) {
    this._initialSeed = newSeed;
    this._seed = newSeed >>> 0;
  }

  // Mulberry32 algorithm — fast, high quality 32-bit PRNG
  nextFloat() {
    let t = (this._seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(min, max) {
    return Math.floor(this.nextFloat() * (max - min + 1)) + min;
  }

  // Returns true if the risk triggers (fail)
  // riskPercent: 0–100
  rollRisk(riskPercent) {
    const roll = this.nextFloat();
    return roll < riskPercent / 100;
  }

  // Cosmetic near-miss: rolled safe but within 5% margin
  isNearMiss(riskPercent) {
    const roll = this.nextFloat();
    const threshold = riskPercent / 100;
    // Safe (didn't fail) but within 5% of threshold
    return roll >= threshold && roll < threshold + 0.05;
  }

  // Roll with near-miss detection in one call (returns { failed, nearMiss })
  rollWithNearMiss(riskPercent) {
    const roll = this.nextFloat();
    const threshold = riskPercent / 100;
    const failed = roll < threshold;
    const nearMiss = !failed && roll < threshold + 0.05;
    return { failed, nearMiss, roll, threshold };
  }

  // Pick a random float between two values
  between(min, max) {
    return min + this.nextFloat() * (max - min);
  }

  // Pick random item from array
  pick(arr) {
    return arr[Math.floor(this.nextFloat() * arr.length)];
  }

  // Shuffle array (Fisher-Yates)
  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.nextFloat() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}

export default ProbabilitySystem;
