import { useState } from 'react';
import { DojoCoinEconomyPanel } from '../src/frontend/components/economy/DojoCoinEconomyPanel';
import { DojoCoinTransaction } from '../src/frontend/services/economy/DojoCoinEconomyService';

export default function EconomyPage() {
  const [userId] = useState('user_123'); // Mock user ID for demo
  const [recentTransaction, setRecentTransaction] =
    useState<DojoCoinTransaction | null>(null);

  const handleTransactionComplete = (transaction: DojoCoinTransaction) => {
    setRecentTransaction(transaction);
    // Auto-clear after 5 seconds
    setTimeout(() => setRecentTransaction(null), 5000);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Dojo Coin Economy
          </h1>
          <p className="text-lg text-gray-600">
            Experience the comprehensive digital economy system powering the
            DojoPool platform
          </p>
        </div>

        {/* Recent Transaction Notification */}
        {recentTransaction && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Transaction completed successfully!
                </p>
                <p className="text-sm text-green-700 mt-1">
                  {recentTransaction.description} -{' '}
                  {recentTransaction.type === 'earn' ? '+' : '-'}
                  {recentTransaction.amount} coins
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Economy Panel */}
        <DojoCoinEconomyPanel
          userId={userId}
          onTransactionComplete={handleTransactionComplete}
        />

        {/* Feature Highlights */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Earning System
            </h3>
            <p className="text-gray-600">
              Earn coins through match victories, tournament wins, territory
              control, and achievements with dynamic multipliers.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Ranking System
            </h3>
            <p className="text-gray-600">
              Progress through bronze, silver, gold, platinum, and diamond ranks
              based on your total earnings and achievements.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Social Features
            </h3>
            <p className="text-gray-600">
              Transfer coins to friends, compete on leaderboards, and track your
              economic progress against other players.
            </p>
          </div>
        </div>

        {/* System Information */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            System Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Transaction Categories
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Match Victory - Earn coins for winning pool matches</li>
                <li>• Tournament Victory - Bonus coins for tournament wins</li>
                <li>
                  • Territory Control - Passive income from controlled
                  territories
                </li>
                <li>
                  • Achievement Rewards - Coins for unlocking achievements
                </li>
                <li>• Win Streak Bonus - Multipliers for consecutive wins</li>
                <li>• Avatar Upgrades - Spend coins on avatar enhancements</li>
                <li>• Tournament Entry - Pay entry fees for tournaments</li>
                <li>• NFT Purchases - Buy digital collectibles</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Economic Balance
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Daily and weekly earning limits to prevent inflation</li>
                <li>
                  • Category-specific multipliers for different activities
                </li>
                <li>• Real-time transaction tracking and history</li>
                <li>• Comprehensive statistics and analytics</li>
                <li>• Secure transfer system between players</li>
                <li>• Rank-based progression system</li>
                <li>• Leaderboards for competition</li>
                <li>• Integration with other game systems</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
