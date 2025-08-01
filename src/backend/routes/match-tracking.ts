import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { logger } from '../../config/monitoring.js';
import { challenges } from '../../services/challengeStorage.js';

const router = express.Router();

// In-memory storage for match tracking (in production, this would be in a database)
const activeMatches = new Map();
const matchResults = new Map();
const matchAnalytics = new Map();

// WebSocket event handlers (these would be connected to your WebSocket server)
const emitMatchUpdate = (matchId: string, data: any) => {
  // In a real implementation, this would emit to connected WebSocket clients
  logger.info(`Match update for ${matchId}:`, data);
};

const emitShotRecorded = (matchId: string, shotData: any) => {
  logger.info(`Shot recorded for ${matchId}:`, shotData);
};

const emitFoulDetected = (matchId: string, foulData: any) => {
  logger.info(`Foul detected for ${matchId}:`, foulData);
};

/**
 * Start match tracking for an accepted challenge
 */
router.post('/match/start', async (req: express.Request, res: express.Response) => {
  try {
    const { challengeId } = req.body;
    
    if (!challengeId) {
      return res.status(400).json({
        success: false,
        error: 'Challenge ID is required'
      });
    }

    // Check if challenge exists and is accepted
    if (!challenges.has(challengeId)) {
      return res.status(404).json({
        success: false,
        error: 'Challenge not found'
      });
    }

    const challenge = challenges.get(challengeId);
    if (challenge.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        error: 'Challenge must be accepted before starting match tracking'
      });
    }

    // Check if match is already active for this challenge
    const existingMatch = Array.from(activeMatches.values()).find(
      (match: any) => match.challengeId === challengeId
    );

    if (existingMatch) {
      return res.status(409).json({
        success: false,
        error: 'Match already active for this challenge',
        matchId: existingMatch.id
      });
    }

    const matchData = {
      id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      challengeId,
      player1Id: challenge.challengerId,
      player2Id: challenge.defenderId,
      dojoId: challenge.dojoId,
      startTime: new Date(),
      status: 'preparing',
      score: { player1: 0, player2: 0 },
      events: []
    };

    activeMatches.set(matchData.id, matchData);

    logger.info(`Match tracking started: ${matchData.id} for challenge ${challengeId}`);

    // Emit match start event
    emitMatchUpdate(matchData.id, { type: 'match_started', matchData });

    res.status(201).json({
      success: true,
      data: matchData
    });

  } catch (error) {
    logger.error('Error starting match tracking:', error instanceof Error ? error : undefined);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Activate match (start the actual game)
 */
router.post('/match/:matchId/activate', async (req: express.Request, res: express.Response) => {
  try {
    const { matchId } = req.params;
    
    if (!activeMatches.has(matchId)) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    const match = activeMatches.get(matchId);
    match.status = 'active';
    activeMatches.set(matchId, match);

    logger.info(`Match activated: ${matchId}`);

    // Emit match activation event
    emitMatchUpdate(matchId, { type: 'match_activated', matchData: match });

    res.json({
      success: true,
      data: match
    });

  } catch (error) {
    logger.error('Error activating match:', error instanceof Error ? error : undefined);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Record a shot during the match
 */
router.post('/match/:matchId/shot', async (req: express.Request, res: express.Response) => {
  try {
    const { matchId } = req.params;
    const shotData = req.body;
    
    if (!activeMatches.has(matchId)) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    const match = activeMatches.get(matchId);
    
    if (match.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Match is not active'
      });
    }

    const event = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'shot',
      timestamp: new Date(),
      playerId: shotData.playerId,
      description: `${shotData.playerId} takes a ${shotData.shotType} shot`,
      data: shotData,
      confidence: shotData.confidence || 0.95,
      aiAnalysis: shotData.aiAnalysis || {}
    };

    match.events.push(event);

    // Update score if shot was successful
    if (shotData.success) {
      if (shotData.playerId === match.player1Id) {
        match.score.player1++;
      } else {
        match.score.player2++;
      }
    }

    activeMatches.set(matchId, match);

    // Update analytics
    updateMatchAnalytics(matchId);

    // Emit shot recorded event
    emitShotRecorded(matchId, event);

    logger.info(`Shot recorded for match ${matchId}:`, event);

    res.json({
      success: true,
      data: event
    });

  } catch (error) {
    logger.error('Error recording shot:', error instanceof Error ? error : undefined);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Record a foul during the match
 */
router.post('/match/:matchId/foul', async (req: express.Request, res: express.Response) => {
  try {
    const { matchId } = req.params;
    const foulData = req.body;
    
    if (!activeMatches.has(matchId)) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    const match = activeMatches.get(matchId);
    
    if (match.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Match is not active'
      });
    }

    const event = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'foul',
      timestamp: new Date(),
      playerId: foulData.playerId,
      description: `${foulData.playerId} commits a ${foulData.foulType} foul`,
      data: foulData,
      confidence: foulData.confidence || 0.9,
      aiAnalysis: foulData.aiAnalysis || {}
    };

    match.events.push(event);
    activeMatches.set(matchId, match);

    // Update analytics
    updateMatchAnalytics(matchId);

    // Emit foul detected event
    emitFoulDetected(matchId, event);

    logger.info(`Foul recorded for match ${matchId}:`, event);

    res.json({
      success: true,
      data: event
    });

  } catch (error) {
    logger.error('Error recording foul:', error instanceof Error ? error : undefined);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Complete match and record results
 */
router.post('/match/:matchId/complete', async (req: express.Request, res: express.Response) => {
  try {
    const { matchId } = req.params;
    const { winnerId } = req.body;
    
    if (!activeMatches.has(matchId)) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    const match = activeMatches.get(matchId);
    match.status = 'completed';
    match.endTime = new Date();
    match.winnerId = winnerId;

    // Calculate match duration
    const duration = match.endTime.getTime() - match.startTime.getTime();

    // Generate final analytics
    const analytics = generateFinalAnalytics(matchId);
    match.matchAnalytics = analytics;

    // Generate highlights
    const highlights = generateHighlights(matchId);
    match.highlights = highlights;

    // Calculate rewards
    const rewards = calculateRewards(match, winnerId);

    const matchResult = {
      matchId,
      challengeId: match.challengeId,
      winnerId,
      loserId: winnerId === match.player1Id ? match.player2Id : match.player1Id,
      winnerScore: winnerId === match.player1Id ? match.score.player1 : match.score.player2,
      loserScore: winnerId === match.player1Id ? match.score.player2 : match.score.player1,
      matchDuration: duration,
      analytics,
      highlights,
      rewards
    };

    // Store match result
    matchResults.set(matchId, matchResult);

    // Update challenge status
    await updateChallengeStatus(match.challengeId, matchResult);

    // Remove from active matches
    activeMatches.delete(matchId);

    // Emit match completion event
    emitMatchUpdate(matchId, { type: 'match_completed', matchResult });

    logger.info(`Match completed: ${matchId}`, matchResult);

    res.json({
      success: true,
      data: matchResult
    });

  } catch (error) {
    logger.error('Error completing match:', error instanceof Error ? error : undefined);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get match data
 */
router.get('/match/:matchId', async (req: express.Request, res: express.Response) => {
  try {
    const { matchId } = req.params;
    
    const match = activeMatches.get(matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    res.json({
      success: true,
      data: match
    });

  } catch (error) {
    logger.error('Error fetching match:', error instanceof Error ? error : undefined);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get all active matches
 */
router.get('/match/active', async (req: express.Request, res: express.Response) => {
  try {
    const activeMatchesList = Array.from(activeMatches.values());

    res.json({
      success: true,
      data: activeMatchesList,
      count: activeMatchesList.length
    });

  } catch (error) {
    logger.error('Error fetching active matches:', error instanceof Error ? error : undefined);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get match analytics
 */
router.get('/match/:matchId/analytics', async (req: express.Request, res: express.Response) => {
  try {
    const { matchId } = req.params;
    
    const analytics = matchAnalytics.get(matchId);
    if (!analytics) {
      return res.status(404).json({
        success: false,
        error: 'Match analytics not found'
      });
    }

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    logger.error('Error fetching match analytics:', error instanceof Error ? error : undefined);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get match highlights
 */
router.get('/match/:matchId/highlights', async (req: express.Request, res: express.Response) => {
  try {
    const { matchId } = req.params;
    
    const match = activeMatches.get(matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    const highlights = generateHighlights(matchId);

    res.json({
      success: true,
      data: highlights
    });

  } catch (error) {
    logger.error('Error fetching match highlights:', error instanceof Error ? error : undefined);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper functions

function updateMatchAnalytics(matchId: string): void {
  const match = activeMatches.get(matchId);
  if (!match) return;

  const analytics = {
    totalShots: match.events.filter((e: any) => e.type === 'shot').length,
    successfulShots: match.events.filter((e: any) => e.type === 'shot' && e.data?.success).length,
    fouls: match.events.filter((e: any) => e.type === 'foul').length,
    breaks: match.events.filter((e: any) => e.type === 'break').length,
    averageShotTime: calculateAverageShotTime(match),
    playerPerformance: calculatePlayerPerformance(match),
    gameFlow: calculateGameFlow(match),
    skillGap: calculateSkillGap(match),
    excitementLevel: calculateExcitementLevel(match)
  };

  matchAnalytics.set(matchId, analytics);
  emitMatchUpdate(matchId, { type: 'analytics_updated', analytics });
}

function generateFinalAnalytics(matchId: string): any {
  return matchAnalytics.get(matchId) || {
    totalShots: 0,
    successfulShots: 0,
    fouls: 0,
    breaks: 0,
    averageShotTime: 0,
    playerPerformance: {
      player1: { shots: 0, successfulShots: 0, fouls: 0, breaks: 0, averageShotTime: 0, accuracy: 0, consistency: 0, pressureHandling: 0 },
      player2: { shots: 0, successfulShots: 0, fouls: 0, breaks: 0, averageShotTime: 0, accuracy: 0, consistency: 0, pressureHandling: 0 }
    },
    gameFlow: [],
    skillGap: 0,
    excitementLevel: 0
  };
}

function generateHighlights(matchId: string): any[] {
  const match = activeMatches.get(matchId);
  if (!match) return [];

  const highlights: any[] = [];

  // Find amazing shots
  const amazingShots = match.events.filter((e: any) => 
    e.type === 'shot' && e.data?.success && e.data?.accuracy > 0.8
  );

  amazingShots.forEach((shot: any, index: number) => {
    highlights.push({
      id: `highlight_${Date.now()}_${index}`,
      type: 'amazing_shot',
      timestamp: shot.timestamp,
      description: `Amazing shot by ${shot.playerId}`,
      videoTimestamp: shot.timestamp.getTime(),
      importance: 0.8
    });
  });

  // Find clutch plays
  const clutchPlays = match.events.filter((e: any) => 
    e.type === 'shot' && e.data?.success && 
    (match.score.player1 === 8 || match.score.player2 === 8)
  );

  clutchPlays.forEach((play: any, index: number) => {
    highlights.push({
      id: `highlight_${Date.now()}_clutch_${index}`,
      type: 'clutch_play',
      timestamp: play.timestamp,
      description: `Clutch play by ${play.playerId}`,
      videoTimestamp: play.timestamp.getTime(),
      importance: 0.9
    });
  });

  return highlights;
}

function calculateRewards(match: any, winnerId: string): any {
  const baseCoins = 100;
  const baseExperience = 50;
  
  const analytics = matchAnalytics.get(match.id);
  const performanceBonus = analytics ? analytics.excitementLevel * 0.5 : 1;

  return {
    dojoCoins: Math.floor(baseCoins * performanceBonus),
    experience: Math.floor(baseExperience * performanceBonus),
    achievements: [],
    territoryControl: match.challengeId.includes('pilgrimage') || match.challengeId.includes('gauntlet'),
    clanInfluence: performanceBonus > 1.5 ? 10 : 5
  };
}

async function updateChallengeStatus(challengeId: string, matchResult: any): Promise<void> {
  try {
    // In a real implementation, this would update the challenge in the database
    const challenge = challenges.get(challengeId);
    if (challenge) {
      challenge.status = 'completed';
      challenge.completedAt = new Date();
      challenge.winnerId = matchResult.winnerId;
      challenge.matchData = matchResult;
      challenges.set(challengeId, challenge);
    }
  } catch (error) {
    logger.error('Error updating challenge status:', error);
  }
}

// Analytics calculation helper functions
function calculateAverageShotTime(match: any): number {
  const shots = match.events.filter((e: any) => e.type === 'shot');
  if (shots.length < 2) return 0;
  
  const totalTime = shots.reduce((sum: number, shot: any, index: number) => {
    if (index === 0) return 0;
    const prevShot = shots[index - 1];
    return sum + (shot.timestamp.getTime() - prevShot.timestamp.getTime());
  }, 0);
  
  return totalTime / (shots.length - 1);
}

function calculatePlayerPerformance(match: any): any {
  const player1Events = match.events.filter((e: any) => e.playerId === match.player1Id);
  const player2Events = match.events.filter((e: any) => e.playerId === match.player2Id);

  return {
    player1: calculateIndividualPerformance(player1Events),
    player2: calculateIndividualPerformance(player2Events)
  };
}

function calculateIndividualPerformance(events: any[]): any {
  const shots = events.filter((e: any) => e.type === 'shot');
  const successfulShots = shots.filter((s: any) => s.data?.success);
  const fouls = events.filter((e: any) => e.type === 'foul');
  const breaks = events.filter((e: any) => e.type === 'break');

  return {
    shots: shots.length,
    successfulShots: successfulShots.length,
    fouls: fouls.length,
    breaks: breaks.length,
    averageShotTime: calculateAverageShotTime({ events }),
    accuracy: shots.length > 0 ? successfulShots.length / shots.length : 0,
    consistency: calculateConsistency(shots),
    pressureHandling: calculatePressureHandling(events)
  };
}

function calculateConsistency(shots: any[]): number {
  if (shots.length < 2) return 1;
  
  const accuracies = shots.map((shot: any) => shot.data?.accuracy || 0);
  const mean = accuracies.reduce((sum: number, acc: number) => sum + acc, 0) / accuracies.length;
  const variance = accuracies.reduce((sum: number, acc: number) => sum + Math.pow(acc - mean, 2), 0) / accuracies.length;
  
  return Math.max(0, 1 - Math.sqrt(variance));
}

function calculatePressureHandling(events: any[]): number {
  const lateGameEvents = events.filter((e: any) => {
    return e.timestamp.getTime() > Date.now() - (Date.now() * 0.25);
  });
  
  if (lateGameEvents.length === 0) return 1;
  
  const lateGameShots = lateGameEvents.filter((e: any) => e.type === 'shot');
  const lateGameSuccess = lateGameShots.filter((s: any) => s.data?.success).length;
  
  return lateGameShots.length > 0 ? lateGameSuccess / lateGameShots.length : 1;
}

function calculateGameFlow(match: any): any[] {
  return match.events
    .filter((e: any) => e.type === 'shot')
    .map((event: any, index: number) => ({
      timestamp: event.timestamp,
      score: getScoreAtTime(match, event.timestamp),
      momentum: calculateMomentum(match, index),
      excitement: calculateExcitementAtTime(match, event.timestamp)
    }));
}

function getScoreAtTime(match: any, timestamp: Date): any {
  const eventsBefore = match.events.filter((e: any) => e.timestamp <= timestamp);
  let player1Score = 0;
  let player2Score = 0;
  
  eventsBefore.forEach((event: any) => {
    if (event.type === 'shot' && event.data?.success) {
      if (event.playerId === match.player1Id) {
        player1Score++;
      } else {
        player2Score++;
      }
    }
  });
  
  return { player1: player1Score, player2: player2Score };
}

function calculateMomentum(match: any, eventIndex: number): number {
  const recentEvents = match.events.slice(Math.max(0, eventIndex - 5), eventIndex + 1);
  const successfulShots = recentEvents.filter((e: any) => e.type === 'shot' && e.data?.success).length;
  
  return recentEvents.length > 0 ? successfulShots / recentEvents.length : 0.5;
}

function calculateExcitementAtTime(match: any, timestamp: Date): number {
  const recentEvents = match.events.filter((e: any) => 
    e.timestamp >= new Date(timestamp.getTime() - 60000)
  );
  
  const scoreAtTime = getScoreAtTime(match, timestamp);
  const closeGame = Math.abs(scoreAtTime.player1 - scoreAtTime.player2) <= 2;
  const recentActivity = recentEvents.length > 3;
  
  return (closeGame ? 0.8 : 0.4) + (recentActivity ? 0.2 : 0);
}

function calculateSkillGap(match: any): number {
  const analytics = matchAnalytics.get(match.id);
  if (!analytics) return 0;
  
  const p1Perf = analytics.playerPerformance.player1;
  const p2Perf = analytics.playerPerformance.player2;
  
  const p1Skill = (p1Perf.accuracy * 0.4) + (p1Perf.consistency * 0.3) + (p1Perf.pressureHandling * 0.3);
  const p2Skill = (p2Perf.accuracy * 0.4) + (p2Perf.consistency * 0.3) + (p2Perf.pressureHandling * 0.3);
  
  return Math.abs(p1Skill - p2Skill);
}

function calculateExcitementLevel(match: any): number {
  const analytics = matchAnalytics.get(match.id);
  if (!analytics) return 0.5;
  
  const closeGame = Math.abs(match.score.player1 - match.score.player2) <= 2;
  const highActivity = analytics.totalShots > 20;
  const amazingShots = analytics.successfulShots / analytics.totalShots > 0.7;
  
  let excitement = 0.5;
  if (closeGame) excitement += 0.3;
  if (highActivity) excitement += 0.2;
  if (amazingShots) excitement += 0.2;
  
  return Math.min(1, excitement);
}

export default router; 


