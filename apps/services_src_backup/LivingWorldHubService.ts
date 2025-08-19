export interface PlayerData {
  id: string;
  name: string;
  avatar: string;
  level: number;
  experience: number;
  clan?: string;
  territory?: string;
  achievements: string[];
  homeDojo?: string;
}

class LivingWorldHubService {
  private socket: WebSocket | null = null;
  private isInitialized = false;

  async initializeSocket(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      try {
        // For development, we'll simulate socket connection
        this.isInitialized = true;
        console.log('LivingWorldHub socket initialized (simulated)');
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  async getPlayerData(): Promise<PlayerData> {
    // Return mock player data for development
    return {
      id: 'player-1',
      name: 'TestPlayer',
      avatar: '/avatars/default.png',
      level: 5,
      experience: 1250,
      clan: 'Crimson Monkey',
      territory: 'Jade Tiger Dojo',
      achievements: ['First Win', 'Territory Claimed'],
      homeDojo: 'Jade Tiger Dojo',
    };
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isInitialized = false;
  }
}

export const livingWorldHubService = new LivingWorldHubService();
export { LivingWorldHubService };
