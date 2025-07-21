import { MatchData, MatchEvent, MatchHighlight } from './MatchDataService';

export class MatchHighlightsService {
  async generateHighlights(match: MatchData): Promise<MatchHighlight[]> {
    const highlights: MatchHighlight[] = [];

    // Analyze events for different types of highlights
    const amazingShots = this.detectAmazingShots(match);
    const clutchPlays = this.detectClutchPlays(match);
    const comebacks = this.detectComebacks(match);
    const perfectBreaks = this.detectPerfectBreaks(match);
    const foulRecoveries = this.detectFoulRecoveries(match);

    highlights.push(...amazingShots, ...clutchPlays, ...comebacks, ...perfectBreaks, ...foulRecoveries);

    // Sort by importance and timestamp
    return highlights.sort((a, b) => {
      if (a.importance !== b.importance) {
        return b.importance - a.importance;
      }
      return a.timestamp.getTime() - b.timestamp.getTime();
    });
  }

  private detectAmazingShots(match: MatchData): MatchHighlight[] {
    const amazingShots: MatchHighlight[] = [];
    const shots = match.events.filter(e => e.type === 'shot');

    shots.forEach(shot => {
      const shotData = shot.data;
      if (shotData?.difficulty > 0.8 && shotData?.success) {
        amazingShots.push({
          id: `highlight_${shot.id}`,
          type: 'amazing_shot',
          timestamp: shot.timestamp,
          description: `Incredible ${shotData.shotType} shot with ${Math.round(shotData.difficulty * 100)}% difficulty`,
          videoTimestamp: this.calculateVideoTimestamp(shot.timestamp, match.startTime),
          importance: shotData.difficulty * 0.8 + (shotData.accuracy || 0) * 0.2,
        });
      }
    });

    return amazingShots;
  }

  private detectClutchPlays(match: MatchData): MatchHighlight[] {
    const clutchPlays: MatchHighlight[] = [];
    const shots = match.events.filter(e => e.type === 'shot');

    shots.forEach(shot => {
      const shotData = shot.data;
      if (shotData?.pressureLevel > 0.8 && shotData?.success) {
        clutchPlays.push({
          id: `highlight_${shot.id}`,
          type: 'clutch_play',
          timestamp: shot.timestamp,
          description: `Clutch shot under pressure (${Math.round(shotData.pressureLevel * 100)}% pressure)`,
          videoTimestamp: this.calculateVideoTimestamp(shot.timestamp, match.startTime),
          importance: shotData.pressureLevel * 0.7 + (shotData.accuracy || 0) * 0.3,
        });
      }
    });

    return clutchPlays;
  }

  private detectComebacks(match: MatchData): MatchHighlight[] {
    const comebacks: MatchHighlight[] = [];
    const events = match.events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Look for comeback patterns
    let player1Score = 0;
    let player2Score = 0;
    let comebackStart: Date | null = null;
    let comebackPlayer: string | null = null;

    events.forEach(event => {
      if (event.type === 'shot' && event.data?.success) {
        if (event.playerId === match.player1Id) {
          player1Score++;
        } else if (event.playerId === match.player2Id) {
          player2Score++;
        }

        // Detect comeback start
        if (!comebackStart) {
          const scoreDiff = Math.abs(player1Score - player2Score);
          if (scoreDiff >= 3) {
            comebackStart = event.timestamp;
            comebackPlayer = player1Score > player2Score ? match.player2Id : match.player1Id;
          }
        }
      }
    });

    // If comeback was completed
    if (comebackStart && comebackPlayer) {
      const finalScore = this.getFinalScore(match);
      const comebackPlayerScore = comebackPlayer === match.player1Id ? finalScore.player1 : finalScore.player2;
      const otherPlayerScore = comebackPlayer === match.player1Id ? finalScore.player2 : finalScore.player1;

      if (comebackPlayerScore > otherPlayerScore) {
        comebacks.push({
          id: `highlight_comeback_${match.id}`,
          type: 'comeback',
          timestamp: comebackStart,
          description: `Amazing comeback from ${comebackPlayer} from a 3+ point deficit`,
          videoTimestamp: this.calculateVideoTimestamp(comebackStart, match.startTime),
          importance: 0.9,
        });
      }
    }

    return comebacks;
  }

