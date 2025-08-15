import { io, Socket } from 'socket.io-client';

export interface Clan {
  id: string;
  name: string;
  tag: string;
  description: string;
  avatar: string;
  banner: string;
  leaderId: string;
  leaderName: string;
  memberCount: number;
  maxMembers: number;
  level: number;
  experience: number;
  territoryCount: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  createdAt: Date;
  isPublic: boolean;
  requirements: {
    minRank: string;
    minTerritories: number;
    minWins: number;
  };
}

export interface ClanMember {
  id: string;
  username: string;
  avatar: string;
  rank: string;
  role: 'leader' | 'officer' | 'member' | 'recruit';
  joinedAt: Date;
  contribution: number;
  territoryCount: number;
  matchWins: number;
  isOnline: boolean;
  lastSeen: Date;
}

export interface ClanWar {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'preparing' | 'active' | 'completed';
  clan1Id: string;
  clan1Name: string;
  clan1Score: number;
  clan2Id: string;
  clan2Name: string;
  clan2Score: number;
  winnerId?: string;
  rewards: {
    winner: number;
    loser: number;
  };
  matches: ClanWarMatch[];
}

export interface ClanWarMatch {
  id: string;
  player1Id: string;
  player1Name: string;
  player1ClanId: string;
  player2Id: string;
  player2Name: string;
  player2ClanId: string;
  winnerId?: string;
  score: string;
  territory: string;
  timestamp: Date;
}

export interface ClanInvite {
  id: string;
  clanId: string;
  clanName: string;
  inviterId: string;
  inviterName: string;
  targetUserId: string;
  message?: string;
  createdAt: Date;
  expiresAt: Date;
}

class ClanSystemService {
  private socket: Socket | null = null;
  private userClan: Clan | null = null;
  private clanMembers: ClanMember[] = [];
  private activeClanWars: ClanWar[] = [];
  private clanInvites: ClanInvite[] = [];
  private clanUpdateCallbacks: ((clan: Clan) => void)[] = [];
  private memberUpdateCallbacks: ((member: ClanMember) => void)[] = [];
  private warUpdateCallbacks: ((war: ClanWar) => void)[] = [];
  private inviteCallbacks: ((invite: ClanInvite) => void)[] = [];

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket() {
    this.socket = io('/socket.io');
    
    this.socket.on('connect', () => {
      console.log('Clan system connected');
    });

    this.socket.on('clan-update', (clan: Clan) => {
      if (this.userClan?.id === clan.id) {
        this.userClan = clan;
        this.clanUpdateCallbacks.forEach(callback => callback(clan));
      }
    });

    this.socket.on('member-update', (member: ClanMember) => {
      const index = this.clanMembers.findIndex(m => m.id === member.id);
      if (index !== -1) {
        this.clanMembers[index] = member;
        this.memberUpdateCallbacks.forEach(callback => callback(member));
      }
    });

    this.socket.on('war-update', (war: ClanWar) => {
      const index = this.activeClanWars.findIndex(w => w.id === war.id);
      if (index !== -1) {
        this.activeClanWars[index] = war;
      } else {
        this.activeClanWars.push(war);
      }
      this.warUpdateCallbacks.forEach(callback => callback(war));
    });

    this.socket.on('clan-invite', (invite: ClanInvite) => {
      this.clanInvites.push(invite);
      this.inviteCallbacks.forEach(callback => callback(invite));
    });
  }

  // Clan Management
  async getUserClan(): Promise<Clan | null> {
    try {
      const response = await fetch('/api/v1/clans/my-clan');
      if (response.ok) {
        this.userClan = await response.json();
        return this.userClan;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user clan:', error);
      return null;
    }
  }

  async createClan(clanData: {
    name: string;
    tag: string;
    description: string;
    isPublic: boolean;
    requirements: Clan['requirements'];
  }): Promise<Clan | null> {
    try {
      const response = await fetch('/api/v1/clans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clanData)
      });
      if (response.ok) {
        this.userClan = await response.json();
        return this.userClan;
      }
      return null;
    } catch (error) {
      console.error('Error creating clan:', error);
      return null;
    }
  }

  async updateClan(clanData: Partial<Clan>): Promise<boolean> {
    try {
      const response = await fetch(`/api/v1/clans/${this.userClan?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clanData)
      });
      if (response.ok) {
        this.userClan = await response.json();
        this.clanUpdateCallbacks.forEach(callback => callback(this.userClan!));
      }
      return response.ok;
    } catch (error) {
      console.error('Error updating clan:', error);
      return false;
    }
  }

  async leaveClan(): Promise<boolean> {
    try {
      const response = await fetch(`/api/v1/clans/${this.userClan?.id}/leave`, {
        method: 'POST'
      });
      if (response.ok) {
        this.userClan = null;
        this.clanMembers = [];
      }
      return response.ok;
    } catch (error) {
      console.error('Error leaving clan:', error);
      return false;
    }
  }

  // Clan Members
  async getClanMembers(): Promise<ClanMember[]> {
    try {
      const response = await fetch(`/api/v1/clans/${this.userClan?.id}/members`);
      if (response.ok) {
        this.clanMembers = await response.json();
        return this.clanMembers;
      }
      return [];
    } catch (error) {
      console.error('Error fetching clan members:', error);
      return [];
    }
  }

  async promoteMember(memberId: string, newRole: ClanMember['role']): Promise<boolean> {
    try {
      const response = await fetch(`/api/v1/clans/${this.userClan?.id}/members/${memberId}/promote`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      return response.ok;
    } catch (error) {
      console.error('Error promoting member:', error);
      return false;
    }
  }

  async kickMember(memberId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/v1/clans/${this.userClan?.id}/members/${memberId}/kick`, {
        method: 'DELETE'
      });
      return response.ok;
    } catch (error) {
      console.error('Error kicking member:', error);
      return false;
    }
  }

