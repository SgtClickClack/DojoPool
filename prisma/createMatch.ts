import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user1 = await prisma.user.findUnique({
    where: { email: 'user1@example.com' },
  });
  const user2 = await prisma.user.findUnique({
    where: { email: 'user2@example.com' },
  });

  if (user1 && user2) {
    const match = await prisma.match.create({
      data: {
        playerAId: user1.id,
        playerBId: user2.id,
        winnerId: user1.id,
        scoreA: 5,
        scoreB: 2,
        status: 'COMPLETED',
      },
    });
    console.log('Match created:', match);
  } else {
    console.log('Could not find users to create a match.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
