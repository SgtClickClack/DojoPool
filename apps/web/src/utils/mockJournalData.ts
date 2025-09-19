import { type JournalEntry, JournalEntryType } from '@/types/journal';

export const generateMockJournalEntries = (
  count: number = 20
): JournalEntry[] => {
  const entryTypes = Object.values(JournalEntryType);
  const mockMessages = [
    'Played an intense match against PoolMaster99',
    'Joined the Spring Championship tournament',
    'Won first place in the Weekly Challenge',
    'Unlocked the "Perfect Break" achievement',
    'Added PoolEnthusiast as a friend',
    'Captured control of The Golden Cue venue',
    'Joined the Elite Pool Masters clan',
    'Checked in at Downtown Pool Hall',
    'Issued a challenge to BreakMaster',
    'Accepted a challenge from CueArtist',
    'Reached skill level 25',
    'Earned 500 Dojo Coins from tournament victory',
    'Acquired the Legendary Pool Cue NFT',
    'System maintenance completed successfully',
  ];

  const entries: JournalEntry[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const randomType =
      entryTypes[Math.floor(Math.random() * entryTypes.length)];
    const randomMessage =
      mockMessages[Math.floor(Math.random() * mockMessages.length)];

    // Create entries with decreasing timestamps (newer first)
    const timestamp = new Date(
      now.getTime() - i * 1000 * 60 * 60 * Math.random() * 24 * 7
    );

    const entry: JournalEntry = {
      id: `mock-journal-${i + 1}`,
      type: randomType,
      message: randomMessage,
      metadata: generateRandomMetadata(randomType),
      createdAt: timestamp.toISOString(),
      userId: 'mock-user-id',
    };

    entries.push(entry);
  }

  // Sort by creation date (newest first)
  return entries.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

const generateRandomMetadata = (
  type: JournalEntryType
): Record<string, any> => {
  switch (type) {
    case JournalEntryType.MATCH_PLAYED:
      return {
        opponent: `Player${Math.floor(Math.random() * 1000)}`,
        venue: 'The Pool Palace',
        score: `${Math.floor(Math.random() * 7) + 1}-${
          Math.floor(Math.random() * 7) + 1
        }`,
        duration: `${Math.floor(Math.random() * 30) + 15} minutes`,
      };

    case JournalEntryType.TOURNAMENT_JOINED:
    case JournalEntryType.TOURNAMENT_WON:
      return {
        tournamentName: 'Spring Championship 2024',
        venue: 'Downtown Pool Hall',
        participants: Math.floor(Math.random() * 50) + 16,
        entryFee: Math.floor(Math.random() * 100) + 50,
      };

    case JournalEntryType.ACHIEVEMENT_UNLOCKED:
      return {
        achievementName: 'Perfect Break',
        points: Math.floor(Math.random() * 100) + 50,
        rarity: 'Rare',
      };

    case JournalEntryType.FRIEND_ADDED:
      return {
        friendUsername: `Friend${Math.floor(Math.random() * 1000)}`,
        mutualFriends: Math.floor(Math.random() * 10),
      };

    case JournalEntryType.TERRITORY_CAPTURED:
      return {
        venueName: 'The Golden Cue',
        previousOwner: `Owner${Math.floor(Math.random() * 1000)}`,
        influence: Math.floor(Math.random() * 100) + 50,
      };

    case JournalEntryType.CLAN_JOINED:
      return {
        clanName: 'Elite Pool Masters',
        memberCount: Math.floor(Math.random() * 100) + 20,
        clanLevel: Math.floor(Math.random() * 10) + 1,
      };

    case JournalEntryType.VENUE_CHECKIN:
      return {
        venueName: 'Downtown Pool Hall',
        location: 'Brisbane, QLD',
        checkinTime: new Date().toISOString(),
      };

    case JournalEntryType.CHALLENGE_ISSUED:
    case JournalEntryType.CHALLENGE_ACCEPTED:
      return {
        challenger: `Challenger${Math.floor(Math.random() * 1000)}`,
        defender: `Defender${Math.floor(Math.random() * 1000)}`,
        venue: 'The Pool Palace',
        wager: Math.floor(Math.random() * 100) + 25,
      };

    case JournalEntryType.SKILL_LEVEL_UP:
      return {
        newLevel: Math.floor(Math.random() * 50) + 25,
        experienceGained: Math.floor(Math.random() * 1000) + 500,
        skillPoints: Math.floor(Math.random() * 5) + 1,
      };

    case JournalEntryType.DOJO_COINS_EARNED:
      return {
        amount: Math.floor(Math.random() * 1000) + 100,
        source: 'Tournament Victory',
        balance: Math.floor(Math.random() * 5000) + 1000,
      };

    case JournalEntryType.NFT_ACQUIRED:
      return {
        nftName: 'Legendary Pool Cue',
        rarity: 'Legendary',
        chain: 'Ethereum',
        tokenId: Math.floor(Math.random() * 10000),
      };

    case JournalEntryType.SYSTEM_EVENT:
      return {
        eventType: 'Maintenance',
        duration: '2 hours',
        status: 'Completed',
      };

    default:
      return {};
  }
};

export const generateMockJournalResponse = (
  page: number = 1,
  limit: number = 20
) => {
  const allEntries = generateMockJournalEntries(100); // Generate 100 total entries
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const entries = allEntries.slice(startIndex, endIndex);

  return {
    entries,
    pagination: {
      page,
      limit,
      total: allEntries.length,
      totalPages: Math.ceil(allEntries.length / limit),
      hasNext: endIndex < allEntries.length,
      hasPrev: page > 1,
    },
  };
};
