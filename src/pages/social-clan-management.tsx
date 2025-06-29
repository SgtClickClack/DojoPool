import React, { useState } from 'react';
import { SocialPanel } from '../components/social/SocialPanel';
import { ClanPanel } from '../components/clan/ClanPanel';

export default function SocialClanManagementPage() {
  const [activeSection, setActiveSection] = useState<'social' | 'clan'>('social');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Social & Clan Management</h1>
          <p className="text-gray-600">
            Manage your social connections, friends, messaging, and clan activities
          </p>
        </div>

        <div className="flex space-x-1 mb-6 bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setActiveSection('social')}
            className={`flex-1 py-3 px-6 rounded-md font-medium transition-colors ${
              activeSection === 'social' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <span>👥</span>
              <span>Social Features</span>
            </div>
          </button>
          <button
            onClick={() => setActiveSection('clan')}
            className={`flex-1 py-3 px-6 rounded-md font-medium transition-colors ${
              activeSection === 'clan' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <span>⚔️</span>
              <span>Clan System</span>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {activeSection === 'social' && (
            <>
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-2xl font-bold mb-4">Social Features Overview</h2>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <span className="text-2xl">👥</span>
                      <div>
                        <h3 className="font-semibold">Friend System</h3>
                        <p className="text-sm text-gray-600">Add friends, see their status, and manage connections</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <span className="text-2xl">💬</span>
                      <div>
                        <h3 className="font-semibold">Real-time Messaging</h3>
                        <p className="text-sm text-gray-600">Send messages, challenges, and clan invites</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                      <span className="text-2xl">📱</span>
                      <div>
                        <h3 className="font-semibold">Activity Feed</h3>
                        <p className="text-sm text-gray-600">Share achievements, match results, and social interactions</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                      <span className="text-2xl">🔍</span>
                      <div>
                        <h3 className="font-semibold">User Discovery</h3>
                        <p className="text-sm text-gray-600">Search for players and discover new friends</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-2xl font-bold mb-4">Social Statistics</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-3xl font-bold text-blue-600">24</p>
                      <p className="text-sm text-gray-600">Friends</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-3xl font-bold text-green-600">156</p>
                      <p className="text-sm text-gray-600">Messages</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-3xl font-bold text-purple-600">89</p>
                      <p className="text-sm text-gray-600">Activities</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-3xl font-bold text-orange-600">12</p>
                      <p className="text-sm text-gray-600">Followers</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <SocialPanel />
              </div>
            </>
          )}

          {activeSection === 'clan' && (
            <>
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-2xl font-bold mb-4">Clan System Overview</h2>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                      <span className="text-2xl">⚔️</span>
                      <div>
                        <h3 className="font-semibold">Clan Management</h3>
                        <p className="text-sm text-gray-600">Create, manage, and lead your own clan</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                      <span className="text-2xl">👥</span>
                      <div>
                        <h3 className="font-semibold">Member Management</h3>
                        <p className="text-sm text-gray-600">Promote, demote, and manage clan members</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <span className="text-2xl">🏆</span>
                      <div>
                        <h3 className="font-semibold">Clan Wars</h3>
                        <p className="text-sm text-gray-600">Declare war on other clans and compete for glory</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <span className="text-2xl">🔍</span>
                      <div>
                        <h3 className="font-semibold">Clan Discovery</h3>
                        <p className="text-sm text-gray-600">Find and join the best clans in the game</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-2xl font-bold mb-4">Clan Statistics</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-3xl font-bold text-red-600">15</p>
                      <p className="text-sm text-gray-600">Members</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <p className="text-3xl font-bold text-yellow-600">8</p>
                      <p className="text-sm text-gray-600">Territories</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-3xl font-bold text-green-600">24</p>
                      <p className="text-sm text-gray-600">Wars Won</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-3xl font-bold text-blue-600">85%</p>
                      <p className="text-sm text-gray-600">Win Rate</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-2xl font-bold mb-4">Recent Clan Activity</h2>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                      <span className="text-green-500">✓</span>
                      <div>
                        <p className="text-sm font-medium">Won clan war against "Dragon Slayers"</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                      <span className="text-blue-500">👤</span>
                      <div>
                        <p className="text-sm font-medium">New member joined: "ShadowStriker"</p>
                        <p className="text-xs text-gray-500">5 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                      <span className="text-purple-500">🏆</span>
                      <div>
                        <p className="text-sm font-medium">Captured new territory: "Jade District"</p>
                        <p className="text-xs text-gray-500">1 day ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                      <span className="text-orange-500">⚔️</span>
                      <div>
                        <p className="text-sm font-medium">Declared war on "Phoenix Rising"</p>
                        <p className="text-xs text-gray-500">2 days ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <ClanPanel />
              </div>
            </>
          )}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Integration Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <span className="text-4xl mb-2 block">🎮</span>
              <h3 className="font-semibold mb-2">Game Integration</h3>
              <p className="text-sm text-gray-600">
                Social features integrated with territory battles, tournaments, and match results
              </p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <span className="text-4xl mb-2 block">💰</span>
              <h3 className="font-semibold mb-2">Economic System</h3>
              <p className="text-sm text-gray-600">
                Clan rewards, social transactions, and economic incentives for collaboration
              </p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <span className="text-4xl mb-2 block">🤖</span>
              <h3 className="font-semibold mb-2">AI Enhancement</h3>
              <p className="text-sm text-gray-600">
                AI commentary for clan wars, social recommendations, and activity analysis
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 