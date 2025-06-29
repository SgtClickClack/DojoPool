import React, { useState, useEffect } from 'react';
import { useAdvancedSocialCommunity } from '../../hooks/useAdvancedSocialCommunity';
import { 
  SocialPost, 
  CommunityLeaderboard, 
  SocialMediaIntegration, 
  CommunityModeration, 
  SocialAnalytics, 
  CommunityEvent 
} from '../../hooks/useAdvancedSocialCommunity';

interface TabProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const Tab: React.FC<TabProps> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 font-medium rounded-lg transition-colors ${
      active 
        ? 'bg-blue-600 text-white' 
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    {children}
  </button>
);

const AdvancedSocialCommunityDashboard: React.FC = () => {
  const {
    posts,
    loadingPosts,
    createPost,
    likePost,
    commentOnPost,
    sharePost,
    leaderboards,
    loadingLeaderboards,
    getLeaderboard,
    socialMediaIntegrations,
    loadingIntegrations,
    connectSocialMedia,
    autoPostToSocialMedia,
    moderationCases,
    loadingModeration,
    reportUser,
    resolveModerationCase,
    analytics,
    loadingAnalytics,
    getAnalytics,
    events,
    loadingEvents,
    createEvent,
    registerForEvent,
    isConnected,
    error
  } = useAdvancedSocialCommunity();

  const [activeTab, setActiveTab] = useState('posts');
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('user-1');
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Load analytics when user changes
  useEffect(() => {
    if (selectedUserId) {
      getAnalytics(selectedUserId, analyticsPeriod);
    }
  }, [selectedUserId, analyticsPeriod, getAnalytics]);

  const handleCreatePost = async () => {
    if (newPostContent.trim()) {
      await createPost({
        userId: selectedUserId,
        content: newPostContent,
        hashtags: newPostContent.match(/#\w+/g) || [],
        mentions: newPostContent.match(/@\w+/g) || [],
        isPublic: true
      });
      setNewPostContent('');
    }
  };

  const handleLikePost = async (postId: string) => {
    await likePost(postId, selectedUserId);
  };

  const handleComment = async (postId: string) => {
    const comment = prompt('Enter your comment:');
    if (comment) {
      await commentOnPost(postId, selectedUserId, comment);
    }
  };

  const handleShare = async (postId: string) => {
    await sharePost(postId, selectedUserId);
  };

  const handleConnectSocialMedia = async () => {
    const platform = prompt('Enter platform (twitter/instagram/facebook/youtube/tiktok):') as any;
    if (platform) {
      await connectSocialMedia({
        platform,
        userId: selectedUserId,
        externalUserId: 'external-user-id',
        accessToken: 'access-token',
        isActive: true,
        syncSettings: {
          autoPost: true,
          autoShare: true,
          crossPost: false
        }
      });
    }
  };

  const handleAutoPost = async () => {
    const content = prompt('Enter content to post:');
    if (content) {
      const platforms = ['twitter', 'instagram'] as const;
      await autoPostToSocialMedia(selectedUserId, content, platforms);
    }
  };

  const handleReportUser = async () => {
    const targetUserId = prompt('Enter target user ID:');
    const reason = prompt('Enter reason for report:');
    if (targetUserId && reason) {
      await reportUser({
        type: 'report',
        targetUserId,
        reporterId: selectedUserId,
        reason
      });
    }
  };

  const handleCreateEvent = async () => {
    const title = prompt('Enter event title:');
    const description = prompt('Enter event description:');
    if (title && description) {
      await createEvent({
        title,
        description,
        organizerId: selectedUserId,
        type: 'tournament',
        location: 'The Jade Tiger',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        maxParticipants: 32,
        isFeatured: true,
        isPublic: true,
        registrationDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        tags: ['tournament', 'championship']
      });
    }
  };

  const renderPostsTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Create New Post</h3>
        <div className="space-y-4">
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="What's happening in the DojoPool world?"
            className="w-full p-3 border border-gray-300 rounded-lg resize-none"
            rows={3}
          />
          <button
            onClick={handleCreatePost}
            disabled={loadingPosts}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loadingPosts ? 'Creating...' : 'Create Post'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Recent Posts</h3>
        {posts.map((post) => (
          <div key={post.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium">User {post.userId}</p>
                <p className="text-sm text-gray-500">
                  {new Date(post.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="text-sm text-gray-500">
                Score: {post.engagementScore}
              </div>
            </div>
            
            <p className="mb-4">{post.content}</p>
            
            {post.hashtags && post.hashtags.length > 0 && (
              <div className="mb-4">
                {post.hashtags.map((tag, index) => (
                  <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2 text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex space-x-4">
                <button
                  onClick={() => handleLikePost(post.id)}
                  className="flex items-center space-x-1 text-gray-600 hover:text-red-500"
                >
                  <span>❤️</span>
                  <span>{post.likes.length}</span>
                </button>
                <button
                  onClick={() => handleComment(post.id)}
                  className="flex items-center space-x-1 text-gray-600 hover:text-blue-500"
                >
                  <span>💬</span>
                  <span>{post.comments.length}</span>
                </button>
                <button
                  onClick={() => handleShare(post.id)}
                  className="flex items-center space-x-1 text-gray-600 hover:text-green-500"
                >
                  <span>📤</span>
                  <span>{post.shares}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLeaderboardsTab = () => (
    <div className="space-y-6">
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => getLeaderboard('weekly', 'engagement')}
          disabled={loadingLeaderboards}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loadingLeaderboards ? 'Loading...' : 'Load Weekly Engagement'}
        </button>
      </div>

      {leaderboards.map((leaderboard) => (
        <div key={leaderboard.id} className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            {leaderboard.type.charAt(0).toUpperCase() + leaderboard.type.slice(1)} {leaderboard.category} Leaderboard
          </h3>
          
          <div className="space-y-2">
            {leaderboard.entries.map((entry) => (
              <div key={entry.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center space-x-4">
                  <span className="font-bold text-lg">#{entry.rank}</span>
                  <span className="font-medium">User {entry.userId}</span>
                  <span className="text-sm text-gray-500">
                    {entry.previousRank && entry.previousRank !== entry.rank && (
                      <span className={entry.change > 0 ? 'text-green-500' : 'text-red-500'}>
                        {entry.change > 0 ? '↗' : '↘'} {Math.abs(entry.change)}
                      </span>
                    )}
                  </span>
                </div>
                <span className="font-semibold">{entry.score} pts</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderSocialMediaTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Social Media Integration</h3>
        <div className="space-y-4">
          <button
            onClick={handleConnectSocialMedia}
            disabled={loadingIntegrations}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loadingIntegrations ? 'Connecting...' : 'Connect Social Media'}
          </button>
          
          <button
            onClick={handleAutoPost}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Auto Post to Social Media
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Connected Accounts</h3>
        {socialMediaIntegrations.map((integration) => (
          <div key={`${integration.userId}-${integration.platform}`} className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium capitalize">{integration.platform}</p>
                <p className="text-sm text-gray-500">User {integration.userId}</p>
                <p className="text-sm text-gray-500">
                  Last sync: {new Date(integration.lastSync).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`w-3 h-3 rounded-full ${integration.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-sm">{integration.isActive ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderModerationTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Community Moderation</h3>
        <button
          onClick={handleReportUser}
          disabled={loadingModeration}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {loadingModeration ? 'Processing...' : 'Report User'}
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Moderation Cases</h3>
        {moderationCases.map((case_) => (
          <div key={case_.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium">Case #{case_.id}</p>
                <p className="text-sm text-gray-500">
                  {case_.type} - {case_.status}
                </p>
              </div>
              <span className={`px-2 py-1 rounded text-sm ${
                case_.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                case_.status === 'resolved' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {case_.status}
              </span>
            </div>
            <p className="text-sm mb-2">Target: User {case_.targetUserId}</p>
            <p className="text-sm text-gray-600">{case_.reason}</p>
            {case_.action && (
              <p className="text-sm text-gray-600 mt-2">Action: {case_.action}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Social Analytics</h3>
        <div className="flex space-x-4 mb-4">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="user-1">User 1</option>
            <option value="user-2">User 2</option>
            <option value="user-3">User 3</option>
          </select>
          
          <select
            value={analyticsPeriod}
            onChange={(e) => setAnalyticsPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h4 className="font-semibold mb-4">Engagement Metrics</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Posts Created:</span>
                <span className="font-medium">{analytics.metrics.postsCreated}</span>
              </div>
              <div className="flex justify-between">
                <span>Comments Made:</span>
                <span className="font-medium">{analytics.metrics.commentsMade}</span>
              </div>
              <div className="flex justify-between">
                <span>Likes Given:</span>
                <span className="font-medium">{analytics.metrics.likesGiven}</span>
              </div>
              <div className="flex justify-between">
                <span>Shares Made:</span>
                <span className="font-medium">{analytics.metrics.sharesMade}</span>
              </div>
              <div className="flex justify-between">
                <span>Engagement Received:</span>
                <span className="font-medium">{analytics.metrics.engagementReceived}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h4 className="font-semibold mb-4">Growth Trends</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Engagement Growth:</span>
                <span className={`font-medium ${analytics.trends.engagementGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.trends.engagementGrowth >= 0 ? '+' : ''}{analytics.trends.engagementGrowth}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Follower Growth:</span>
                <span className={`font-medium ${analytics.trends.followerGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.trends.followerGrowth >= 0 ? '+' : ''}{analytics.trends.followerGrowth}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Reputation Growth:</span>
                <span className={`font-medium ${analytics.trends.reputationGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.trends.reputationGrowth >= 0 ? '+' : ''}{analytics.trends.reputationGrowth}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Activity Level:</span>
                <span className={`font-medium px-2 py-1 rounded text-sm ${
                  analytics.trends.activityLevel === 'high' ? 'bg-green-100 text-green-800' :
                  analytics.trends.activityLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {analytics.trends.activityLevel}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderEventsTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Community Events</h3>
        <button
          onClick={handleCreateEvent}
          disabled={loadingEvents}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {loadingEvents ? 'Creating...' : 'Create Event'}
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Upcoming Events</h3>
        {events.map((event) => (
          <div key={event.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold text-lg">{event.title}</h4>
                <p className="text-sm text-gray-500 capitalize">{event.type}</p>
              </div>
              {event.isFeatured && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                  Featured
                </span>
              )}
            </div>
            
            <p className="text-gray-600 mb-4">{event.description}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">{event.location}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-medium">{new Date(event.startDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Participants</p>
                <p className="font-medium">{event.participants.length}/{event.maxParticipants}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Engagement Score</p>
                <p className="font-medium">{event.engagementMetrics.engagementScore}</p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => registerForEvent(event.id, selectedUserId)}
                disabled={event.participants.includes(selectedUserId)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {event.participants.includes(selectedUserId) ? 'Registered' : 'Register'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🔌</div>
          <h2 className="text-xl font-semibold mb-2">Service Unavailable</h2>
          <p className="text-gray-600">Advanced Social Community Service is not connected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Advanced Social Community & Engagement Dashboard
        </h1>
        <p className="text-gray-600">
          Comprehensive social networking, community management, and engagement tracking
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="flex space-x-2 mb-6 overflow-x-auto">
        <Tab active={activeTab === 'posts'} onClick={() => setActiveTab('posts')}>
          📝 Posts
        </Tab>
        <Tab active={activeTab === 'leaderboards'} onClick={() => setActiveTab('leaderboards')}>
          🏆 Leaderboards
        </Tab>
        <Tab active={activeTab === 'social-media'} onClick={() => setActiveTab('social-media')}>
          📱 Social Media
        </Tab>
        <Tab active={activeTab === 'moderation'} onClick={() => setActiveTab('moderation')}>
          🛡️ Moderation
        </Tab>
        <Tab active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')}>
          📊 Analytics
        </Tab>
        <Tab active={activeTab === 'events'} onClick={() => setActiveTab('events')}>
          🎉 Events
        </Tab>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        {activeTab === 'posts' && renderPostsTab()}
        {activeTab === 'leaderboards' && renderLeaderboardsTab()}
        {activeTab === 'social-media' && renderSocialMediaTab()}
        {activeTab === 'moderation' && renderModerationTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
        {activeTab === 'events' && renderEventsTab()}
      </div>
    </div>
  );
};

export default AdvancedSocialCommunityDashboard; 