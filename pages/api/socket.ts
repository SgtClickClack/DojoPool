import { Server } from 'socket.io';
import { NextApiRequest } from 'next';
import { prisma } from '../../lib/prisma';
import { getSession } from 'next-auth/react';

interface Shot {
  gameId: string;
  playerId: string;
  type: 'break' | 'pot' | 'foul' | 'safety';
  points: number;
}

const SocketHandler = async (req: NextApiRequest, res: any) => {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.io server...');
    const io = new Server(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
    });

    io.on('connection', async (socket) => {
      console.log('Client connected:', socket.id);

      // Get game ID from query parameters
      const gameId = socket.handshake.query.gameId as string;
      if (!gameId) {
        socket.disconnect();
        return;
      }

      // Join game room
      socket.join(`game:${gameId}`);

      // Handle shot recording
      socket.on('recordShot', async (shot: Shot) => {
        try {
          // Verify game and player
          const game = await prisma.game.findUnique({
            where: { id: shot.gameId },
            select: {
              status: true,
              current_player_id: true,
              current_frame: true,
            },
          });

          if (!game || game.status !== 'in_progress') {
            socket.emit('error', 'Invalid game state');
            return;
          }

          if (game.current_player_id !== shot.playerId) {
            socket.emit('error', 'Not your turn');
            return;
          }

          // Record the shot
          const newShot = await prisma.shot.create({
            data: {
              game_id: shot.gameId,
              player_id: shot.playerId,
              type: shot.type,
              points: shot.points,
              timestamp: new Date(),
            },
          });

          // Update frame score
          const frame = await prisma.frame.findFirst({
            where: {
              game_id: shot.gameId,
              frame_number: game.current_frame,
            },
          });

          if (frame) {
            await prisma.frame.update({
              where: { id: frame.id },
              data: {
                player1_score:
                  shot.playerId === frame.player1_id
                    ? { increment: shot.points }
                    : undefined,
                player2_score:
                  shot.playerId === frame.player2_id
                    ? { increment: shot.points }
                    : undefined,
              },
            });
          }

          // Switch turns if it's not a continuation shot
          if (shot.type === 'foul' || shot.type === 'safety') {
            const updatedGame = await prisma.game.findUnique({
              where: { id: shot.gameId },
              select: {
                player1_id: true,
                player2_id: true,
                current_player_id: true,
              },
            });

            if (updatedGame) {
              await prisma.game.update({
                where: { id: shot.gameId },
                data: {
                  current_player_id:
                    updatedGame.current_player_id === updatedGame.player1_id
                      ? updatedGame.player2_id
                      : updatedGame.player1_id,
                },
              });
            }
          }

          // Emit shot recorded event
          io.to(`game:${gameId}`).emit('shotRecorded', newShot);

          // Fetch and emit updated game state
          const updatedGame = await prisma.game.findUnique({
            where: { id: shot.gameId },
            include: {
              player1: {
                select: {
                  id: true,
                  username: true,
                  rating: true,
                },
              },
              player2: {
                select: {
                  id: true,
                  username: true,
                  rating: true,
                },
              },
              frames: {
                where: { frame_number: game.current_frame },
                select: {
                  player1_score: true,
                  player2_score: true,
                },
              },
            },
          });

          if (updatedGame) {
            io.to(`game:${gameId}`).emit('gameUpdate', updatedGame);
          }
        } catch (error) {
          console.error('Error recording shot:', error);
          socket.emit('error', 'Failed to record shot');
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        socket.leave(`game:${gameId}`);
      });
    });

    res.socket.server.io = io;
  }

  res.end();
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default SocketHandler; 