import React, { useState } from 'react';
import { useDojoCoinEconomy } from '../../hooks/useDojoCoinEconomy';
import {
  type DojoCoinTransaction,
  TransactionCategory,
} from '../../services/economy/DojoCoinEconomyService';

interface DojoCoinEconomyPanelProps {
  userId: string;
  onTransactionComplete?: (transaction: DojoCoinTransaction) => void;
}

export const DojoCoinEconomyPanel: React.FC<DojoCoinEconomyPanelProps> = ({
  userId,
  onTransactionComplete,
}) => {
  const {
    balance,
    profile,
    transactions,
    categories,
    isLoading,
    error,
    earnCoins,
    spendCoins,
    transferCoins,
    getTransactionStats,
    getLeaderboard,
    getEarningsLeaderboard,
    refresh,
    clearError,
  } = useDojoCoinEconomy(userId);

  const [activeTab, setActiveTab] = useState<
    'overview' | 'transactions' | 'leaderboard' | 'transfer'
  >('overview');
  const [transferData, setTransferData] = useState({
    toUserId: '',
    amount: 0,
    description: '',
  });
  const [showTransferForm, setShowTransferForm] = useState(false);

  const stats = getTransactionStats();
  const leaderboard = getLeaderboard(10);
  const earningsLeaderboard = getEarningsLeaderboard(10);

  const handleEarnCoins = async (
    categoryId: string,
    amount: number,
    description: string
  ) => {
    try {
      const transaction = await earnCoins(amount, categoryId, description);
      onTransactionComplete?.(transaction);
    } catch (error) {
      console.error('Failed to earn coins:', error);
    }
  };

  const handleSpendCoins = async (
    categoryId: string,
    amount: number,
    description: string
  ) => {
    try {
      const transaction = await spendCoins(amount, categoryId, description);
      onTransactionComplete?.(transaction);
    } catch (error) {
      console.error('Failed to spend coins:', error);
    }
  };

  const handleTransfer = async () => {
    if (
      !transferData.toUserId ||
      transferData.amount <= 0 ||
      !transferData.description
    ) {
      return;
    }

    try {
      const result = await transferCoins(
        transferData.toUserId,
        transferData.amount,
        transferData.description
      );
      onTransactionComplete?.(result.fromTransaction);
      setTransferData({ toUserId: '', amount: 0, description: '' });
      setShowTransferForm(false);
    } catch (error) {
      console.error('Failed to transfer coins:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Dojo Coin Economy
            </h2>
            <p className="text-gray-600">Manage your digital currency</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-600">
              {balance.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Dojo Coins</div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mx-6 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-600"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'transactions', label: 'Transactions' },
            { id: 'leaderboard', label: 'Leaderboard' },
            { id: 'transfer', label: 'Transfer' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Profile Stats */}
            {profile && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-500">Rank</div>
                  <div className="text-2xl font-bold text-gray-900 capitalize">
                    {profile.rank}
                  </div>
                  <div className="text-sm text-gray-500">
                    {profile.rankProgress.toFixed(1)}% to next rank
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-500">
                    Total Earned
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {profile.totalEarned.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">Lifetime earnings</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-500">
                    Total Spent
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {profile.totalSpent.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">Lifetime spending</div>
                </div>
              </div>
            )}

            {/* Transaction Stats */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Transaction Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">
                    Total Transactions
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {stats.totalTransactions}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">
                    Average Transaction
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {stats.averageTransaction.toFixed(0)}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">
                    Most Used Category
                  </div>
                  <div className="text-xl font-bold text-gray-900 capitalize">
                    {stats.mostUsedCategory.replace('_', ' ')}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">
                    Net Worth
                  </div>
                  <div className="text-xl font-bold text-green-600">
                    {(stats.totalEarned - stats.totalSpent).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Earn Coins</h4>
                  <div className="space-y-2">
                    {categories
                      .filter((c) => c.multiplier > 0)
                      .slice(0, 3)
                      .map((category) => (
                        <button
                          key={category.id}
                          onClick={() =>
                            handleEarnCoins(
                              category.id,
                              100,
                              `Quick ${category.name}`
                            )
                          }
                          className="w-full text-left px-3 py-2 bg-green-100 hover:bg-green-200 rounded-md text-sm"
                        >
                          {category.name} (+100)
                        </button>
                      ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Spend Coins
                  </h4>
                  <div className="space-y-2">
                    {categories
                      .filter((c) => c.multiplier < 0)
                      .slice(0, 3)
                      .map((category) => (
                        <button
                          key={category.id}
                          onClick={() =>
                            handleSpendCoins(
                              category.id,
                              50,
                              `Quick ${category.name}`
                            )
                          }
                          className="w-full text-left px-3 py-2 bg-red-100 hover:bg-red-200 rounded-md text-sm"
                        >
                          {category.name} (-50)
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Recent Transactions
              </h3>
              <button
                onClick={refresh}
                className="text-sm text-green-600 hover:text-green-800"
              >
                Refresh
              </button>
            </div>
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {transaction.description}
                    </div>
                    <div className="text-sm text-gray-500">
                      {transaction.category.name} •{' '}
                      {transaction.timestamp.toLocaleDateString()}
                    </div>
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      transaction.type === 'earn'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {transaction.type === 'earn' ? '+' : '-'}
                    {transaction.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            {/* Balance Leaderboard */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Top Balances
              </h3>
              <div className="space-y-2">
                {leaderboard.map((user, index) => (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          User {user.userId}
                        </div>
                        <div className="text-sm text-gray-500 capitalize">
                          {user.rank}
                        </div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {user.balance.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Earnings Leaderboard */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Top Earners
              </h3>
              <div className="space-y-2">
                {earningsLeaderboard.map((user, index) => (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          User {user.userId}
                        </div>
                        <div className="text-sm text-gray-500 capitalize">
                          {user.rank}
                        </div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {user.totalEarned.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transfer' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Transfer Coins
            </h3>

            {!showTransferForm ? (
              <button
                onClick={() => setShowTransferForm(true)}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                New Transfer
              </button>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To User ID
                  </label>
                  <input
                    type="text"
                    value={transferData.toUserId}
                    onChange={(e) =>
                      setTransferData((prev) => ({
                        ...prev,
                        toUserId: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter user ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={transferData.amount}
                    onChange={(e) =>
                      setTransferData((prev) => ({
                        ...prev,
                        amount: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter amount"
                    min="1"
                    max={balance}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={transferData.description}
                    onChange={(e) =>
                      setTransferData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter description"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleTransfer}
                    disabled={
                      !transferData.toUserId ||
                      transferData.amount <= 0 ||
                      !transferData.description
                    }
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                  >
                    Send Transfer
                  </button>
                  <button
                    onClick={() => setShowTransferForm(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