  // Clan Wars
  async getActiveClanWars(): Promise<ClanWar[]> {
    try {
      const response = await fetch('/api/v1/clans/wars/active');
      if (response.ok) {
        this.activeClanWars = await response.json();
        return this.activeClanWars;
      }
      return [];
    } catch (error) {
      console.error('Error fetching active clan wars:', error);
      return [];
    }
  }

  async declareWar(targetClanId: string, warData: {
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    rewards: ClanWar['rewards'];
  }): Promise<ClanWar | null> {
    try {
      const response = await fetch('/api/v1/clans/wars/declare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetClanId,
          ...warData
        })
      });
      if (response.ok) {
        const war = await response.json();
        this.activeClanWars.push(war);
        return war;
      }
      return null;
    } catch (error) {
      console.error('Error declaring war:', error);
      return null;
    }
  }

  async acceptWar(warId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/v1/clans/wars/${warId}/accept`, {
        method: 'POST'
      });
      return response.ok;
    } catch (error) {
      console.error('Error accepting war:', error);
      return false;
    }
  }

  async submitWarMatch(warId: string, matchData: {
    player1Id: string;
    player2Id: string;
    winnerId: string;
    score: string;
    territory: string;
  }): Promise<boolean> {
    try {
      const response = await fetch(`/api/v1/clans/wars/${warId}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matchData)
      });
      return response.ok;
    } catch (error) {
      console.error('Error submitting war match:', error);
      return false;
    }
  }

  // Clan Invites
  async invitePlayer(userId: string, message?: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/v1/clans/${this.userClan?.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId, message })
      });
      return response.ok;
    } catch (error) {
      console.error('Error inviting player:', error);
      return false;
    }
  }

  async getClanInvites(): Promise<ClanInvite[]> {
    try {
      const response = await fetch('/api/v1/clans/invites');
      if (response.ok) {
        this.clanInvites = await response.json();
        return this.clanInvites;
      }
      return [];
    } catch (error) {
      console.error('Error fetching clan invites:', error);
      return [];
    }
  }

  async acceptClanInvite(inviteId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/v1/clans/invites/${inviteId}/accept`, {
        method: 'POST'
      });
      if (response.ok) {
        this.clanInvites = this.clanInvites.filter(invite => invite.id !== inviteId);
        await this.getUserClan();
      }
      return response.ok;
    } catch (error) {
      console.error('Error accepting clan invite:', error);
      return false;
    }
  }

  async declineClanInvite(inviteId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/v1/clans/invites/${inviteId}/decline`, {
        method: 'POST'
      });
      if (response.ok) {
        this.clanInvites = this.clanInvites.filter(invite => invite.id !== inviteId);
      }
      return response.ok;
    } catch (error) {
      console.error('Error declining clan invite:', error);
      return false;
    }
  }

  // Clan Discovery
  async searchClans(query: string): Promise<Clan[]> {
    try {
      const response = await fetch(`/api/v1/clans/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error searching clans:', error);
      return [];
    }
  }

  async getTopClans(limit: number = 10): Promise<Clan[]> {
    try {
      const response = await fetch(`/api/v1/clans/top?limit=${limit}`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching top clans:', error);
      return [];
    }
  }

  // Event Listeners
  onClanUpdate(callback: (clan: Clan) => void) {
    this.clanUpdateCallbacks.push(callback);
  }

  onMemberUpdate(callback: (member: ClanMember) => void) {
    this.memberUpdateCallbacks.push(callback);
  }

  onWarUpdate(callback: (war: ClanWar) => void) {
    this.warUpdateCallbacks.push(callback);
  }

  onClanInvite(callback: (invite: ClanInvite) => void) {
    this.inviteCallbacks.push(callback);
  }

  // Utility Methods
  getClanRole(): ClanMember['role'] | null {
    if (!this.userClan) return null;
    const member = this.clanMembers.find(m => m.id === this.userClan?.leaderId);
    return member?.role || null;
  }

  canManageClan(): boolean {
    const role = this.getClanRole();
    return role === 'leader' || role === 'officer';
  }

  canInviteMembers(): boolean {
    const role = this.getClanRole();
    return role === 'leader' || role === 'officer';
  }

  getPendingInvitesCount(): number {
    return this.clanInvites.length;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const clanSystemService = new ClanSystemService(); 
