import { PrismaClient, TournamentType } from '@prisma/client';

const prisma = new PrismaClient();

export const createTournament = async (
  name: string,
  venueId: string,
  organizerId: string,
  type: TournamentType = 'PUBLIC',
  format: string = 'single_elimination',
  entryFee: number = 0,
  prizePool: number = 0,
  maxPlayers: number = 16,
  checkInPeriodMinutes: number = 30,
  startDate: Date
) => {
  return prisma.tournament.create({
    data: {
      name,
      venueId,
      organizerId,
      type,
      format,
      entryFee,
      prizePool,
      maxPlayers,
      checkInPeriodMinutes,
      startDate,
    },
  });
};

export const registerPlayer = async (tournamentId: string, userId: string) => {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { participants: true },
  });

  if (!tournament) {
    throw new Error('Tournament not found');
  }
  if (tournament.participants.length >= tournament.maxPlayers) {
    throw new Error('Tournament is full');
  }

  return prisma.tournamentParticipant.create({
    data: {
      tournamentId,
      userId,
    },
  });
};

export const generateBrackets = async (tournamentId: string) => {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { participants: true },
  });

  if (!tournament) {
    throw new Error('Tournament not found');
  }

  const participants = [...tournament.participants];
  participants.sort(() => Math.random() - 0.5);

  const numPlayers = participants.length;
  if (numPlayers < 2) {
    throw new Error('Not enough players to generate brackets');
  }

  const rounds = Math.ceil(Math.log2(numPlayers));
  const bracketSize = Math.pow(2, rounds);
  const byes = bracketSize - numPlayers;

  const matchesToCreate = [];
  let playerIndex = 0;

  for (let i = 0; i < bracketSize / 2; i++) {
    const matchData: any = {
      tournamentId,
      roundNumber: 1,
      matchInRound: i + 1,
      playerAId: null,
      playerBId: null,
      winnerId: null,
      status: 'SCHEDULED',
    };

    if (i < byes) {
      matchData.playerAId = participants[playerIndex].userId;
      matchData.winnerId = participants[playerIndex].userId;
      matchData.status = 'COMPLETED';
      playerIndex++;
    } else {
      matchData.playerAId = participants[playerIndex].userId;
      playerIndex++;
      if (playerIndex < participants.length) {
        matchData.playerBId = participants[playerIndex].userId;
        playerIndex++;
      }
    }
    matchesToCreate.push(prisma.match.create({ data: matchData }));
  }

  const createdMatches = await prisma.$transaction(matchesToCreate);

  return { bracket: createdMatches, tournament };
};

export const advanceWinner = async (matchId: string, winnerId: string) => {
  const match = await prisma.match.update({
    where: { id: matchId },
    data: { winnerId, status: 'COMPLETED' },
  });

  if (!match.tournamentId) {
    return { match, nextMatch: null };
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: match.tournamentId },
    include: { participants: true, matches: true },
  });

  if (!tournament) {
    throw new Error('Tournament not found for this match');
  }

  const currentRound = match.roundNumber;
  const nextRound = currentRound + 1;
  const matchNumberInRound = match.matchInRound;

  const nextMatchNumber = Math.ceil(matchNumberInRound / 2);

  let nextMatch = tournament.matches.find(
    (m) => m.roundNumber === nextRound && m.matchInRound === nextMatchNumber
  );

  if (!nextMatch) {
    if (nextRound > Math.ceil(Math.log2(tournament.participants.length))) {
      await prisma.tournament.update({
        where: { id: tournament.id },
        data: { status: 'COMPLETED' },
      });
      return { match, nextMatch: null };
    }
    nextMatch = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        roundNumber: nextRound,
        matchInRound: nextMatchNumber,
        status: 'SCHEDULED',
      },
    });
  }

  const updateData: any = {};
  if (matchNumberInRound % 2 !== 0) {
    updateData.playerAId = winnerId;
  } else {
    updateData.playerBId = winnerId;
  }

  const updatedNextMatch = await prisma.match.update({
    where: { id: nextMatch.id },
    data: updateData,
  });

  return { match, nextMatch: updatedNextMatch };
};

export const getTournamentById = async (tournamentId: string) => {
  return prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { participants: true, matches: true },
  });
};
