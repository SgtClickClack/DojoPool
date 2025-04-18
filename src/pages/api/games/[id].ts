import { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../../firebase/admin";
import { withAuth } from "../../../middleware/withAuth";
import { QueryDocumentSnapshot, DocumentData } from "firebase-admin/firestore";

interface Shot {
  playerId: string;
  type: "pot" | "miss" | "foul";
  ballNumber?: number;
  timestamp: number;
  position?: {
    x: number;
    y: number;
  };
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  timestamp?: number;
}

interface GameData {
  player1Id: string;
  player2Id: string;
  shots: Shot[];
  status: "active" | "completed";
  startTime: number;
  endTime?: number;
  comments?: Comment[];
  achievements?: Achievement[];
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.query;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Invalid game ID" });
    }

    // Fetch game data from Firestore
    const gameDoc = await db.collection("games").doc(id).get();
    if (!gameDoc.exists) {
      return res.status(404).json({ error: "Game not found" });
    }

    const gameData = gameDoc.data() as GameData;
    if (!gameData) {
      return res.status(404).json({ error: "Game data not found" });
    }

    // Fetch player data
    const [player1Doc, player2Doc] = await Promise.all([
      db.collection("users").doc(gameData.player1Id).get(),
      db.collection("users").doc(gameData.player2Id).get(),
    ]);

    if (!player1Doc.exists || !player2Doc.exists) {
      return res.status(404).json({ error: "Player data not found" });
    }

    const player1Data = player1Doc.data();
    const player2Data = player2Doc.data();

    // Fetch comments
    const commentsSnapshot = await db
      .collection("games")
      .doc(id)
      .collection("comments")
      .get();
    const comments = commentsSnapshot.docs.map(
      (doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data(),
      }),
    ) as Comment[];

    // Calculate player scores and statistics
    const shots = gameData.shots || [];
    const player1Shots = shots.filter(
      (shot) => shot.playerId === gameData.player1Id,
    );
    const player2Shots = shots.filter(
      (shot) => shot.playerId === gameData.player2Id,
    );

    const calculatePlayerScore = (playerShots: Shot[]): number => {
      return playerShots.reduce((score, shot) => {
        switch (shot.type) {
          case "pot":
            return score + (shot.ballNumber === 8 ? 8 : 1);
          case "foul":
            return score - 4;
          default:
            return score;
        }
      }, 0);
    };

    const player1Score = calculatePlayerScore(player1Shots);
    const player2Score = calculatePlayerScore(player2Shots);

    // Calculate advanced statistics
    const calculateAdvancedStats = (playerShots: Shot[]) => {
      const successfulShots = playerShots.filter((shot) => shot.type === "pot");
      const fouls = playerShots.filter((shot) => shot.type === "foul");
      const misses = playerShots.filter((shot) => shot.type === "miss");

      // Calculate shot accuracy by ball
      const shotAccuracyByBall = playerShots.reduce(
        (acc, shot) => {
          if (!shot.ballNumber) return acc;
          if (!acc[shot.ballNumber]) {
            acc[shot.ballNumber] = { total: 0, successful: 0 };
          }
          acc[shot.ballNumber].total++;
          if (shot.type === "pot") acc[shot.ballNumber].successful++;
          return acc;
        },
        {} as Record<number, { total: number; successful: number }>,
      );

      // Calculate shot accuracy by position
      const shotAccuracyByPosition = playerShots.reduce(
        (acc, shot) => {
          if (!shot.position) return acc;
          const key = `${shot.position.x},${shot.position.y}`;
          if (!acc[key]) {
            acc[key] = { total: 0, successful: 0 };
          }
          acc[key].total++;
          if (shot.type === "pot") acc[key].successful++;
          return acc;
        },
        {} as Record<string, { total: number; successful: number }>,
      );

      // Calculate average shot time by ball
      const averageShotTimeByBall = playerShots.reduce(
        (acc, shot, index) => {
          if (!shot.ballNumber || index === 0) return acc;
          const timeDiff = shot.timestamp - playerShots[index - 1].timestamp;
          if (!acc[shot.ballNumber]) {
            acc[shot.ballNumber] = { total: 0, count: 0 };
          }
          acc[shot.ballNumber].total += timeDiff;
          acc[shot.ballNumber].count++;
          return acc;
        },
        {} as Record<number, { total: number; count: number }>,
      );

      // Calculate break statistics
      let currentBreak = 0;
      let highestBreak = 0;
      let totalBreaks = 0;
      let breakCount = 0;

      playerShots.forEach((shot) => {
        if (shot.type === "pot") {
          currentBreak++;
          highestBreak = Math.max(highestBreak, currentBreak);
        } else {
          if (currentBreak > 0) {
            totalBreaks += currentBreak;
            breakCount++;
          }
          currentBreak = 0;
        }
      });

      // Calculate play style percentages
      const totalShots = playerShots.length;
      const safetyPlayPercentage = (fouls.length / totalShots) * 100;
      const offensivePlayPercentage =
        (successfulShots.length / totalShots) * 100;
      const defensivePlayPercentage = (misses.length / totalShots) * 100;

      return {
        shotAccuracyByBall,
        shotAccuracyByPosition,
        averageShotTimeByBall: Object.entries(averageShotTimeByBall).reduce(
          (acc, [ball, data]) => {
            acc[Number(ball)] = data.total / data.count;
            return acc;
          },
          {} as Record<number, number>,
        ),
        breakAndRun: highestBreak === totalShots ? 1 : 0,
        highestBreak,
        averageBreak: breakCount > 0 ? totalBreaks / breakCount : 0,
        safetyPlayPercentage,
        offensivePlayPercentage,
        defensivePlayPercentage,
      };
    };

    const player1AdvancedStats = calculateAdvancedStats(player1Shots);
    const player2AdvancedStats = calculateAdvancedStats(player2Shots);

    // Determine winner if game is completed
    let winner = null;
    if (gameData.status === "completed") {
      if (player1Score > player2Score) {
        winner = {
          id: gameData.player1Id,
          name: player1Data?.displayName || "Unknown Player",
        };
      } else if (player2Score > player1Score) {
        winner = {
          id: gameData.player2Id,
          name: player2Data?.displayName || "Unknown Player",
        };
      }
    }

    // Calculate achievements
    const achievements: Achievement[] = [
      {
        id: "break-and-run",
        title: "Break and Run",
        description: "Complete the game without opponent's turn",
        icon: "FiAward",
        unlocked:
          player1AdvancedStats.breakAndRun === 1 ||
          player2AdvancedStats.breakAndRun === 1,
        timestamp: gameData.endTime,
      },
      {
        id: "high-break",
        title: "High Break",
        description: "Achieve a break of 5 or more shots",
        icon: "FiTrendingUp",
        unlocked:
          player1AdvancedStats.highestBreak >= 5 ||
          player2AdvancedStats.highestBreak >= 5,
        timestamp: gameData.endTime,
      },
      {
        id: "perfect-game",
        title: "Perfect Game",
        description: "Win without any fouls",
        icon: "FiAward",
        unlocked:
          (player1Score > player2Score &&
            player1Shots.filter((s) => s.type === "foul").length === 0) ||
          (player2Score > player1Score &&
            player2Shots.filter((s) => s.type === "foul").length === 0),
        timestamp: gameData.endTime,
      },
    ];

    // Format response
    const response = {
      id: gameDoc.id,
      player1: {
        id: gameData.player1Id,
        name: player1Data?.displayName || "Unknown Player",
        score: player1Score,
        advancedStats: player1AdvancedStats,
      },
      player2: {
        id: gameData.player2Id,
        name: player2Data?.displayName || "Unknown Player",
        score: player2Score,
        advancedStats: player2AdvancedStats,
      },
      shots,
      status: gameData.status || "active",
      startTime: gameData.startTime || Date.now(),
      endTime: gameData.endTime,
      duration: gameData.endTime ? gameData.endTime - gameData.startTime : null,
      winner,
      comments,
      achievements,
      statistics: {
        totalShots: shots.length,
        player1Shots: player1Shots.length,
        player2Shots: player2Shots.length,
        averageShotTime:
          shots.length > 1
            ? (shots[shots.length - 1].timestamp - shots[0].timestamp) /
              (shots.length - 1)
            : 0,
        shotsPerMinute:
          shots.length > 0
            ? (shots.length /
                ((gameData.endTime || Date.now()) - gameData.startTime)) *
              60000
            : 0,
      },
    };

    return res.status(200).json(response);
  } catch (error: any) {
    console.error("Error fetching game data:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default withAuth(handler);
