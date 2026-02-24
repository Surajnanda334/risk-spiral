export const UPGRADES = [
  {
    id: 'steel_nerves',
    name: 'Steel Nerves',
    desc: '-1% risk per level',
    icon: '🧠',
    cost: [100, 200, 400, 800, 1600],
    maxLevel: 5,
    effect: { riskReduction: 0.01 }
  },
  {
    id: 'iron_will',
    name: 'Iron Will',
    desc: '+5 starting shield',
    icon: '🛡',
    cost: [150, 300, 600],
    maxLevel: 3,
    effect: { startingShield: 5 }
  },
  {
    id: 'second_chance',
    name: 'Second Chance',
    desc: '1 free revive per run',
    icon: '💫',
    cost: [500],
    maxLevel: 1,
    effect: { revives: 1 }
  },
  {
    id: 'lucky_eye',
    name: 'Lucky Eye',
    desc: '+10% reward multiplier',
    icon: '👁',
    cost: [250, 500, 1000],
    maxLevel: 3,
    effect: { rewardMultiplier: 0.10 }
  },
  {
    id: 'true_sight',
    name: 'True Sight',
    desc: 'Reveals exact risk %',
    icon: '🔮',
    cost: [400],
    maxLevel: 1,
    effect: { revealRisk: true }
  },
  {
    id: 'auto_bank',
    name: 'Auto-Bank',
    desc: 'Auto-bank at chosen floor',
    icon: '🏦',
    cost: [600],
    maxLevel: 1,
    effect: { autoBank: true }
  },
  {
    id: 'starting_spark',
    name: 'Starting Spark',
    desc: '+50 starting score',
    icon: '⚡',
    cost: [100, 150, 200, 250, 300],
    maxLevel: 5,
    effect: { startingScore: 50 }
  }
];
