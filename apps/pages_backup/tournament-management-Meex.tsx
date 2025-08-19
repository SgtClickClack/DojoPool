import React, { useState, useEffect } from 'react';
import { EnhancedTournamentPanel } from '../components/tournament/EnhancedTournamentPanel';

interface Tournament {
  id: string;
  name: string;
  format: string;
  status: string;
  participants: string[];
  maxParticipants: number;
  prizePool: number;
  entryFee: number;
  startDate: string;
  endDate: string;
}

interface ApiResponse {
  success: boolean;
  tournaments: Tournament[];
}

const TournamentManagementPage: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tournaments from the real API
  const fetchTournaments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/tournaments');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ApiResponse = await response.json();

      if (data.success && data.tournaments.length > 0) {
        setTournaments(data.tournaments);
        // Auto-select the first tournament if none is selected
        if (!selectedTournamentId) {
          setSelectedTournamentId(data.tournaments[0].id);
        }
      } else {
        setTournaments([]);
      }
    } catch (err) {
      console.error('Failed to fetch tournaments:', err);
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const handleTournamentSelect = (tournamentId: string) => {
    setSelectedTournamentId(tournamentId);
  };

  const handleMatchComplete = (
    matchId: string,
    winnerId: string,
    loserId: string
  ) => {
    console.log(`Match ${matchId} completed: ${winnerId} defeated ${loserId}`);
    // TODO: Implement match completion logic
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tournaments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
          <button
            onClick={fetchTournaments}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tournament Management
          </h1>
          <p className="text-gray-600">
            Manage tournaments with AI commentary, Pool God interactions, and
            enhanced rewards
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tournament List Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Tournaments</h2>
              {tournaments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No tournaments available</p>
                  <button
                    onClick={fetchTournaments}
                    className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Refresh
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {tournaments.map((tournament) => (
                    <div
                      key={tournament.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedTournamentId === tournament.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleTournamentSelect(tournament.id)}
                    >
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {tournament.name}
                      </h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Format: {tournament.format.replace('_', ' ')}</div>
                        <div>
                          Participants: {tournament.participants.length}/
                          {tournament.maxParticipants}
                        </div>
                        <div>Prize Pool: {tournament.prizePool} DC</div>
                        <div>Entry Fee: {tournament.entryFee} DC</div>
                        <div
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(tournament.status)}`}
                        >
                          {tournament.status.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            {selectedTournamentId && (
              <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    onClick={() => {
                      console.log(
                        'Test AI Commentary for tournament:',
                        selectedTournamentId
                      );
                    }}
                  >
                    Test AI Commentary
                  </button>
                  <button
                    className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                    onClick={() => {
                      console.log(
                        'Test Pool God Interaction for tournament:',
                        selectedTournamentId
                      );
                    }}
                  >
                    Test Pool God Interaction
                  </button>
                  <button
                    className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    onClick={() => {
                      console.log(
                        'Test Rewards Distribution for tournament:',
                        selectedTournamentId
                      );
                    }}
                  >
                    Test Rewards Distribution
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Main Tournament Panel */}
          <div className="lg:col-span-3">
            {selectedTournamentId ? (
              <EnhancedTournamentPanel
                tournamentId={selectedTournamentId}
                onMatchComplete={handleMatchComplete}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center py-12">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Select a Tournament
                  </h3>
                  <p className="text-gray-600">
                    Choose a tournament from the sidebar to view its details and
                    manage matches.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <div>
                  <div className="font-semibold text-green-800">
                    AI Commentary
                  </div>
                  <div className="text-sm text-green-600">Active</div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <div>
                  <div className="font-semibold text-blue-800">
                    Pool God System
                  </div>
                  <div className="text-sm text-blue-600">Active</div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                <div>
                  <div className="font-semibold text-purple-800">
                    Reward System
                  </div>
                  <div className="text-sm text-purple-600">Active</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentManagementPage;
