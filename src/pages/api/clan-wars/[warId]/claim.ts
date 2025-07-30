import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '../../../../../.config/database/generated/prisma';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { warId } = req.query;

    if (!warId || typeof warId !== 'string') {
      return res.status(400).json({ error: 'Invalid war ID' });
    }

    // TODO: Add authentication middleware to get authenticated user
    // For now, we'll expect userId to be passed in the request body
    const { userId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Fetch the ClanWar details from the database
    const clanWar = await prisma.clanWar.findUnique({
      where: { id: warId },
      include: {
        clan1: {
          include: {
            leader: true
          }
        },
        clan2: {
          include: {
            leader: true
          }
        },
        territory: true
      }
    });

    if (!clanWar) {
      return res.status(404).json({ error: 'Clan war not found' });
    }

    // Validation: Confirm the war's status is Active and the end time has passed
    if (clanWar.status !== 'active') {
      return res.status(400).json({ error: 'War is not active' });
    }

    const currentTime = new Date();
    if (currentTime < clanWar.endDate) {
      return res.status(400).json({ error: 'War is not over yet' });
    }

    // Determine the winning clan based on the score
    let winningClan;
    let winningClanId;

    if (clanWar.clan1Score > clanWar.clan2Score) {
      winningClan = clanWar.clan1;
      winningClanId = clanWar.clan1Id;
    } else if (clanWar.clan2Score > clanWar.clan1Score) {
      winningClan = clanWar.clan2;
      winningClanId = clanWar.clan2Id;
    } else {
      return res.status(400).json({ error: 'War ended in a tie, no territory can be claimed' });
    }

    // Verify that the user making the request is the leader of the winning clan
    if (winningClan.leaderId !== userId) {
      return res.status(403).json({ error: 'Only the winning clan leader can claim territory' });
    }

    // Perform database updates in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the ClanWar status to Completed and set winner
      const updatedWar = await tx.clanWar.update({
        where: { id: warId },
        data: {
          status: 'completed',
          winnerId: winningClanId
        }
      });

      // Update the Territory (Dojo) to set the controlling clan
      let updatedTerritory = null;
      if (clanWar.territoryId) {
        updatedTerritory = await tx.territory.update({
          where: { id: clanWar.territoryId },
          data: {
            controllingClanId: winningClanId
          }
        });
      }

      // Update clan statistics
      await tx.clan.update({
        where: { id: winningClanId },
        data: {
          totalWins: { increment: 1 },
          territoryCount: clanWar.territoryId ? { increment: 1 } : undefined
        }
      });

      // Update losing clan statistics
      const losingClanId = winningClanId === clanWar.clan1Id ? clanWar.clan2Id : clanWar.clan1Id;
      await tx.clan.update({
        where: { id: losingClanId },
        data: {
          totalLosses: { increment: 1 }
        }
      });

      return { updatedWar, updatedTerritory };
    });

    return res.status(200).json({
      success: true,
      message: 'Territory claimed successfully',
      data: {
        war: result.updatedWar,
        territory: result.updatedTerritory,
        winningClan: {
          id: winningClan.id,
          name: winningClan.name,
          tag: winningClan.tag
        }
      }
    });

  } catch (error) {
    console.error('Error claiming territory:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  } finally {
    await prisma.$disconnect();
  }
}