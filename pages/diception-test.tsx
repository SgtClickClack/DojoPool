import React, { useState, useEffect } from 'react';

interface DiceptionStatus {
  status: string;
  tracking_active: boolean;
  detection_method: string;
  features: string[];
  timestamp: string;
}

interface DiceptionData {
  timestamp: string;
  balls: Array<{
    id: number;
    position: [number, number];
    radius: number;
    confidence: number;
  }>;
  detection: string;
  status: string;
}

const DiceptionTest: React.FC = () => {
  const [status, setStatus] = useState<DiceptionStatus | null>(null);
  const [demoData, setDemoData] = useState<DiceptionData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkDiceptionHealth();
  }, []);

  const checkDiceptionHealth = async () => {
    try {
      const response = await fetch('http://localhost:3002/health');
      if (response.ok) {
        setIsConnected(true);
        setError(null);
        fetchStatus();
        fetchDemoData();
      } else {
        setIsConnected(false);
        setError('Diception server not responding');
      }
    } catch (err) {
      setIsConnected(false);
      setError('Failed to connect to Diception server');
    }
  };

  const fetchStatus = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/diception/status');
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  };

  const fetchDemoData = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/diception/demo');
      const data = await response.json();
      setDemoData(data);
    } catch (err) {
      console.error('Failed to fetch demo data:', err);
    }
  };

  const startTracking = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/diception/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ camera_index: 0 })
      });
      if (response.ok) {
        fetchStatus();
      }
    } catch (err) {
      console.error('Failed to start tracking:', err);
    }
  };

  const stopTracking = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/diception/stop', {
        method: 'POST'
      });
      if (response.ok) {
        fetchStatus();
      }
    } catch (err) {
      console.error('Failed to stop tracking:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Diception AI Integration Test
        </h1>

        {/* Connection Status */}
        <div className="mb-8 p-6 rounded-lg bg-gray-800">
          <h2 className="text-2xl font-semibold mb-4">Connection Status</h2>
          <div className="flex items-center space-x-4">
            <div className={`w-4 h-4 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
              {isConnected ? 'Connected to Diception AI Server' : 'Disconnected'}
            </span>
            {error && <span className="text-red-400">({error})</span>}
          </div>
          <button
            onClick={checkDiceptionHealth}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Refresh Connection
          </button>
        </div>

        {/* System Status */}
        {status && (
          <div className="mb-8 p-6 rounded-lg bg-gray-800">
            <h2 className="text-2xl font-semibold mb-4">System Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>Status:</strong> {status.status}</p>
                <p><strong>Detection Method:</strong> {status.detection_method}</p>
                <p><strong>Tracking Active:</strong> {status.tracking_active ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p><strong>Features:</strong></p>
                <ul className="list-disc list-inside">
                  {status.features.map((feature, index) => (
                    <li key={index} className="text-sm">{feature.replace(/_/g, ' ')}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-4 space-x-4">
              <button
                onClick={startTracking}
                disabled={status.tracking_active}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg transition-colors"
              >
                Start Tracking
              </button>
              <button
                onClick={stopTracking}
                disabled={!status.tracking_active}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg transition-colors"
              >
                Stop Tracking
              </button>
            </div>
          </div>
        )}

        {/* Demo Data */}
        {demoData && (
          <div className="mb-8 p-6 rounded-lg bg-gray-800">
            <h2 className="text-2xl font-semibold mb-4">Demo Ball Detection Data</h2>
            <div className="space-y-4">
              <p><strong>Timestamp:</strong> {demoData.timestamp}</p>
              <p><strong>Detection Mode:</strong> {demoData.detection}</p>
              <div>
                <p><strong>Detected Balls:</strong></p>
                {demoData.balls.map((ball, index) => (
                  <div key={index} className="ml-4 p-3 bg-gray-700 rounded mt-2">
                    <p>Ball {ball.id}: Position ({ball.position[0]}, {ball.position[1]})</p>
                    <p>Radius: {ball.radius}px, Confidence: {ball.confidence}%</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* API Endpoints */}
        <div className="p-6 rounded-lg bg-gray-800">
          <h2 className="text-2xl font-semibold mb-4">Available API Endpoints</h2>
          <div className="space-y-2 text-sm">
            <p><strong>GET</strong> /health - Server health check</p>
            <p><strong>GET</strong> /api/diception/status - System status</p>
            <p><strong>GET</strong> /api/diception/demo - Demo detection data</p>
            <p><strong>GET</strong> /api/diception/live - Live camera detection</p>
            <p><strong>POST</strong> /api/diception/start - Start camera tracking</p>
            <p><strong>POST</strong> /api/diception/stop - Stop camera tracking</p>
            <p><strong>GET</strong> /api/diception/match_state - Complete match state</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-6 rounded-lg bg-blue-900 border border-blue-700">
          <h3 className="text-xl font-semibold mb-2">Instructions</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Ensure the Diception AI server is running on port 3002</li>
            <li>Start command: <code className="bg-gray-800 px-2 py-1 rounded">python simple_diception_server.py</code></li>
            <li>The server provides real-time ball tracking and AI analysis</li>
            <li>Use the Start/Stop Tracking buttons to control camera input</li>
            <li>Check the demo data to verify the system is working correctly</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default DiceptionTest;