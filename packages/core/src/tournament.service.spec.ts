import { PrismaClient } from '@prisma/client';
import {
  advanceWinner,
  createTournament,
  generateBrackets,
  getTournamentById,
  registerPlayer,
} from './tournament.service';

const prisma = new PrismaClient();

describe('Tournament Service', () => {
  beforeAll(async () => {
    // Clean the database before running tests
    await prisma.match.deleteMany({});
    await prisma.tournamentParticipant.deleteMany({});
    await prisma.tournament.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create a new tournament', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'organizer@test.com',
        username: 'organizer',
        passwordHash: 'hash',
      },
    });

    const tournament = await createTournament(
      'Test Tournament',
      'venue1',
      user.id,
      'PUBLIC',
      'single_elimination',
      0,
      0,
      16,
      30,
      new Date()
    );
    expect(tournament).toHaveProperty('id');
    expect(tournament.name).toBe('Test Tournament');
  });

  it('should register a player to a tournament', async () => {
    const organizer = await prisma.user.create({
      data: {
        email: 'organizer2@test.com',
        username: 'organizer2',
        passwordHash: 'hash',
      },
    });

    const player = await prisma.user.create({
      data: {
        email: 'player1@test.com',
        username: 'player1',
        passwordHash: 'hash',
      },
    });

    const tournament = await createTournament(
      'Test Tournament 2',
      'venue2',
      organizer.id,
      'PUBLIC',
      'single_elimination',
      0,
      0,
      16,
      30,
      new Date()
    );
    const participant = await registerPlayer(tournament.id, player.id);
    expect(participant).toHaveProperty('id');
    expect(participant.userId).toBe(player.id);
    expect(participant.tournamentId).toBe(tournament.id);

    const updatedTournament = await getTournamentById(tournament.id);
    expect(updatedTournament.participants.length).toBe(1);
  });

  it('should not allow registering more players than maxPlayers', async () => {
    const organizer = await prisma.user.create({
      data: {
        email: 'organizer3@test.com',
        username: 'organizer3',
        passwordHash: 'hash',
      },
    });

    const player1 = await prisma.user.create({
      data: {
        email: 'player2@test.com',
        username: 'player2',
        passwordHash: 'hash',
      },
    });

    const player2 = await prisma.user.create({
      data: {
        email: 'player3@test.com',
        username: 'player3',
        passwordHash: 'hash',
      },
    });

    const tournament = await createTournament(
      'Small Tournament',
      'venue3',
      organizer.id,
      'PUBLIC',
      'single_elimination',
      0,
      0,
      1, // maxPlayers
      30,
      new Date()
    );
    await registerPlayer(tournament.id, player1.id);
    await expect(registerPlayer(tournament.id, player2.id)).rejects.toThrow(
      'Tournament is full'
    );
  });

  it('should generate brackets for a tournament', async () => {
    const organizer = await prisma.user.create({
      data: {
        email: 'organizer4@test.com',
        username: 'organizer4',
        passwordHash: 'hash',
      },
    });

    const tournament = await createTournament(
      'Bracket Tournament',
      'venue4',
      organizer.id,
      'PUBLIC',
      'single_elimination',
      0,
      0,
      8,
      30,
      new Date()
    );

    for (let i = 0; i < 8; i++) {
      const player = await prisma.user.create({
        data: {
          email: `player${i + 4}@test.com`,
          username: `player${i + 4}`,
          passwordHash: 'hash',
        },
      });
      await registerPlayer(tournament.id, player.id);
    }
    const { bracket } = await generateBrackets(tournament.id);
    expect(bracket.length).toBe(4); // 4 matches in the first round
    expect(bracket[0].roundNumber).toBe(1);
  });

  it('should handle byes when generating brackets', async () => {
    const organizer = await prisma.user.create({
      data: {
        email: 'organizer5@test.com',
        username: 'organizer5',
        passwordHash: 'hash',
      },
    });

    const tournament = await createTournament(
      'Bye Tournament',
      'venue5',
      organizer.id,
      'PUBLIC',
      'single_elimination',
      0,
      0,
      6,
      30,
      new Date()
    );
    for (let i = 0; i < 6; i++) {
      const player = await prisma.user.create({
        data: {
          email: `player${i + 12}@test.com`,
          username: `player${i + 12}`,
          passwordHash: 'hash',
        },
      });
      await registerPlayer(tournament.id, player.id);
    }
    const { bracket } = await generateBrackets(tournament.id);
    expect(bracket.length).toBe(4); // Bracket size of 8, so 4 matches
    const byes = bracket.filter((m) => m.status === 'COMPLETED');
    expect(byes.length).toBe(2); // 8 - 6 = 2 byes
  });

  it('should advance the winner to the next round', async () => {
    const organizer = await prisma.user.create({
      data: {
        email: 'organizer6@test.com',
        username: 'organizer6',
        passwordHash: 'hash',
      },
    });

    const tournament = await createTournament(
      'Advancing Tournament',
      'venue6',
      organizer.id,
      'PUBLIC',
      'single_elimination',
      0,
      0,
      4,
      30,
      new Date()
    );
    for (let i = 0; i < 4; i++) {
      const player = await prisma.user.create({
        data: {
          email: `player${i + 18}@test.com`,
          username: `player${i + 18}`,
          passwordHash: 'hash',
        },
      });
      await registerPlayer(tournament.id, player.id);
    }
    const { bracket } = await generateBrackets(tournament.id);
    const match1 = bracket[0];

    const { nextMatch } = await advanceWinner(match1.id, match1.playerAId);
    expect(nextMatch).not.toBeNull();
    expect(nextMatch.roundNumber).toBe(2);
    expect(nextMatch.playerAId).toBe(match1.playerAId);
  });
});
