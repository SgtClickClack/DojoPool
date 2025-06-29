import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { 
  UserGroupIcon, 
  ShieldCheckIcon, 
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrophyIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import SocialHub from '../components/social/SocialHub';
import Layout from '../components/layout/Layout';

const SocialPage: NextPage = () => {
  const [activeSection, setActiveSection] = useState('hub');
  const [stats, setStats] = useState({
    friends: 0,
    enemies: 0,
    clanMembers: 0,
    totalClans: 0,
    pendingRequests: 0
  });

  useEffect(() => {
    // Load social statistics
    loadSocialStats();
  }, []);

  const loadSocialStats = async () => {
    // This would typically load from your social service
    setStats({
      friends: 12,
      enemies: 3,
      clanMembers: 25,
      totalClans: 8,
      pendingRequests: 2
    });
  };

  const sections = [
    {
      id: 'hub',
      name: 'Social Hub',
      icon: UsersIcon,
      description: 'Manage friends, clans, and enemies'
    },
    {
      id: 'clans',
      name: 'Clan Management',
      icon: ShieldCheckIcon,
      description: 'Create and manage clans'
    },
    {
      id: 'tournaments',
      name: 'Social Tournaments',
      icon: TrophyIcon,
      description: 'Compete with friends and clan members'
    }
  ];

  return (
    <Layout>
      <Head>
        <title>Social Hub - DojoPool</title>
        <meta name="description" content="Connect with friends, join clans, and manage your social network in DojoPool" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Social Hub</h1>
                  <p className="mt-2 text-gray-600">
                    Connect with friends, join clans, and build your community
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{stats.friends}</div>
                        <div className="text-sm text-blue-500">Friends</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.clanMembers}</div>
                        <div className="text-sm text-green-500">Clan Members</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{stats.enemies}</div>
                        <div className="text-sm text-red-500">Enemies</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeSection === section.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <section.icon className="h-5 w-5" />
                  <span>{section.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeSection === 'hub' && (
            <div className="space-y-8">
              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <UserGroupIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Friends</h3>
                      <p className="text-sm text-gray-500">{stats.friends} connections</p>
                    </div>
                  </div>
                  {stats.pendingRequests > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        {stats.pendingRequests} pending friend request{stats.pendingRequests !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <ShieldCheckIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Clans</h3>
                      <p className="text-sm text-gray-500">{stats.totalClans} active clans</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button className="w-full px-4 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 transition-colors">
                      Join a Clan
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Enemies</h3>
                      <p className="text-sm text-gray-500">{stats.enemies} rivalries</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Hub Component */}
              <div className="bg-white rounded-lg shadow-sm border">
                <SocialHub />
              </div>
            </div>
          )}

          {activeSection === 'clans' && (
            <div className="space-y-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Clan Management</h2>
                  <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center space-x-2">
                    <PlusIcon className="h-5 w-5" />
                    <span>Create Clan</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Clan Creation Guide */}
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">Create Your Clan</h3>
                    <ul className="space-y-2 text-sm text-blue-800">
                      <li>• Choose a unique name and tag</li>
                      <li>• Set your clan's description</li>
                      <li>• Invite friends to join</li>
                      <li>• Compete in clan tournaments</li>
                    </ul>
                  </div>

                  {/* Clan Benefits */}
                  <div className="bg-green-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-green-900 mb-3">Clan Benefits</h3>
                    <ul className="space-y-2 text-sm text-green-800">
                      <li>• Exclusive clan tournaments</li>
                      <li>• Shared achievements</li>
                      <li>• Clan leaderboards</li>
                      <li>• Team-based challenges</li>
                    </ul>
                  </div>

                  {/* Clan Stats */}
                  <div className="bg-purple-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-purple-900 mb-3">Clan Statistics</h3>
                    <div className="space-y-2 text-sm text-purple-800">
                      <div className="flex justify-between">
                        <span>Total Clans:</span>
                        <span className="font-semibold">{stats.totalClans}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Members:</span>
                        <span className="font-semibold">{stats.clanMembers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average Size:</span>
                        <span className="font-semibold">{Math.round(stats.clanMembers / stats.totalClans)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'tournaments' && (
            <div className="space-y-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Social Tournaments</h2>
                  <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                    Create Tournament
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Friend Tournaments */}
                  <div className="bg-blue-50 rounded-lg p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <UserGroupIcon className="h-8 w-8 text-blue-600" />
                      <h3 className="text-lg font-semibold text-blue-900">Friend Tournaments</h3>
                    </div>
                    <p className="text-sm text-blue-800 mb-4">
                      Challenge your friends in private tournaments with custom rules and prizes.
                    </p>
                    <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors">
                      Create Friend Tournament
                    </button>
                  </div>

                  {/* Clan Wars */}
                  <div className="bg-green-50 rounded-lg p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <ShieldCheckIcon className="h-8 w-8 text-green-600" />
                      <h3 className="text-lg font-semibold text-green-900">Clan Wars</h3>
                    </div>
                    <p className="text-sm text-green-800 mb-4">
                      Compete against other clans in epic battles for glory and rewards.
                    </p>
                    <button className="w-full px-4 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 transition-colors">
                      Join Clan War
                    </button>
                  </div>

                  {/* Rivalry Matches */}
                  <div className="bg-red-50 rounded-lg p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                      <h3 className="text-lg font-semibold text-red-900">Rivalry Matches</h3>
                    </div>
                    <p className="text-sm text-red-800 mb-4">
                      Settle scores with your enemies in intense one-on-one battles.
                    </p>
                    <button className="w-full px-4 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors">
                      Challenge Enemy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SocialPage;
