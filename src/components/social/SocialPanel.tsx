import React, { useState, useEffect } from 'react';
import { useSocialFeatures } from '../../hooks/useSocialFeatures';
import { Friend, Message, ActivityFeedItem } from '../../services/social/SocialFeaturesService';

interface SocialPanelProps {
  className?: string;
}

export const SocialPanel: React.FC<SocialPanelProps> = ({ className = '' }) => {
  const {
    friends,
    messages,
    activityFeed,
    currentChat,
    loading,
    error,
    loadFriends,
    sendFriendRequest,
    removeFriend,
    loadMessages,
    sendMessage,
    markMessageAsRead,
    setCurrentChat,
    loadActivityFeed,
    likeActivity,
    commentOnActivity,
    searchUsers,
    getUnreadMessageCount,
    getOnlineFriends,
    clearError
  } = useSocialFeatures();

  const [activeTab, setActiveTab] = useState<'friends' | 'messages' | 'activity'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newComment, setNewComment] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);

  useEffect(() => {
    if (searchQuery.length > 2) {
      const timeoutId = setTimeout(() => {
        searchUsers(searchQuery).then(setSearchResults);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, searchUsers]);

  const handleSendMessage = async () => {
    if (newMessage.trim() && currentChat) {
      await sendMessage(currentChat, newMessage.trim());
      setNewMessage('');
    }
  };

  const handleSendComment = async () => {
    if (newComment.trim() && selectedActivity) {
      await commentOnActivity(selectedActivity, newComment.trim());
      setNewComment('');
      setSelectedActivity(null);
    }
  };

  const renderFriendsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <input
          type="text"
          placeholder="Search users..."
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
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-3">Search Results</h3>
          <div className="space-y-2">
            {searchResults.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full" />
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-sm text-gray-500">{user.rank}</p>
                  </div>
                </div>
                <button
                  onClick={() => sendFriendRequest(user.id)}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add Friend
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-3">Friends ({friends.length})</h3>
        {loading.friends ? (
          <div className="text-center py-4">Loading friends...</div>
        ) : friends.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No friends yet</div>
        ) : (
          <div className="space-y-2">
            {friends.map((friend) => (
              <div key={friend.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img src={friend.avatar} alt={friend.username} className="w-8 h-8 rounded-full" />
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${
                      friend.status === 'online' ? 'bg-green-500' : 
                      friend.status === 'in-game' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium">{friend.username}</p>
                    <p className="text-sm text-gray-500">{friend.rank} • {friend.territoryCount} territories</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setCurrentChat(friend.id);
                      setActiveTab('messages');
                    }}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Message
                  </button>
                  <button
                    onClick={() => removeFriend(friend.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderMessagesTab = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-3">Messages</h3>
        {currentChat ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
              <img 
                src={friends.find(f => f.id === currentChat)?.avatar} 
                alt="Avatar" 
                className="w-8 h-8 rounded-full" 
              />
              <span className="font-medium">
                {friends.find(f => f.id === currentChat)?.username}
              </span>
            </div>
            
            <div className="h-64 overflow-y-auto space-y-2 p-2 bg-gray-50 rounded">
              {messages
                .filter(m => m.senderId === currentChat || m.receiverId === currentChat)
                .map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === currentChat ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-xs px-3 py-2 rounded-lg ${
                      message.senderId === currentChat 
                        ? 'bg-white border' 
                        : 'bg-blue-500 text-white'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
            
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSendMessage}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            Select a friend to start messaging
          </div>
        )}
      </div>
    </div>
  );

  const renderActivityTab = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-3">Activity Feed</h3>
        {loading.activity ? (
          <div className="text-center py-4">Loading activity...</div>
        ) : activityFeed.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No activity yet</div>
        ) : (
          <div className="space-y-4">
            {activityFeed.map((activity) => (
              <div key={activity.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <img src={activity.avatar} alt={activity.username} className="w-8 h-8 rounded-full" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{activity.username}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{activity.content}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <button
                        onClick={() => likeActivity(activity.id)}
                        className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-500"
                      >
                        <span>👍</span>
                        <span>{activity.likes}</span>
                      </button>
                      <button
                        onClick={() => setSelectedActivity(activity.id)}
                        className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-500"
                      >
                        <span>💬</span>
                        <span>{activity.comments}</span>
                      </button>
                    </div>
                    
                    {selectedActivity === activity.id && (
                      <div className="mt-3 p-2 bg-white rounded border">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
                          placeholder="Write a comment..."
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <div className="flex justify-end space-x-2 mt-2">
                          <button
                            onClick={() => {
                              setSelectedActivity(null);
                              setNewComment('');
                            }}
                            className="px-2 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSendComment}
                            className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            Comment
                          </button>
                        </div>
                      </div>
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

  return (
    <div className={`bg-gray-100 rounded-lg p-6 ${className}`}>
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
          <button onClick={clearError} className="float-right font-bold">×</button>
        </div>
      )}

      <div className="flex space-x-1 mb-6 bg-white rounded-lg p-1">
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'friends' 
              ? 'bg-blue-500 text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Friends ({friends.length})
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'messages' 
              ? 'bg-blue-500 text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Messages ({getUnreadMessageCount()})
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'activity' 
              ? 'bg-blue-500 text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Activity
        </button>
      </div>

      {activeTab === 'friends' && renderFriendsTab()}
      {activeTab === 'messages' && renderMessagesTab()}
      {activeTab === 'activity' && renderActivityTab()}
    </div>
  );
}; 