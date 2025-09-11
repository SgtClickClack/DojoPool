import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create sample users
  const user1 = await prisma.user.create({
    data: {
      email: 'user1@example.com',
      username: 'user1',
      passwordHash: 'password',
      profile: {
        create: {
          skillRating: 1200,
        },
      },
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'user2@example.com',
      username: 'user2',
      passwordHash: 'password',
      profile: {
        create: {
          skillRating: 1250,
        },
      },
    },
  });

  // Create a territory
  const territory = await prisma.territory.create({
    data: {
      name: 'Test Territory',
      latitude: 0,
      longitude: 0,
    },
  });

  console.log(`Territory created: ${territory.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
