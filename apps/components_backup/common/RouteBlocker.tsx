import React from 'react';
import { getBlockedRouteMessage } from '../../utils/routeFilter';

interface RouteBlockerProps {
  pathname: string;
}

export const RouteBlocker: React.FC<RouteBlockerProps> = ({ pathname }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-6xl mb-4">🚧</h1>
          <h2 className="text-3xl font-bold mb-4 text-yellow-400">
            Route Temporarily Disabled
          </h2>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-6">
          <p className="text-gray-300 mb-4 text-lg">
            {getBlockedRouteMessage(pathname)}
          </p>
        </div>

        <div className="bg-blue-900 p-4 rounded-lg border border-blue-700">
          <h3 className="text-xl font-semibold mb-2 text-blue-300">
            Why This Happened
          </h3>
          <p className="text-blue-200">
            We discovered 635+ TypeScript compilation errors across 233 files
            that were causing the development server to crash repeatedly. This
            temporary block ensures you can continue developing the working
            features.
          </p>
        </div>

        <div className="mt-8">
          <a
            href="/map"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            🗺️ Go to Working World Map
          </a>
        </div>
      </div>
    </div>
  );
};
