import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome to your DojoPool dashboard
          </p>
        </div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* New Game Button */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <button
              data-testid="new-game-button"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
            >
              New Game
            </button>
          </div>

          {/* Settings Button */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Settings
            </h2>
            <button
              data-testid="settings-button"
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 w-full"
            >
              Settings
            </button>
          </div>

          {/* Game State */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Game Status
            </h2>
            <div data-testid="game-state" className="text-sm text-gray-600">
              No active games
            </div>
          </div>
        </div>

        {/* Settings Modal */}
        <div
          data-testid="settings-modal"
          className="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="theme-select"
                  className="block text-sm font-medium text-gray-700"
                >
                  Theme
                </label>
                <select
                  id="theme-select"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option>Light</option>
                  <option>Dark</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="notifications-toggle"
                  className="block text-sm font-medium text-gray-700"
                >
                  Notifications
                </label>
                <input
                  id="notifications-toggle"
                  type="checkbox"
                  className="mt-1"
                  defaultChecked
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
                Cancel
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
