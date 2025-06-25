import { SponsorshipBracket } from '../../types/sponsorship';

export const sampleSponsorshipBrackets: SponsorshipBracket[] = [
  {
    bracketId: 'kaito-forge-cue',
    sponsorName: "Kaito's Forge Cues",
    sponsorLogo: '/images/sponsors/kaito-forge-logo.png',
    inGameTitle: 'The Path of the Iron Hammer',
    requiredLevel: 15,
    narrativeIntro: `The legend of Kaito's forge echoes through the halls of every dojo. Master craftsman Kaito, whose family has forged cues for generations, seeks a worthy champion to wield his latest creation. The trials ahead will test not just your skill with the cue, but your dedication to the ancient art of precision.

"Only those who understand the weight of perfection may carry the Iron Hammer," speaks the spirit of Kaito from his sacred forge. The path before you is treacherous, but the rewards are beyond measure.`,
    narrativeOutro: `The forge fires dim as Kaito nods in approval. Your mastery has been proven beyond doubt, and you have earned the right to wield the Iron Hammer. This legendary cue, forged with techniques passed down through seven generations, now belongs to you.

"You have honored the way of the forge," Kaito speaks, his voice carrying the wisdom of ages. "May this cue serve you well in all your battles to come."`,
    challenges: [
      {
        challengeId: 'perfect-breaks',
        description: 'Execute 10 perfect break shots that pocket at least 2 balls',
        type: 'game_win',
        requirement: { count: 10 },
        isCompleted: false,
        maxProgress: 10,
      },
      {
        challengeId: 'bank-shot-master',
        description: 'Successfully complete 25 bank shots in competitive matches',
        type: 'trick_shot',
        requirement: { count: 25, difficulty: 'bank' },
        isCompleted: false,
        maxProgress: 25,
      },
      {
        challengeId: 'tournament-victory',
        description: 'Win a ranked tournament at any venue',
        type: 'tournament',
        requirement: { count: 1 },
        isCompleted: false,
        maxProgress: 1,
      },
      {
        challengeId: 'venue-conquest',
        description: 'Capture 5 different pool halls in your territory',
        type: 'venue_capture',
        requirement: { count: 5, venue_type: 'pool_hall' },
        isCompleted: false,
        maxProgress: 5,
      },
      {
        challengeId: 'iron-discipline',
        description: 'Achieve a 15-game winning streak',
        type: 'streak',
        requirement: { streak: 15 },
        isCompleted: false,
        maxProgress: 15,
      },
    ],
    digitalReward: {
      itemName: 'Iron Hammer Cue (Legendary)',
      itemDescription: 'A masterwork cue forged by the legendary Kaito. Provides +15% accuracy on all shots and unlocks special break animations.',
      itemAssetUrl: '/images/rewards/iron-hammer-cue.png',
      type: 'cue',
      value: 150,
      rarity: 'legendary',
    },
    physicalReward: {
      rewardName: 'Custom Kaito Forge Pool Cue',
      rewardDescription: 'A real-world replica of the Iron Hammer cue, handcrafted by Kaito Forge with premium maple wood and custom ferrule.',
      redemptionInstructions: 'Complete all challenges to receive a redemption code. Visit kaito-forge.com/redeem and enter your code along with shipping information. Please allow 4-6 weeks for custom crafting and delivery.',
      estimatedValue: 450,
      isRedeemed: false,
      redemptionDeadline: '2025-12-31',
    },
    isActive: true,
    startDate: '2025-01-30',
    endDate: '2025-06-30',
    maxParticipants: 1000,
    currentParticipants: 247,
    createdAt: '2025-01-30T00:00:00Z',
    updatedAt: '2025-01-30T00:00:00Z',
  },
  {
    bracketId: 'mystic-chalk-academy',
    sponsorName: 'Mystic Chalk Academy',
    sponsorLogo: '/images/sponsors/mystic-chalk-logo.png',
    inGameTitle: 'The Sage\'s Trial of Wisdom',
    requiredLevel: 8,
    narrativeIntro: `Deep within the mystical halls of the Chalk Academy, ancient masters have gathered the sacred knowledge of pool through centuries of study. The Sage, keeper of these secrets, has opened the trial to those who seek not just victory, but true understanding.

"Wisdom comes not from winning alone, but from learning the deeper mysteries of the game," whispers the Sage. This path will challenge your mind as much as your skill.`,
    narrativeOutro: `The Sage emerges from the shadows, a knowing smile upon their weathered face. "You have proven yourself worthy of the academy's teachings. May this knowledge serve you well on your journey to mastery."

The mystical chalk now glows with ancient power, ready to guide your shots with the wisdom of ages.`,
    challenges: [
      {
        challengeId: 'precision-shots',
        description: 'Make 50 shots with 95% or higher accuracy',
        type: 'game_win',
        requirement: { count: 50 },
        isCompleted: false,
        maxProgress: 50,
      },
      {
        challengeId: 'combo-mastery',
        description: 'Execute 15 combination shots in competitive play',
        type: 'trick_shot',
        requirement: { count: 15, difficulty: 'combo' },
        isCompleted: false,
        maxProgress: 15,
      },
      {
        challengeId: 'study-sessions',
        description: 'Complete 10 training sessions at the academy',
        type: 'venue_capture',
        requirement: { count: 10, venue_type: 'training_center' },
        isCompleted: false,
        maxProgress: 10,
      },
    ],
    digitalReward: {
      itemName: 'Sage\'s Wisdom Chalk',
      itemDescription: 'Enchanted chalk that provides +10% shot prediction accuracy and reveals optimal shot angles.',
      itemAssetUrl: '/images/rewards/sage-chalk.png',
      type: 'boost',
      value: 75,
      rarity: 'epic',
    },
    physicalReward: {
      rewardName: 'Mystic Chalk Academy Training Kit',
      rewardDescription: 'Premium chalk set with instructional materials and exclusive academy membership for 6 months.',
      redemptionInstructions: 'Use your redemption code at mystic-chalk.com/academy to claim your training kit and activate your membership.',
      estimatedValue: 180,
      isRedeemed: false,
      redemptionDeadline: '2025-09-30',
    },
    isActive: true,
    startDate: '2025-01-15',
    maxParticipants: 500,
    currentParticipants: 89,
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-30T00:00:00Z',
  },
  {
    bracketId: 'velocity-tables-pro',
    sponsorName: 'Velocity Tables Pro',
    sponsorLogo: '/images/sponsors/velocity-tables-logo.png',
    inGameTitle: 'The Lightning Strike Challenge',
    requiredLevel: 25,
    narrativeIntro: `The thunder rolls across the arena as Velocity Tables Pro announces their ultimate challenge. Known for crafting the fastest, most responsive tables in the professional circuit, they seek only the most elite players for this trial.

"Speed without precision is chaos. Precision without speed is stagnation. Only those who master both shall claim the Lightning Strike," declares the Voice of Velocity.`,
    narrativeOutro: `Lightning crackles across the felt as you sink the final ball. The arena erupts in thunderous applause. You have proven yourself worthy of the Lightning Strike, the fastest cue in existence.

"Welcome to the elite," resonates the Voice of Velocity. "May your shots be swift and true."`,
    challenges: [
      {
        challengeId: 'speed-runs',
        description: 'Complete 20 games in under 10 minutes each',
        type: 'game_win',
        requirement: { count: 20 },
        isCompleted: false,
        maxProgress: 20,
      },
      {
        challengeId: 'lightning-combos',
        description: 'Execute 30 rapid-fire combination shots',
        type: 'trick_shot',
        requirement: { count: 30, difficulty: 'rapid' },
        isCompleted: false,
        maxProgress: 30,
      },
      {
        challengeId: 'pro-level',
        description: 'Reach player level 30',
        type: 'level_reach',
        requirement: { level: 30 },
        isCompleted: false,
        maxProgress: 30,
      },
      {
        challengeId: 'championship-series',
        description: 'Win 3 championship tournaments',
        type: 'tournament',
        requirement: { count: 3, venue_type: 'championship' },
        isCompleted: false,
        maxProgress: 3,
      },
    ],
    digitalReward: {
      itemName: 'Lightning Strike Avatar Title',
      itemDescription: 'Exclusive "Lightning Master" title with animated lightning effects around your avatar.',
      type: 'title',
      rarity: 'legendary',
    },
    physicalReward: {
      rewardName: 'Velocity Pro Tournament Cue',
      rewardDescription: 'Professional-grade cue used in official Velocity Tables tournaments, with custom engraving and certificate of authenticity.',
      redemptionInstructions: 'Redemption requires verification of tournament achievements. Contact tournaments@velocitytables.com with your redemption code.',
      estimatedValue: 850,
      isRedeemed: false,
      redemptionDeadline: '2025-08-31',
    },
    isActive: true,
    startDate: '2025-02-01',
    endDate: '2025-07-31',
    maxParticipants: 100,
    currentParticipants: 23,
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2025-02-01T00:00:00Z',
  },
];

