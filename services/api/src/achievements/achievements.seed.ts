import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultAchievements = [
  {
    key: 'FIRST_WIN',
    name: 'First Victory',
    desc: 'Win your first match',
    points: 10,
  },
  {
    key: 'WIN_STREAK_3',
    name: 'Hot Streak',
    desc: 'Win 3 matches in a row',
    points: 25,
  },
  {
    key: 'WIN_STREAK_5',
    name: 'On Fire',
    desc: 'Win 5 matches in a row',
    points: 50,
  },
  {
    key: 'WIN_STREAK_10',
    name: 'Unstoppable',
    desc: 'Win 10 matches in a row',
    points: 100,
  },
  {
    key: 'TOTAL_WINS_10',
    name: 'Decade Master',
    desc: 'Win 10 total matches',
    points: 75,
  },
  {
    key: 'TOTAL_WINS_50',
    name: 'Century Club',
    desc: 'Win 50 total matches',
    points: 200,
  },
  {
    key: 'TOTAL_WINS_100',
    name: 'Century Master',
    desc: 'Win 100 total matches',
    points: 500,
  },
  {
    key: 'TOURNAMENT_WINNER',
    name: 'Tournament Champion',
    desc: 'Win your first tournament',
    points: 150,
  },
  {
    key: 'TOURNAMENT_CHAMPION',
    name: 'Tournament Legend',
    desc: 'Win 5 tournaments',
    points: 750,
  },
  {
    key: 'TERRITORY_CONTROLLER',
    name: 'Territory Controller',
    desc: 'Control your first territory',
    points: 100,
  },
  {
    key: 'TERRITORY_MASTER',
    name: 'Territory Master',
    desc: 'Control 5 territories',
    points: 400,
  },
];

async function seedAchievements() {
  try {
    console.log('Seeding achievements...');

    for (const achievement of defaultAchievements) {
      await prisma.achievement.upsert({
        where: { key: achievement.key },
        update: achievement,
        create: achievement,
      });
    }

    console.log('Achievements seeded successfully!');
  } catch (error) {
    console.error('Error seeding achievements:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedAchievements();
