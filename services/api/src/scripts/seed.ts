import { PrismaClient } from '@dojopool/prisma';

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
      password: 'hashed_password_123',
      role: 'USER',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'player2@dojopool.com' },
    update: {},
    create: {
      email: 'player2@dojopool.com',
      username: 'player2',
      password: 'hashed_password_123',
      role: 'USER',
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'player3@dojopool.com' },
    update: {},
    create: {
      email: 'player3@dojopool.com',
      username: 'player3',
      password: 'hashed_password_123',
      role: 'USER',
    },
  });

  const user4 = await prisma.user.upsert({
    where: { email: 'player4@dojopool.com' },
    update: {},
    create: {
      email: 'player4@dojopool.com',
      username: 'player4',
      password: 'hashed_password_123',
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
      latitude: 40.7128,
      longitude: -74.006,
      lat: 40.7128,
      lng: -74.006,
      address: '123 Test Street, Test City',
      ownerId: user1.id,
    },
  });

  // Create test tournament
  const tournament = await prisma.tournament.upsert({
    where: { id: 'test-tournament-1' },
    update: {},
    create: {
      id: 'test-tournament-1',
      name: 'Test Tournament',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      startDate: new Date(),
      status: 'REGISTRATION_OPEN',
      venueId: venue.id,
      organizerId: user1.id,
    },
  });

  // Register players for tournament
  await prisma.tournamentParticipant.upsert({
    where: {
      tournamentId_userId: {
        tournamentId: tournament.id,
        userId: user1.id,
      },
    } as any, // Type workaround for compound unique constraint
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
    } as any, // Type workaround for compound unique constraint
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
    } as any, // Type workaround for compound unique constraint
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
    } as any, // Type workaround for compound unique constraint
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
