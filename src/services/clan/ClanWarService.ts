import { clanSystemService, ClanWar } from './ClanSystemService';

class ClanWarService {
  /**
   * Fetches a single clan war by its ID
   * @param warId The ID of the clan war to fetch
   * @returns The clan war object or null if not found
   */
  async getWarById(warId: string): Promise<ClanWar | null> {
    try {
      const response = await fetch(`/api/v1/clans/wars/${warId}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error fetching clan war details:', error);
      return null;
    }
  }

  /**
   * Gets the participants of a clan war
   * @param war The clan war object
   * @returns An array of participants with their scores
   */
  getWarParticipants(war: ClanWar) {
    // Extract unique participants from matches
    const participants = new Map();
    
    war.matches.forEach(match => {
      // Player 1
      if (!participants.has(match.player1Id)) {
        participants.set(match.player1Id, {
          id: match.player1Id,
          name: match.player1Name,
          clanId: match.player1ClanId,
          clanName: match.player1ClanId === war.clan1Id ? war.clan1Name : war.clan2Name,
          score: 0,
          wins: 0,
          matches: 0
        });
      }
      
      // Player 2
      if (!participants.has(match.player2Id)) {
        participants.set(match.player2Id, {
          id: match.player2Id,
          name: match.player2Name,
          clanId: match.player2ClanId,
          clanName: match.player2ClanId === war.clan1Id ? war.clan1Name : war.clan2Name,
          score: 0,
          wins: 0,
          matches: 0
        });
      }
      
      // Update match counts
      const player1 = participants.get(match.player1Id);
      const player2 = participants.get(match.player2Id);
      
      player1.matches += 1;
      player2.matches += 1;
      
      // Update wins and scores if there's a winner
      if (match.winnerId) {
        const winner = participants.get(match.winnerId);
        winner.wins += 1;
        winner.score += 10; // Example scoring system
      }
    });
    
    // Convert to array and sort by score
    return Array.from(participants.values())
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Calculates the time remaining for a clan war
   * @param endDate The end date of the clan war
   * @returns A formatted string showing the time remaining
   */
  getTimeRemaining(endDate: Date): string {
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    const timeRemaining = end - now;
    
    if (timeRemaining <= 0) {
      return 'Ended';
    }
    
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  }
}

export const clanWarService = new ClanWarService();