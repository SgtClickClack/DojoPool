import { WORKING_ROUTES } from '../utils/routeFilter';

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">🔧 Development Status</h1>
          <p className="text-xl text-gray-300">
            Current Development Environment Status
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Working Routes */}
          <div className="bg-green-900 p-6 rounded-lg border border-green-700">
            <h2 className="text-2xl font-bold mb-4 text-green-300">
              ✅ Working Routes
            </h2>
            <ul className="space-y-2">
              {WORKING_ROUTES.map((route) => (
                <li key={route} className="flex items-center">
                  <span className="text-green-400 mr-2">●</span>
                  <code className="bg-green-800 px-2 py-1 rounded text-sm">
                    {route}
                  </code>
                </li>
              ))}
            </ul>
            <p className="text-green-200 mt-4 text-sm">
              These routes are fully functional and ready for development.
            </p>
          </div>

          {/* Blocked Routes */}
          <div className="bg-red-900 p-6 rounded-lg border border-red-700">
            <h2 className="text-2xl font-bold mb-4 text-red-300">
              🚫 Blocked Routes
            </h2>
            <div className="space-y-2">
              <p className="text-red-200">
                All other routes are temporarily disabled due to TypeScript
                compilation errors.
              </p>
              <div className="bg-red-800 p-3 rounded">
                <p className="text-red-100 text-sm">
                  <strong>635+ errors</strong> across <strong>233 files</strong>
                </p>
                <p className="text-red-200 text-xs mt-1">
                  These will be re-enabled once the errors are resolved.
                </p>
              </div>
            </div>
          </div>

          {/* Current Focus */}
          <div className="bg-blue-900 p-6 rounded-lg border border-blue-700 md:col-span-2">
            <h2 className="text-2xl font-bold mb-4 text-blue-300">
              🎯 Current Development Focus
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-2 text-blue-200">
                  WorldHubMap Component
                </h3>
                <ul className="text-blue-100 text-sm space-y-1">
                  <li>• Interactive map with real-time player movement</li>
                  <li>• Proximity-based Dojo interaction system</li>
                  <li>• User geolocation integration</li>
                  <li>• Efficient marker management with useRef</li>
                  <li>• Performance optimized for production</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-blue-200">
                  Next Steps
                </h3>
                <ul className="text-blue-100 text-sm space-y-1">
                  <li>• Add more interactive features to the map</li>
                  <li>• Implement Dojo entry mechanics</li>
                  <li>• Build player profile system</li>
                  <li>• Create tournament integration</li>
                  <li>• Add social features</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-purple-900 p-6 rounded-lg border border-purple-700 md:col-span-2">
            <h2 className="text-2xl font-bold mb-4 text-purple-300">
              🚀 Quick Actions
            </h2>
            <div className="flex flex-wrap gap-4">
              <a
                href="/map"
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                🗺️ Open World Map
              </a>
              <a
                href="/"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                🏠 Go Home
              </a>
              <button
                onClick={() => window.location.reload()}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                🔄 Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
