// Floor tier configurations
export const FLOOR_TIERS = [
  {
    name: 'Novice',
    minFloor: 1,
    maxFloor: 10,
    flatRewardMin: 30,
    flatRewardMax: 100,
    multiplyMin: 1.5,
    multiplyMax: 2.0,
    riskAMin: 5,
    riskAMax: 12,
    riskBMin: 10,
    riskBMax: 18,
    stabilityRewardMin: 100,
    stabilityRewardMax: 200,
    bgColor: 0x050515,
    accentColor: 0x00FFFF
  },
  {
    name: 'Challenger',
    minFloor: 11,
    maxFloor: 30,
    flatRewardMin: 100,
    flatRewardMax: 400,
    multiplyMin: 2.0,
    multiplyMax: 3.0,
    riskAMin: 15,
    riskAMax: 22,
    riskBMin: 20,
    riskBMax: 28,
    stabilityRewardMin: 200,
    stabilityRewardMax: 400,
    bgColor: 0x050520,
    accentColor: 0x8800FF
  },
  {
    name: 'Veteran',
    minFloor: 31,
    maxFloor: 50,
    flatRewardMin: 400,
    flatRewardMax: 1200,
    multiplyMin: 2.5,
    multiplyMax: 3.5,
    riskAMin: 22,
    riskAMax: 32,
    riskBMin: 28,
    riskBMax: 38,
    stabilityRewardMin: 400,
    stabilityRewardMax: 700,
    bgColor: 0x100510,
    accentColor: 0xFF00FF
  },
  {
    name: 'Spiral',
    minFloor: 51,
    maxFloor: 75,
    flatRewardMin: 1200,
    flatRewardMax: 5000,
    multiplyMin: 3.0,
    multiplyMax: 5.0,
    riskAMin: 32,
    riskAMax: 45,
    riskBMin: 38,
    riskBMax: 52,
    stabilityRewardMin: 700,
    stabilityRewardMax: 1200,
    bgColor: 0x150500,
    accentColor: 0xFF4400
  },
  {
    name: 'Apex',
    minFloor: 76,
    maxFloor: Infinity,
    flatRewardMin: 5000,
    flatRewardMax: 20000,
    multiplyMin: 4.0,
    multiplyMax: 6.0,
    riskAMin: 42,
    riskAMax: 55,
    riskBMin: 50,
    riskBMax: 60,
    stabilityRewardMin: 1200,
    stabilityRewardMax: 2500,
    bgColor: 0x150010,
    accentColor: 0xFF0055
  }
];

export const SPECIAL_EVENTS = {
  chaos: {
    id: 'chaos',
    name: 'CHAOS FLOOR',
    desc: '3 doors — the center path has ultimate reward and maximum risk.',
    color: 0xFF2200,
    doorCount: 3
  },
  double: {
    id: 'double',
    name: 'DOUBLE OR NOTHING',
    desc: 'All rewards are doubled this floor.',
    color: 0xFFAA00,
    doorCount: 2
  },
  mystery: {
    id: 'mystery',
    name: 'MYSTERY DOOR',
    desc: 'Risk % is hidden until you choose.',
    color: 0x8800FF,
    doorCount: 2
  },
  shield: {
    id: 'shield',
    name: 'SAFE PASSAGE',
    desc: 'No risk — claim a free shield.',
    color: 0x00FF88,
    doorCount: 1
  },
  fortune: {
    id: 'fortune',
    name: 'FORTUNE FLIP',
    desc: 'Flip a coin: win doubles your score, lose costs nothing.',
    color: 0xFFCC00,
    doorCount: 1
  }
};

export const MISSION_POOL = [
  { id: 'reach_15', desc: 'Reach Floor 15', target: 15, type: 'floor', reward: 75 },
  { id: 'bank_500', desc: 'Bank 500 score', target: 500, type: 'bank', reward: 50 },
  { id: 'use_fortune', desc: 'Trigger Fortune Flip', target: 1, type: 'event', reward: 100 },
  { id: 'survive_3risky', desc: 'Survive 3 doors with 30%+ risk', target: 3, type: 'risky', reward: 125 },
  { id: 'reach_25', desc: 'Reach Floor 25', target: 25, type: 'floor', reward: 150 },
  { id: 'no_shield', desc: 'Reach Floor 10 without shield', target: 10, type: 'floor_noshield', reward: 100 }
];

export const ACHIEVEMENTS = [
  { id: 'floor_10', name: 'Tower Walker', desc: 'Reach floor 10', condition: { type: 'floor', value: 10 }, badgeColor: 0xAAAAAA },
  { id: 'floor_25', name: 'Risk Taker', desc: 'Reach floor 25', condition: { type: 'floor', value: 25 }, badgeColor: 0xFFAA00 },
  { id: 'floor_50', name: 'Spiral Master', desc: 'Reach floor 50', condition: { type: 'floor', value: 50 }, badgeColor: 0x00FFFF },
  { id: 'floor_100', name: 'Elite Climber', desc: 'Reach floor 100', condition: { type: 'floor', value: 100 }, badgeColor: 0xFF00FF },
  { id: 'bank_1000', name: 'Banker', desc: 'Bank 1000 in one run', condition: { type: 'bank', value: 1000 }, badgeColor: 0xFFAA00 },
  { id: 'survive_risky', name: 'Daredevil', desc: 'Survive 5 doors over 40% risk', condition: { type: 'risky', value: 5 }, badgeColor: 0xFF0000 }
];

export function getTierForFloor(floor) {
  return FLOOR_TIERS.find(t => floor >= t.minFloor && floor <= t.maxFloor) || FLOOR_TIERS[FLOOR_TIERS.length - 1];
}
