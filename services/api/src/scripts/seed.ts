import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create test users
  const user1 = await prisma.user.upsert({
    where: { email: 'player1@dojopool.com' },
    update: {},
    create: {
      email: 'player1@dojopool.com',
      username: 'player1',
      passwordHash: 'hashed_password_123',
      role: 'USER',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'player2@dojopool.com' },
    update: {},
    create: {
      email: 'player2@dojopool.com',
      username: 'player2',
      passwordHash: 'hashed_password_123',
      role: 'USER',
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'player3@dojopool.com' },
    update: {},
    create: {
      email: 'player3@dojopool.com',
      username: 'player3',
      passwordHash: 'hashed_password_123',
      role: 'USER',
    },
  });

  const user4 = await prisma.user.upsert({
    where: { email: 'player4@dojopool.com' },
    update: {},
    create: {
      email: 'player4@dojopool.com',
      username: 'player4',
      passwordHash: 'hashed_password_123',
      role: 'USER',
    },
  });

  // Create test venue
  const venue = await prisma.venue.upsert({
    where: { id: 'test-venue-1' },
    update: {},
    create: {
      id: 'test-venue-1',
      name: 'Test Pool Hall',
      description: 'A test venue for development',
      lat: 40.7128,
      lng: -74.006,
      address: '123 Test Street, Test City',
    },
  });

  // Create test tournament
  const tournament = await prisma.tournament.upsert({
    where: { id: 'test-tournament-1' },
    update: {},
    create: {
      id: 'test-tournament-1',
      name: 'Test Tournament',
      startDate: new Date(),
      status: 'REGISTRATION',
      venueId: venue.id,
      maxPlayers: 8,
      entryFee: 25,
    },
  });

  // Register players for tournament
  await prisma.tournamentParticipant.upsert({
    where: {
      tournamentId_userId: {
        tournamentId: tournament.id,
        userId: user1.id,
      },
    },
    update: {},
    create: {
      tournamentId: tournament.id,
      userId: user1.id,
    },
  });

  await prisma.tournamentParticipant.upsert({
    where: {
      tournamentId_userId: {
        tournamentId: tournament.id,
        userId: user2.id,
      },
    },
    update: {},
    create: {
      tournamentId: tournament.id,
      userId: user2.id,
    },
  });

  await prisma.tournamentParticipant.upsert({
    where: {
      tournamentId_userId: {
        tournamentId: tournament.id,
        userId: user3.id,
      },
    },
    update: {},
    create: {
      tournamentId: tournament.id,
      userId: user3.id,
    },
  });

  await prisma.tournamentParticipant.upsert({
    where: {
      tournamentId_userId: {
        tournamentId: tournament.id,
        userId: user4.id,
      },
    },
    update: {},
    create: {
      tournamentId: tournament.id,
      userId: user4.id,
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log(`Created ${tournament.name} with ${4} participants`);
  console.log(`Tournament ID: ${tournament.id}`);
  console.log(`Venue: ${venue.name}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
