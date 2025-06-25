import { useState, useEffect, useCallback } from 'react';
import { clanSystemService, Clan, ClanMember, ClanWar, ClanInvite } from '../services/clan/ClanSystemService';

export const useClanSystem = () => {
  const [userClan, setUserClan] = useState<Clan | null>(null);
  const [clanMembers, setClanMembers] = useState<ClanMember[]>([]);
  const [activeClanWars, setActiveClanWars] = useState<ClanWar[]>([]);
  const [clanInvites, setClanInvites] = useState<ClanInvite[]>([]);
  const [loading, setLoading] = useState({
    clan: false,
    members: false,
    wars: false,
    invites: false
  });
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadUserClan();
    loadActiveClanWars();
    loadClanInvites();
  }, []);

  // Set up real-time listeners
  useEffect(() => {
    const handleClanUpdate = (clan: Clan) => {
      setUserClan(clan);
    };

    const handleMemberUpdate = (member: ClanMember) => {
      setClanMembers(prev => prev.map(m => m.id === member.id ? member : m));
    };

    const handleWarUpdate = (war: ClanWar) => {
      setActiveClanWars(prev => {
        const index = prev.findIndex(w => w.id === war.id);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = war;
          return updated;
        } else {
          return [...prev, war];
        }
      });
    };

    const handleClanInvite = (invite: ClanInvite) => {
      setClanInvites(prev => [...prev, invite]);
    };

    clanSystemService.onClanUpdate(handleClanUpdate);
    clanSystemService.onMemberUpdate(handleMemberUpdate);
    clanSystemService.onWarUpdate(handleWarUpdate);
    clanSystemService.onClanInvite(handleClanInvite);

    return () => {
      // Cleanup listeners if needed
    };
  }, []);

  // Clan Management
  const loadUserClan = useCallback(async () => {
    setLoading(prev => ({ ...prev, clan: true }));
    setError(null);
    try {
      const clan = await clanSystemService.getUserClan();
      setUserClan(clan);
      if (clan) {
        await loadClanMembers();
      }
    } catch (err) {
      setError('Failed to load clan');
      console.error('Error loading clan:', err);
    } finally {
      setLoading(prev => ({ ...prev, clan: false }));
    }
  }, []);

  const createClan = useCallback(async (clanData: {
    name: string;
    tag: string;
    description: string;
    isPublic: boolean;
    requirements: Clan['requirements'];
  }) => {
    setLoading(prev => ({ ...prev, clan: true }));
    setError(null);
    try {
      const clan = await clanSystemService.createClan(clanData);
      if (clan) {
        setUserClan(clan);
        await loadClanMembers();
      }
      return clan;
    } catch (err) {
      setError('Failed to create clan');
      console.error('Error creating clan:', err);
      return null;
    } finally {
      setLoading(prev => ({ ...prev, clan: false }));
    }
  }, []);

  const updateClan = useCallback(async (clanData: Partial<Clan>) => {
    setError(null);
    try {
      const success = await clanSystemService.updateClan(clanData);
      if (!success) {
        setError('Failed to update clan');
      }
      return success;
    } catch (err) {
      setError('Failed to update clan');
      console.error('Error updating clan:', err);
      return false;
    }
  }, []);

  const leaveClan = useCallback(async () => {
    setError(null);
    try {
      const success = await clanSystemService.leaveClan();
      if (success) {
        setUserClan(null);
        setClanMembers([]);
      }
      return success;
    } catch (err) {
      setError('Failed to leave clan');
      console.error('Error leaving clan:', err);
      return false;
    }
  }, []);

  // Clan Members
  const loadClanMembers = useCallback(async () => {
    if (!userClan) return;
    
    setLoading(prev => ({ ...prev, members: true }));
    setError(null);
    try {
      const members = await clanSystemService.getClanMembers();
      setClanMembers(members);
    } catch (err) {
      setError('Failed to load clan members');
      console.error('Error loading clan members:', err);
    } finally {
      setLoading(prev => ({ ...prev, members: false }));
    }
  }, [userClan]);

  const promoteMember = useCallback(async (memberId: string, newRole: ClanMember['role']) => {
    setError(null);
    try {
      const success = await clanSystemService.promoteMember(memberId, newRole);
      if (success) {
        await loadClanMembers(); // Refresh members list
      }
      return success;
    } catch (err) {
      setError('Failed to promote member');
      console.error('Error promoting member:', err);
      return false;
    }
  }, [loadClanMembers]);

  const kickMember = useCallback(async (memberId: string) => {
    setError(null);
    try {
      const success = await clanSystemService.kickMember(memberId);
      if (success) {
        setClanMembers(prev => prev.filter(m => m.id !== memberId));
      }
      return success;
    } catch (err) {
      setError('Failed to kick member');
      console.error('Error kicking member:', err);
      return false;
    }
  }, []);

  // Clan Wars
  const loadActiveClanWars = useCallback(async () => {
    setLoading(prev => ({ ...prev, wars: true }));
    setError(null);
    try {
      const wars = await clanSystemService.getActiveClanWars();
      setActiveClanWars(wars);
    } catch (err) {
      setError('Failed to load clan wars');
      console.error('Error loading clan wars:', err);
    } finally {
      setLoading(prev => ({ ...prev, wars: false }));
    }
  }, []);

  const declareWar = useCallback(async (targetClanId: string, warData: {
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    rewards: ClanWar['rewards'];
  }) => {
    setError(null);
    try {
      const war = await clanSystemService.declareWar(targetClanId, warData);
      if (war) {
        setActiveClanWars(prev => [...prev, war]);
      }
      return war;
    } catch (err) {
      setError('Failed to declare war');
      console.error('Error declaring war:', err);
      return null;
    }
  }, []);

  const acceptWar = useCallback(async (warId: string) => {
    setError(null);
    try {
      const success = await clanSystemService.acceptWar(warId);
      if (!success) {
        setError('Failed to accept war');
      }
      return success;
    } catch (err) {
      setError('Failed to accept war');
      console.error('Error accepting war:', err);
      return false;
    }
  }, []);

  const submitWarMatch = useCallback(async (warId: string, matchData: {
    player1Id: string;
    player2Id: string;
    winnerId: string;
    score: string;
    territory: string;
  }) => {
    setError(null);
    try {
      const success = await clanSystemService.submitWarMatch(warId, matchData);
      if (!success) {
        setError('Failed to submit war match');
      }
      return success;
    } catch (err) {
      setError('Failed to submit war match');
      console.error('Error submitting war match:', err);
      return false;
    }
  }, []);

  // Clan Invites
  const loadClanInvites = useCallback(async () => {
    setLoading(prev => ({ ...prev, invites: true }));
    setError(null);
    try {
      const invites = await clanSystemService.getClanInvites();
      setClanInvites(invites);
    } catch (err) {
      setError('Failed to load clan invites');
      console.error('Error loading clan invites:', err);
    } finally {
      setLoading(prev => ({ ...prev, invites: false }));
    }
  }, []);

  const invitePlayer = useCallback(async (userId: string, message?: string) => {
    setError(null);
    try {
      const success = await clanSystemService.invitePlayer(userId, message);
      if (!success) {
        setError('Failed to invite player');
      }
      return success;
    } catch (err) {
      setError('Failed to invite player');
      console.error('Error inviting player:', err);
      return false;
    }
  }, []);

  const acceptClanInvite = useCallback(async (inviteId: string) => {
    setError(null);
    try {
      const success = await clanSystemService.acceptClanInvite(inviteId);
      if (success) {
        setClanInvites(prev => prev.filter(invite => invite.id !== inviteId));
        await loadUserClan(); // Refresh user clan
      }
      return success;
    } catch (err) {
      setError('Failed to accept clan invite');
      console.error('Error accepting clan invite:', err);
      return false;
    }
  }, [loadUserClan]);

  const declineClanInvite = useCallback(async (inviteId: string) => {
    setError(null);
    try {
      const success = await clanSystemService.declineClanInvite(inviteId);
      if (success) {
        setClanInvites(prev => prev.filter(invite => invite.id !== inviteId));
      }
      return success;
    } catch (err) {
      setError('Failed to decline clan invite');
      console.error('Error declining clan invite:', err);
      return false;
    }
  }, []);

  // Clan Discovery
  const searchClans = useCallback(async (query: string): Promise<Clan[]> => {
    try {
      return await clanSystemService.searchClans(query);
    } catch (err) {
      console.error('Error searching clans:', err);
      return [];
    }
  }, []);

  const getTopClans = useCallback(async (limit: number = 10): Promise<Clan[]> => {
    try {
      return await clanSystemService.getTopClans(limit);
    } catch (err) {
      console.error('Error fetching top clans:', err);
      return [];
    }
  }, []);

  // Utility Methods
  const getClanRole = useCallback(() => {
    return clanSystemService.getClanRole();
  }, []);

  const canManageClan = useCallback(() => {
    return clanSystemService.canManageClan();
  }, []);

  const canInviteMembers = useCallback(() => {
    return clanSystemService.canInviteMembers();
  }, []);

  const getPendingInvitesCount = useCallback(() => {
    return clanSystemService.getPendingInvitesCount();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    userClan,
    clanMembers,
    activeClanWars,
    clanInvites,
    loading,
    error,

    // Clan Management
    loadUserClan,
    createClan,
    updateClan,
    leaveClan,

    // Clan Members
    loadClanMembers,
    promoteMember,
    kickMember,

    // Clan Wars
    loadActiveClanWars,
    declareWar,
    acceptWar,
    submitWarMatch,

    // Clan Invites
    loadClanInvites,
    invitePlayer,
    acceptClanInvite,
    declineClanInvite,

    // Clan Discovery
    searchClans,
    getTopClans,

    // Utility Methods
    getClanRole,
    canManageClan,
    canInviteMembers,
    getPendingInvitesCount,
    clearError
  };
}; 