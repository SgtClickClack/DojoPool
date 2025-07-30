import { PrismaClient } from './.config/database/generated/prisma/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function createTestData() {
  try {
    console.log('🚀 Creating test data for Territory Claim feature...');

    // Create test users
    const user1 = await prisma.user.create({
      data: {
        id: 'test-user-1',
        email: 'leader1@test.com',
        password: 'hashedpassword1',
        role: 'user',
      }
    });

    const user2 = await prisma.user.create({
      data: {
        id: 'test-user-2',
        email: 'leader2@test.com',
        password: 'hashedpassword2',
        role: 'user',
      }
    });

    console.log('✅ Created test users');

    // Create test clans
    const clan1 = await prisma.clan.create({
      data: {
        id: 'test-clan-1',
        name: 'Dragon Warriors',
        tag: 'DW',
        description: 'Elite pool players from the east',
        leaderId: user1.id,
        memberCount: 5,
        totalWins: 10,
        totalLosses: 3,
        territoryCount: 2,
      }
    });

    const clan2 = await prisma.clan.create({
      data: {
        id: 'test-clan-2',
        name: 'Thunder Sharks',
        tag: 'TS',
        description: 'Fierce competitors from the west',
        leaderId: user2.id,
        memberCount: 4,
        totalWins: 8,
        totalLosses: 5,
        territoryCount: 1,
      }
    });

    console.log('✅ Created test clans');

    // Create clan members
    await prisma.clanMember.create({
      data: {
        userId: user1.id,
        clanId: clan1.id,
        role: 'leader',
        contribution: 100,
        territoryCount: 2,
        matchWins: 15,
      }
    });

    await prisma.clanMember.create({
      data: {
        userId: user2.id,
        clanId: clan2.id,
        role: 'leader',
        contribution: 80,
        territoryCount: 1,
        matchWins: 12,
      }
    });

    console.log('✅ Created clan memberships');

    // Create a contested territory (Dojo)
    const territory = await prisma.territory.create({
      data: {
        id: 'test-territory-1',
        name: 'Downtown Pool Hall',
        description: 'A prestigious pool hall in the city center',
        coordinates: JSON.stringify([{lat: 40.7128, lng: -74.0060}]),
        requiredNFT: 'downtown-pool-nft',
        influence: 100,
        status: 'verified',
        controllingClanId: null, // No current owner - contested
      }
    });

    console.log('✅ Created contested territory');

    // Create a completed clan war where clan1 (Dragon Warriors) won
    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 2); // War ended 2 hours ago

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // War started 7 days ago

    const clanWar = await prisma.clanWar.create({
      data: {
        id: 'test-war-1',
        name: 'Battle for Downtown',
        description: 'Epic battle for control of the Downtown Pool Hall',
        startDate: startDate,
        endDate: pastDate,
        status: 'active', // Still active, ready to be claimed
        clan1Id: clan1.id,
        clan1Score: 15, // Dragon Warriors won with higher score
        clan2Id: clan2.id,
        clan2Score: 12, // Thunder Sharks lost
        territoryId: territory.id,
        rewards: JSON.stringify({
          winner: 1000,
          loser: 500
        }),
        matches: JSON.stringify([
          {
            id: 'match-1',
            player1Id: user1.id,
            player1Name: 'Leader1',
            player1ClanId: clan1.id,
            player2Id: user2.id,
            player2Name: 'Leader2',
            player2ClanId: clan2.id,
            winnerId: user1.id,
            score: '8-6',
            territory: 'Downtown Pool Hall',
            timestamp: new Date(Date.now() - 3600000) // 1 hour ago
          }
        ])
      }
    });

    console.log('✅ Created completed clan war');

    console.log('\n🎯 Test Data Summary:');
    console.log(`👤 User 1 (Clan Leader): ${user1.id} - ${user1.email}`);
    console.log(`👤 User 2 (Clan Leader): ${user2.id} - ${user2.email}`);
    console.log(`🏰 Winning Clan: ${clan1.name} (${clan1.tag}) - Score: ${clanWar.clan1Score}`);
    console.log(`🏰 Losing Clan: ${clan2.name} (${clan2.tag}) - Score: ${clanWar.clan2Score}`);
    console.log(`🏛️ Contested Territory: ${territory.name}`);
    console.log(`⚔️ Clan War: ${clanWar.name} (ID: ${clanWar.id})`);
    console.log(`📅 War Status: ${clanWar.status} (ended ${pastDate.toLocaleString()})`);
    
    console.log('\n🧪 Testing Instructions:');
    console.log('1. Start the application');
    console.log(`2. Log in as: ${user1.email} (winning clan leader)`);
    console.log(`3. Navigate to: /clan-wars/${clanWar.id}`);
    console.log('4. Look for the "Claim Territory" button');
    console.log('5. Click the button to test the API call');
    console.log('6. Verify success message and redirect to World Hub');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();