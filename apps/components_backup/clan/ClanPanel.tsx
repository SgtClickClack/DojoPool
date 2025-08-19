import React, { useState, useEffect } from 'react';
import { useClanSystem } from '../../hooks/useClanSystem';
import {
  type Clan,
  ClanMember,
  ClanWar,
  ClanInvite,
} from '../../services/clan/ClanSystemService';

interface ClanPanelProps {
  className?: string;
}

export const ClanPanel: React.FC<ClanPanelProps> = ({ className = '' }) => {
  const {
    userClan,
    clanMembers,
    activeClanWars,
    clanInvites,
    loading,
    error,
    loadUserClan,
    createClan,
    updateClan,
    leaveClan,
    loadClanMembers,
    promoteMember,
    kickMember,
    loadActiveClanWars,
    declareWar,
    acceptWar,
    submitWarMatch,
    loadClanInvites,
    invitePlayer,
    acceptClanInvite,
    declineClanInvite,
    searchClans,
    getTopClans,
    getClanRole,
    canManageClan,
    canInviteMembers,
    getPendingInvitesCount,
    clearError,
  } = useClanSystem();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'members' | 'wars' | 'discover'
  >('overview');
  const [showCreateClan, setShowCreateClan] = useState(false);
  const [showInvitePlayer, setShowInvitePlayer] = useState(false);
  const [showDeclareWar, setShowDeclareWar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Clan[]>([]);
  const [topClans, setTopClans] = useState<Clan[]>([]);

  // Form states
  const [clanForm, setClanForm] = useState({
    name: '',
    tag: '',
    description: '',
    isPublic: true,
    requirements: {
      minRank: 'bronze',
      minTerritories: 0,
      minWins: 0,
    },
  });

  const [inviteForm, setInviteForm] = useState({
    userId: '',
    message: '',
  });

  const [warForm, setWarForm] = useState({
    targetClanId: '',
    name: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    rewards: {
      winner: 1000,
      loser: 100,
    },
  });

  useEffect(() => {
    if (searchQuery.length > 2) {
      const timeoutId = setTimeout(() => {
        searchClans(searchQuery).then(setSearchResults);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, searchClans]);

  useEffect(() => {
    if (activeTab === 'discover') {
      getTopClans(10).then(setTopClans);
    }
  }, [activeTab, getTopClans]);

  const handleCreateClan = async () => {
    await createClan(clanForm);
    setShowCreateClan(false);
    setClanForm({
      name: '',
      tag: '',
      description: '',
      isPublic: true,
      requirements: {
        minRank: 'bronze',
        minTerritories: 0,
        minWins: 0,
      },
    });
  };

  const handleInvitePlayer = async () => {
    await invitePlayer(inviteForm.userId, inviteForm.message);
    setShowInvitePlayer(false);
    setInviteForm({ userId: '', message: '' });
  };

  const handleDeclareWar = async () => {
    await declareWar(warForm.targetClanId, {
      name: warForm.name,
      description: warForm.description,
      startDate: warForm.startDate,
      endDate: warForm.endDate,
      rewards: warForm.rewards,
    });
    setShowDeclareWar(false);
    setWarForm({
      targetClanId: '',
      name: '',
      description: '',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      rewards: { winner: 1000, loser: 100 },
    });
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {!userClan ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h3 className="text-xl font-semibold mb-4">No Clan</h3>
          <p className="text-gray-600 mb-4">You're not part of any clan yet.</p>
          <button
            onClick={() => setShowCreateClan(true)}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Create Clan
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <img
                  src={userClan.avatar}
                  alt={userClan.name}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <h2 className="text-2xl font-bold">{userClan.name}</h2>
                  <p className="text-gray-600">
                    [{userClan.tag}] • Level {userClan.level}
                  </p>
                </div>
              </div>
              {canManageClan() && (
                <button
                  onClick={() => setShowInvitePlayer(true)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Invite Player
                </button>
              )}
            </div>

            <p className="text-gray-700 mb-4">{userClan.description}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded">
                <p className="text-2xl font-bold text-blue-600">
                  {userClan.memberCount}
                </p>
                <p className="text-sm text-gray-600">Members</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <p className="text-2xl font-bold text-green-600">
                  {userClan.territoryCount}
                </p>
                <p className="text-sm text-gray-600">Territories</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <p className="text-2xl font-bold text-purple-600">
                  {userClan.totalWins}
                </p>
                <p className="text-sm text-gray-600">Wins</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <p className="text-2xl font-bold text-orange-600">
                  {Math.round(userClan.winRate * 100)}%
                </p>
                <p className="text-sm text-gray-600">Win Rate</p>
              </div>
            </div>
          </div>

          {clanInvites.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">
                Pending Invites ({clanInvites.length})
              </h3>
              <div className="space-y-2">
                {clanInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div>
                      <p className="font-medium">{invite.clanName}</p>
                      <p className="text-sm text-gray-600">
                        Invited by {invite.inviterName}
                      </p>
                      {invite.message && (
                        <p className="text-sm text-gray-500 mt-1">
                          {invite.message}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => acceptClanInvite(invite.id)}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => declineClanInvite(invite.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderMembersTab = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          Members ({clanMembers.length})
        </h3>
        {canInviteMembers() && (
          <button
            onClick={() => setShowInvitePlayer(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Invite Player
          </button>
        )}
      </div>

      {loading.members ? (
        <div className="text-center py-4">Loading members...</div>
      ) : (
        <div className="space-y-2">
          {clanMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded"
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src={member.avatar}
                    alt={member.username}
                    className="w-10 h-10 rounded-full"
                  />
                  {member.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{member.username}</p>
                  <p className="text-sm text-gray-600">
                    {member.role} • {member.rank} • {member.territoryCount}{' '}
                    territories
                  </p>
                </div>
              </div>
              {canManageClan() && member.role !== 'leader' && (
                <div className="flex space-x-2">
                  {member.role === 'member' && (
                    <button
                      onClick={() => promoteMember(member.id, 'officer')}
                      className="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                    >
                      Promote
                    </button>
                  )}
                  <button
                    onClick={() => kickMember(member.id)}
                    className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    Kick
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderWarsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Active Wars</h3>
          {userClan && canManageClan() && (
            <button
              onClick={() => setShowDeclareWar(true)}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Declare War
            </button>
          )}
        </div>

        {loading.wars ? (
          <div className="text-center py-4">Loading wars...</div>
        ) : activeClanWars.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No active wars</div>
        ) : (
          <div className="space-y-4">
            {activeClanWars.map((war) => (
              <div key={war.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{war.name}</h4>
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      war.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : war.status === 'preparing'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {war.status}
                  </span>
                </div>
                <p className="text-gray-600 mb-3">{war.description}</p>

                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <p className="font-medium">{war.clan1Name}</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {war.clan1Score}
                    </p>
                  </div>
                  <div className="text-center text-gray-500">VS</div>
                  <div className="text-center">
                    <p className="font-medium">{war.clan2Name}</p>
                    <p className="text-2xl font-bold text-red-600">
                      {war.clan2Score}
                    </p>
                  </div>
                </div>

                <div className="mt-3 text-sm text-gray-500">
                  {new Date(war.startDate).toLocaleDateString()} -{' '}
                  {new Date(war.endDate).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderDiscoverTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Search Clans</h3>
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Search clans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setSearchQuery('')}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Clear
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {searchResults.map((clan) => (
              <div
                key={clan.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={clan.avatar}
                    alt={clan.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-medium">
                      {clan.name} [{clan.tag}]
                    </p>
                    <p className="text-sm text-gray-600">
                      {clan.memberCount} members • Level {clan.level}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    invitePlayer(clan.leaderId, `Join ${clan.name}!`)
                  }
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Request Join
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Top Clans</h3>
        <div className="space-y-2">
          {topClans.map((clan, index) => (
            <div
              key={clan.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg font-bold text-gray-400">
                  #{index + 1}
                </span>
                <img
                  src={clan.avatar}
                  alt={clan.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium">
                    {clan.name} [{clan.tag}]
                  </p>
                  <p className="text-sm text-gray-600">
                    {clan.memberCount} members •{' '}
                    {Math.round(clan.winRate * 100)}% win rate
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">
                  {clan.totalWins} wins
                </p>
                <p className="text-sm text-gray-500">
                  {clan.territoryCount} territories
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`bg-gray-100 rounded-lg p-6 ${className}`}>
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
          <button onClick={clearError} className="float-right font-bold">
            ×
          </button>
        </div>
      )}

      <div className="flex space-x-1 mb-6 bg-white rounded-lg p-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-blue-500 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'members'
              ? 'bg-blue-500 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Members
        </button>
        <button
          onClick={() => setActiveTab('wars')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'wars'
              ? 'bg-blue-500 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Wars
        </button>
        <button
          onClick={() => setActiveTab('discover')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'discover'
              ? 'bg-blue-500 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Discover
        </button>
      </div>

      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'members' && renderMembersTab()}
      {activeTab === 'wars' && renderWarsTab()}
      {activeTab === 'discover' && renderDiscoverTab()}

      {/* Modals */}
      {showCreateClan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create Clan</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Clan Name"
                value={clanForm.name}
                onChange={(e) =>
                  setClanForm({ ...clanForm, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Clan Tag (3-4 characters)"
                value={clanForm.tag}
                onChange={(e) =>
                  setClanForm({ ...clanForm, tag: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <textarea
                placeholder="Description"
                value={clanForm.description}
                onChange={(e) =>
                  setClanForm({ ...clanForm, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
              />
              <div className="flex space-x-4">
                <button
                  onClick={handleCreateClan}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreateClan(false)}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showInvitePlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Invite Player</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="User ID"
                value={inviteForm.userId}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, userId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <textarea
                placeholder="Message (optional)"
                value={inviteForm.message}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, message: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
              />
              <div className="flex space-x-4">
                <button
                  onClick={handleInvitePlayer}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Invite
                </button>
                <button
                  onClick={() => setShowInvitePlayer(false)}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeclareWar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Declare War</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Target Clan ID"
                value={warForm.targetClanId}
                onChange={(e) =>
                  setWarForm({ ...warForm, targetClanId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="War Name"
                value={warForm.name}
                onChange={(e) =>
                  setWarForm({ ...warForm, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <textarea
                placeholder="Description"
                value={warForm.description}
                onChange={(e) =>
                  setWarForm({ ...warForm, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
              />
              <div className="flex space-x-4">
                <button
                  onClick={handleDeclareWar}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Declare War
                </button>
                <button
                  onClick={() => setShowDeclareWar(false)}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