// Helper function to create a new bracket
export const createSampleBracket = (
  bracketId: string,
  sponsorName: string,
  title: string,
  requiredLevel: number,
  customizations?: Partial<SponsorshipBracket>
): SponsorshipBracket => {
  const baseBracket: SponsorshipBracket = {
    bracketId,
    sponsorName,
    inGameTitle: title,
    requiredLevel,
    narrativeIntro: `The ${sponsorName} seeks worthy champions to prove their skill and dedication. Will you answer the call?`,
    narrativeOutro: `Your dedication has been rewarded. The ${sponsorName} recognizes your mastery and grants you their blessing.`,
    challenges: [
      {
        challengeId: 'basic-wins',
        description: 'Win 10 competitive matches',
        type: 'game_win',
        requirement: { count: 10 },
        isCompleted: false,
        maxProgress: 10,
      },
    ],
    digitalReward: {
      itemName: `${sponsorName} Commemorative Item`,
      itemDescription: `A special item commemorating your achievement with ${sponsorName}.`,
      type: 'avatar_item',
      rarity: 'rare',
    },
    physicalReward: {
      rewardName: `${sponsorName} Prize Package`,
      rewardDescription: `A physical prize package from ${sponsorName}.`,
      redemptionInstructions: 'Contact support with your redemption code to claim your prize.',
      isRedeemed: false,
    },
    isActive: true,
    currentParticipants: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...customizations,
  };

  return baseBracket;
};