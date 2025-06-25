import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { 
  UserGroupIcon, 
  ShieldCheckIcon, 
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  UserPlusIcon,
  UserMinusIcon,
  FireIcon,
  TrophyIcon,
  StarIcon,
  FlagIcon
} from '@heroicons/react/24/outline';
import SocialService, { 
  User, 
  Friendship, 
  Clan, 
  EnemyRelationship,
  Message 
} from '../../services/social/SocialService';
import { progressionService, StoryEvent } from '../../services/progression/ProgressionService';

interface SocialHubProps {
  className?: string;
}

export const SocialHub: React.FC<SocialHubProps> = ({ className = '' }) => {
  const [socialService] = useState(() => new SocialService());
  const [activeTab, setActiveTab] = useState(0);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [enemies, setEnemies] = useState<EnemyRelationship[]>([]);
  const [clans, setClans] = useState<Clan[]>([]);
  const [userClan, setUserClan] = useState<Clan | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Story-driven state
  const [storyContext, setStoryContext] = useState(progressionService.getStoryContext());
  const [recentStoryEvents, setRecentStoryEvents] = useState<StoryEvent[]>([]);
  const [activeRivals, setActiveRivals] = useState<string[]>([]);
  const [clanDynamics, setClanDynamics] = useState<{
    territory: string[];
    allies: string[];
    enemies: string[];
    currentWar?: string;
  }>({
    territory: ['Downtown Dojo', 'Elite Pool Hall'],
    allies: ['Dragon Warriors'],
    enemies: ['Shadow Clan', 'Iron Fist'],
    currentWar: 'Shadow Clan'
  });

  useEffect(() => {
    loadSocialData();
    loadStoryContext();
    setupEventListeners();
  }, []);

  const loadStoryContext = () => {
    setStoryContext(progressionService.getStoryContext());
    setRecentStoryEvents(progressionService.getEvents().slice(0, 5));
    setActiveRivals(storyContext.activeRivals);
  };

  const setupEventListeners = () => {
    socialService.on('friend_request', handleFriendRequest);
    socialService.on('friend_accepted', handleFriendAccepted);
    socialService.on('friend_rejected', handleFriendRejected);
    socialService.on('enemy_added', handleEnemyAdded);
    socialService.on('clan_update', handleClanUpdate);
    socialService.on('message_received', handleMessageReceived);
    
    // Story-driven event listeners
    progressionService.on('eventAdded', handleStoryEventAdded);
    progressionService.on('objectiveCompleted', handleObjectiveCompleted);
  };

  const loadSocialData = async () => {
    setLoading(true);
    try {
      const [friendsData, enemiesData, clansData] = await Promise.all([
        socialService.getFriends(),
        socialService.getEnemies(),
        socialService.getClans()
      ]);

      setFriends(friendsData);
      setEnemies(enemiesData);
      setClans(clansData);

      // Check if user is in a clan
      const userClanData = clansData.find(clan => 
        clan.members?.some(member => member.user_id === getCurrentUserId())
      );
      setUserClan(userClanData || null);
    } catch (err) {
      setError('Failed to load social data');
      console.error('Error loading social data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUserId = (): number => {
    // This should come from your auth context
    return 1; // Placeholder
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await socialService.searchUsers(searchQuery);
      setSearchResults(results);
    } catch (err) {
      setError('Failed to search users');
      console.error('Error searching users:', err);
    }
  };

  const handleSendFriendRequest = async (userId: number) => {
    try {
      const result = await socialService.sendFriendRequest(userId);
      if (result.success) {
        setSearchResults(prev => prev.filter(user => user.id !== userId));
        // Refresh friends list
        const updatedFriends = await socialService.getFriends();
        setFriends(updatedFriends);
        
        // Add story event for new friendship
        progressionService.addEvent({
          id: `friend_request_${userId}`,
          title: 'New Friendship Opportunity',
          description: `You've sent a friend request to a potential ally. Strong friendships can help in clan wars and tournaments.`,
          type: 'clan',
          timestamp: new Date().toISOString(),
          isRead: false,
          impact: {
            reputation: 5
          }
        });
      } else {
        setError(result.message || 'Failed to send friend request');
      }
    } catch (err) {
      setError('Failed to send friend request');
      console.error('Error sending friend request:', err);
    }
  };

  const handleAcceptFriendRequest = async (friendshipId: number) => {
    try {
      const result = await socialService.acceptFriendRequest(friendshipId);
      if (result.success) {
        await loadSocialData();
        
        // Add story event for accepted friendship
        progressionService.addEvent({
          id: `friend_accepted_${friendshipId}`,
          title: 'New Ally Joined',
          description: `A new ally has joined your circle. Together you can face greater challenges and support each other in tournaments.`,
          type: 'clan',
          timestamp: new Date().toISOString(),
          isRead: false,
          impact: {
            reputation: 10,
            clanPrestige: 15
          }
        });
      } else {
        setError(result.message || 'Failed to accept friend request');
      }
    } catch (err) {
      setError('Failed to accept friend request');
      console.error('Error accepting friend request:', err);
    }
  };

  const handleRejectFriendRequest = async (friendshipId: number) => {
    try {
      const result = await socialService.rejectFriendRequest(friendshipId);
      if (result.success) {
        await loadSocialData();
      } else {
        setError(result.message || 'Failed to reject friend request');
      }
    } catch (err) {
      setError('Failed to reject friend request');
      console.error('Error rejecting friend request:', err);
    }
  };

  const handleAddEnemy = async (userId: number, reason?: string) => {
    try {
      const result = await socialService.addEnemy(userId, reason);
      if (result.success) {
        await loadSocialData();
        
        // Add story event for new rival
        progressionService.addEvent({
          id: `enemy_added_${userId}`,
          title: 'New Rival Emerges',
          description: `A new rival has entered your story. Rivalries create intense matches and drive you to improve your skills.`,
          type: 'rival',
          timestamp: new Date().toISOString(),
          isRead: false,
          impact: {
            reputation: 5
          }
        });
      } else {
        setError(result.message || 'Failed to add enemy');
      }
    } catch (err) {
      setError('Failed to add enemy');
      console.error('Error adding enemy:', err);
    }
  };

  const handleJoinClan = async (clanId: number) => {
    try {
      const result = await socialService.joinClan(clanId);
      if (result.success) {
        await loadSocialData();
        
        // Add story event for clan joining
        progressionService.addEvent({
          id: `clan_joined_${clanId}`,
          title: 'Clan Membership',
          description: `You've joined a clan! Clans provide support, territory control, and access to special tournaments.`,
          type: 'clan',
          timestamp: new Date().toISOString(),
          isRead: false,
          impact: {
            clanPrestige: 25
          }
        });
      } else {
        setError(result.message || 'Failed to join clan');
      }
    } catch (err) {
      setError('Failed to join clan');
      console.error('Error joining clan:', err);
    }
  };

  // Story-driven event handlers
  const handleStoryEventAdded = (event: StoryEvent) => {
    setRecentStoryEvents(prev => [event, ...prev.slice(0, 4)]);
  };

  const handleObjectiveCompleted = (objective: any) => {
    // Update story context when objectives are completed
    setStoryContext(progressionService.getStoryContext());
  };

  // Event handlers
  const handleFriendRequest = (data: any) => {
    loadSocialData();
  };

  const handleFriendAccepted = (data: any) => {
    loadSocialData();
  };

  const handleFriendRejected = (data: any) => {
    loadSocialData();
  };

  const handleEnemyAdded = (data: any) => {
    loadSocialData();
  };

  const handleClanUpdate = (data: any) => {
    loadSocialData();
  };

  const handleMessageReceived = (data: any) => {
    // Handle new message notification
    console.log('New message received:', data);
  };

  const tabs = [
    { name: 'Friends', icon: UserGroupIcon, count: friends.length },
    { name: 'Clans', icon: ShieldCheckIcon, count: clans.length },
    { name: 'Enemies', icon: ExclamationTriangleIcon, count: enemies.length },
    { name: 'Messages', icon: ChatBubbleLeftRightIcon, count: 0 },
    { name: 'Search', icon: MagnifyingGlassIcon, count: searchResults.length },
    { name: 'Story', icon: StarIcon, count: recentStoryEvents.filter(e => !e.isRead).length }
  ];

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Social Hub</h2>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Dismiss
            </button>
          </div>
        )}

        <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700
                   ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2
                   ${selected
                     ? 'bg-white shadow'
                     : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                   }`
                }
              >
                <div className="flex items-center justify-center space-x-2">
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                  {tab.count > 0 && (
                    <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                      {tab.count}
                    </span>
                  )}
                </div>
              </Tab>
            ))}
          </Tab.List>
          
          <Tab.Panels className="mt-6">
            {/* Friends Panel */}
            <Tab.Panel>
              <FriendsPanel 
                friends={friends}
                onAcceptRequest={handleAcceptFriendRequest}
                onRejectRequest={handleRejectFriendRequest}
                loading={loading}
              />
            </Tab.Panel>

            {/* Clans Panel */}
            <Tab.Panel>
              <ClansPanel 
                clans={clans}
                userClan={userClan}
                onJoinClan={handleJoinClan}
                loading={loading}
              />
            </Tab.Panel>

            {/* Enemies Panel */}
            <Tab.Panel>
              <EnemiesPanel 
                enemies={enemies}
                onAddEnemy={handleAddEnemy}
                loading={loading}
              />
            </Tab.Panel>

            {/* Messages Panel */}
            <Tab.Panel>
              <MessagesPanel loading={loading} />
            </Tab.Panel>

            {/* Search Panel */}
            <Tab.Panel>
              <SearchPanel 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searchResults={searchResults}
                onSearch={handleSearch}
                onSendFriendRequest={handleSendFriendRequest}
                onAddEnemy={handleAddEnemy}
                loading={loading}
              />
            </Tab.Panel>

            {/* Story Panel */}
            <Tab.Panel>
              <StoryPanel 
                storyContext={storyContext}
                recentEvents={recentStoryEvents}
                activeRivals={activeRivals}
                clanDynamics={clanDynamics}
                loading={loading}
              />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

// Friends Panel Component
interface FriendsPanelProps {
  friends: Friendship[];
  onAcceptRequest: (friendshipId: number) => void;
  onRejectRequest: (friendshipId: number) => void;
  loading: boolean;
}

const FriendsPanel: React.FC<FriendsPanelProps> = ({ 
  friends, 
  onAcceptRequest, 
  onRejectRequest, 
  loading 
}) => {
  const pendingRequests = friends.filter(f => f.status === 'pending');
  const acceptedFriends = friends.filter(f => f.status === 'accepted');

  if (loading) {
    return <div className="text-center py-8">Loading friends...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Requests</h3>
          <div className="space-y-3">
            {pendingRequests.map((friendship) => (
              <div key={friendship.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {friendship.sender.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{friendship.sender.username}</p>
                    <p className="text-sm text-gray-500">Wants to be your friend</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onAcceptRequest(friendship.id)}
                    className="px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => onRejectRequest(friendship.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accepted Friends */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Friends ({acceptedFriends.length})</h3>
        {acceptedFriends.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No friends yet. Search for users to add friends!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {acceptedFriends.map((friendship) => (
              <div key={friendship.id} className="p-4 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {friendship.sender.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{friendship.sender.username}</p>
                    <p className="text-sm text-gray-500">Friend since {new Date(friendship.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Clans Panel Component
interface ClansPanelProps {
  clans: Clan[];
  userClan: Clan | null;
  onJoinClan: (clanId: number) => void;
  loading: boolean;
}

const ClansPanel: React.FC<ClansPanelProps> = ({ clans, userClan, onJoinClan, loading }) => {
  if (loading) {
    return <div className="text-center py-8">Loading clans...</div>;
  }

  return (
    <div className="space-y-6">
      {/* User's Clan */}
      {userClan && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Clan</h3>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-blue-900">{userClan.name} [{userClan.tag}]</h4>
                <p className="text-blue-700">{userClan.description}</p>
                <p className="text-sm text-blue-600">{userClan.member_count} members</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {userClan.rank}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Available Clans */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Clans</h3>
        {clans.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No clans available</p>
        ) : (
          <div className="space-y-4">
            {clans.map((clan) => (
              <div key={clan.id} className="p-4 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{clan.name} [{clan.tag}]</h4>
                    <p className="text-gray-600">{clan.description}</p>
                    <p className="text-sm text-gray-500">{clan.member_count} members</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                      {clan.rank}
                    </span>
                    {!userClan && (
                      <button
                        onClick={() => onJoinClan(clan.id)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
                      >
                        Join
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Enemies Panel Component
interface EnemiesPanelProps {
  enemies: EnemyRelationship[];
  onAddEnemy: (userId: number, reason?: string) => void;
  loading: boolean;
}

const EnemiesPanel: React.FC<EnemiesPanelProps> = ({ enemies, onAddEnemy, loading }) => {
  if (loading) {
    return <div className="text-center py-8">Loading enemies...</div>;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Enemies ({enemies.length})</h3>
      
      {enemies.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No enemies yet.</p>
      ) : (
        <div className="space-y-4">
          {enemies.map((enemy) => (
            <div key={enemy.id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {enemy.enemy.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-red-900">{enemy.enemy.username}</p>
                    {enemy.reason && (
                      <p className="text-sm text-red-700">Reason: {enemy.reason}</p>
                    )}
                    <p className="text-xs text-red-600">
                      Added {new Date(enemy.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Messages Panel Component
interface MessagesPanelProps {
  loading: boolean;
}

const MessagesPanel: React.FC<MessagesPanelProps> = ({ loading }) => {
  if (loading) {
    return <div className="text-center py-8">Loading messages...</div>;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Messages</h3>
      <p className="text-gray-500 text-center py-8">Messages feature coming soon!</p>
    </div>
  );
};

// Search Panel Component
interface SearchPanelProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: User[];
  onSearch: () => void;
  onSendFriendRequest: (userId: number) => void;
  onAddEnemy: (userId: number, reason?: string) => void;
  loading: boolean;
}

const SearchPanel: React.FC<SearchPanelProps> = ({
  searchQuery,
  setSearchQuery,
  searchResults,
  onSearch,
  onSendFriendRequest,
  onAddEnemy,
  loading
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Users</h3>
        <div className="flex space-x-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
          />
          <button
            onClick={onSearch}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Search
          </button>
        </div>
      </div>

      {searchResults.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Search Results</h4>
          <div className="space-y-3">
            {searchResults.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user.username}</p>
                    {user.bio && <p className="text-sm text-gray-500">{user.bio}</p>}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onSendFriendRequest(user.id)}
                    className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
                  >
                    <UserPlusIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onAddEnemy(user.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
                  >
                    <UserMinusIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Story Panel Component
interface StoryPanelProps {
  storyContext: any;
  recentEvents: StoryEvent[];
  activeRivals: string[];
  clanDynamics: any;
  loading: boolean;
}

const StoryPanel: React.FC<StoryPanelProps> = ({ 
  storyContext, 
  recentEvents, 
  activeRivals, 
  clanDynamics, 
  loading 
}) => {
  if (loading) {
    return <div className="text-center py-8">Loading story...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Current Chapter */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
        <h3 className="text-lg font-semibold text-purple-900 mb-2">Current Chapter</h3>
        <h4 className="text-xl font-bold text-purple-800 mb-2">{storyContext.currentChapter}</h4>
        <p className="text-purple-700">{storyContext.mainPlot}</p>
      </div>

      {/* Active Rivals */}
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-semibold text-red-900 mb-3 flex items-center">
          <FireIcon className="h-5 w-5 mr-2" />
          Active Rivals
        </h3>
        <div className="space-y-2">
          {activeRivals.map((rival, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-red-100 rounded">
              <span className="font-medium text-red-800">{rival}</span>
              <span className="text-xs text-red-600">Rival #{index + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Clan Status */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
          <ShieldCheckIcon className="h-5 w-5 mr-2" />
          Clan Status
        </h3>
        <p className="text-blue-800 mb-3">{storyContext.clanStatus}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-blue-100 rounded">
            <h4 className="font-medium text-blue-900 mb-1">Territory</h4>
            <div className="space-y-1">
              {clanDynamics.territory.map((venue: string, index: number) => (
                <div key={index} className="text-sm text-blue-700 flex items-center">
                  <FlagIcon className="h-3 w-3 mr-1" />
                  {venue}
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-3 bg-green-100 rounded">
            <h4 className="font-medium text-green-900 mb-1">Allies</h4>
            <div className="space-y-1">
              {clanDynamics.allies.map((ally: string, index: number) => (
                <div key={index} className="text-sm text-green-700 flex items-center">
                  <UserGroupIcon className="h-3 w-3 mr-1" />
                  {ally}
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-3 bg-red-100 rounded">
            <h4 className="font-medium text-red-900 mb-1">Enemies</h4>
            <div className="space-y-1">
              {clanDynamics.enemies.map((enemy: string, index: number) => (
                <div key={index} className="text-sm text-red-700 flex items-center">
                  <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                  {enemy}
                </div>
              ))}
            </div>
          </div>
        </div>

        {clanDynamics.currentWar && (
          <div className="mt-3 p-3 bg-orange-100 border border-orange-200 rounded">
            <h4 className="font-medium text-orange-900 mb-1">Current War</h4>
            <p className="text-sm text-orange-800">At war with {clanDynamics.currentWar}</p>
          </div>
        )}
      </div>

      {/* Recent Story Events */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-900 mb-3 flex items-center">
          <StarIcon className="h-5 w-5 mr-2" />
          Recent Story Events
        </h3>
        <div className="space-y-3">
          {recentEvents.length === 0 ? (
            <p className="text-yellow-700 text-center py-4">No recent story events</p>
          ) : (
            recentEvents.map((event) => (
              <div 
                key={event.id} 
                className={`p-3 rounded-lg border ${
                  event.isRead 
                    ? 'bg-yellow-100 border-yellow-200' 
                    : 'bg-yellow-200 border-yellow-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-yellow-900 mb-1">{event.title}</h4>
                    <p className="text-sm text-yellow-800 mb-2">{event.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-yellow-700">
                      <span className="flex items-center">
                        {event.type === 'rival' && <FireIcon className="h-3 w-3 mr-1" />}
                        {event.type === 'tournament' && <TrophyIcon className="h-3 w-3 mr-1" />}
                        {event.type === 'clan' && <ShieldCheckIcon className="h-3 w-3 mr-1" />}
                        {event.type === 'achievement' && <StarIcon className="h-3 w-3 mr-1" />}
                        {event.type === 'venue' && <FlagIcon className="h-3 w-3 mr-1" />}
                        {event.type}
                      </span>
                      <span>{event.timestamp}</span>
                      {!event.isRead && (
                        <span className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs">
                          NEW
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Next Major Event */}
      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
        <h3 className="text-lg font-semibold text-indigo-900 mb-2">Next Major Event</h3>
        <p className="text-indigo-800 font-medium">{storyContext.nextMajorEvent}</p>
        <p className="text-sm text-indigo-700 mt-1">Prepare yourself for this upcoming challenge!</p>
      </div>
    </div>
  );
};

export default SocialHub; 