  private detectPerfectBreaks(match: MatchData): MatchHighlight[] {
    const perfectBreaks: MatchHighlight[] = [];
    const breaks = match.events.filter(e => e.type === 'break');

    breaks.forEach(breakEvent => {
      const breakData = breakEvent.data;
      if (breakData?.success && breakData?.accuracy > 0.9) {
        perfectBreaks.push({
          id: `highlight_${breakEvent.id}`,
          type: 'perfect_break',
          timestamp: breakEvent.timestamp,
          description: `Perfect break with ${Math.round(breakData.accuracy * 100)}% accuracy`,
          videoTimestamp: this.calculateVideoTimestamp(breakEvent.timestamp, match.startTime),
          importance: breakData.accuracy * 0.8 + (breakData.power || 0) * 0.2,
        });
      }
    });

    return perfectBreaks;
  }

  private detectFoulRecoveries(match: MatchData): MatchHighlight[] {
    const foulRecoveries: MatchHighlight[] = [];
    const fouls = match.events.filter(e => e.type === 'foul');
    const shots = match.events.filter(e => e.type === 'shot');

    fouls.forEach(foul => {
      const foulData = foul.data;
      if (foulData?.severity === 'major' || foulData?.severity === 'serious') {
        // Look for successful shot after foul
        const recoveryShot = shots.find(shot => 
          shot.playerId === foul.playerId &&
          shot.timestamp > foul.timestamp &&
          shot.timestamp.getTime() - foul.timestamp.getTime() < 60000 && // Within 1 minute
          shot.data?.success
        );

        if (recoveryShot) {
          foulRecoveries.push({
            id: `highlight_${foul.id}_recovery`,
            type: 'foul_recovery',
            timestamp: recoveryShot.timestamp,
            description: `Recovery shot after ${foulData.severity} foul`,
            videoTimestamp: this.calculateVideoTimestamp(recoveryShot.timestamp, match.startTime),
            importance: 0.7,
          });
        }
      }
    });

    return foulRecoveries;
  }

  private calculateVideoTimestamp(eventTime: Date, matchStartTime: Date): number {
    return (eventTime.getTime() - matchStartTime.getTime()) / 1000; // Convert to seconds
  }

  private getFinalScore(match: MatchData): { player1: number; player2: number } {
    let player1Score = 0;
    let player2Score = 0;

    match.events.forEach(event => {
      if (event.type === 'shot' && event.data?.success) {
        if (event.playerId === match.player1Id) {
          player1Score++;
        } else if (event.playerId === match.player2Id) {
          player2Score++;
        }
      }
    });

    return { player1: player1Score, player2: player2Score };
  }

  // Additional highlight detection methods
  detectSkillGapHighlights(match: MatchData): MatchHighlight[] {
    const highlights: MatchHighlight[] = [];
    const player1Events = match.events.filter(e => e.playerId === match.player1Id);
    const player2Events = match.events.filter(e => e.playerId === match.player2Id);

    const player1Accuracy = this.calculatePlayerAccuracy(player1Events);
    const player2Accuracy = this.calculatePlayerAccuracy(player2Events);

    if (Math.abs(player1Accuracy - player2Accuracy) > 0.3) {
      const betterPlayer = player1Accuracy > player2Accuracy ? match.player1Id : match.player2Id;
      const bestShot = this.findBestShot(match.events.filter(e => e.playerId === betterPlayer));

      if (bestShot) {
        highlights.push({
          id: `highlight_skill_${match.id}`,
          type: 'amazing_shot',
          timestamp: bestShot.timestamp,
          description: `Skill demonstration by ${betterPlayer}`,
          videoTimestamp: this.calculateVideoTimestamp(bestShot.timestamp, match.startTime),
          importance: 0.8,
        });
      }
    }

    return highlights;
  }

  private calculatePlayerAccuracy(events: MatchEvent[]): number {
    const shots = events.filter(e => e.type === 'shot');
    const successfulShots = shots.filter(s => s.data?.success).length;
    return shots.length > 0 ? successfulShots / shots.length : 0;
  }

  private findBestShot(shots: MatchEvent[]): MatchEvent | null {
    return shots.reduce((best, current) => {
      const currentScore = (current.data?.difficulty || 0) * (current.data?.accuracy || 0);
      const bestScore = (best?.data?.difficulty || 0) * (best?.data?.accuracy || 0);
      return currentScore > bestScore ? current : best;
    }, null as MatchEvent | null);
  }
} 