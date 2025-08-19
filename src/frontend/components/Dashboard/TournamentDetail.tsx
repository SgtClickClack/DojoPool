import React, { useState, useEffect } from 'react';

// Placeholder types - expand as needed
interface Player {
  id: string;
  name: string;
}

interface Match {
  id: string;
  round: number;
  player1: Player | null;
  player2: Player | null;
  winner: Player | null;
  status: 'Pending' | 'In Progress' | 'Completed';
}

interface TournamentDetails {
  id: string;
  name: string;
  description: string;
  format: string;
  status: string;
  startDate: string;
  venueName: string;
  participants: Player[];
  matches: Match[];
  entryFee: number;
  canRegister: boolean; // Based on status and user registration
}

interface TournamentDetailProps {
  tournamentId: string | null;
}

const TournamentDetail: React.FC<TournamentDetailProps> = ({ tournamentId }) => {
  const [details, setDetails] = useState<TournamentDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  useEffect(() => {
    if (!tournamentId) {
      setDetails(null);
      return;
    }

    const fetchDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // --- Placeholder API Call ---
        const response = await fetch(`/api/tournaments/${tournamentId}`);
        if (!response.ok) throw new Error('Failed to fetch tournament details');
        const data: TournamentDetails = await response.json();
        setDetails(data);
      } catch (err: any) {
        console.error('Failed to load tournament details:', err);
        setError(err.message || 'Could not load tournament details.');
        // Fake data for UI dev
        setDetails({
          id: tournamentId,
          name: 'Weekly 8-Ball Challenge',
          description:
            'Test your skills in our weekly single elimination tournament.',
          format: 'Single Elimination',
          status: 'Registration Open',
          startDate: '2024-08-05',
          venueName: 'Main St. Dojo',
          participants: [
            { id: 'p1', name: 'Alice' },
            { id: 'p2', name: 'Bob' },
          ],
          matches: [
            {
              id: 'm1',
              round: 1,
              player1: { id: 'p1', name: 'Alice' },
              player2: { id: 'p2', name: 'Bob' },
              winner: null,
              status: 'Pending',
            },
          ],
          entryFee: 5,
          canRegister: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [tournamentId]);

  const handleRegister = async () => {
    if (!details) return;
    setIsRegistering(true);
    setError(null);
    try {
      console.log(`Registering for tournament ${details.id}...`);
      // --- Placeholder API Call ---
      const response = await fetch(`/api/tournaments/${details.id}/register`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Registration failed');
      const result = await response.json();
      console.log('Registration successful:', result);
      setDetails({ ...details, canRegister: false });
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Could not register for tournament.');
    } finally {
      setIsRegistering(false);
    }
  };

  if (!tournamentId) {
    return (
      <div className="text-center p-4 text-gray-500">
        Select a tournament to view details.
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center p-4">Loading Tournament Details...</div>;
  }

  if (error && !details) {
    return <div className="text-center p-4 text-red-500">Error: {error}</div>;
  }

  if (!details) {
    return <div className="text-center p-4">Tournament not found.</div>;
  }

  return (
    <div className="border p-4 rounded shadow mt-6">
      <h2 className="text-2xl font-bold mb-3">{details.name}</h2>
      <p className="mb-2">
        <strong>Format:</strong> {details.format}
      </p>
      <p className="mb-2">
        <strong>Status:</strong> {details.status}
      </p>
      <p className="mb-2">
        <strong>Venue:</strong> {details.venueName}
      </p>
      <p className="mb-4">
        <strong>Starts:</strong> {new Date(details.startDate).toLocaleDateString()}
      </p>
      <p className="mb-4">{details.description}</p>

      {details.canRegister && (
        <div className="mb-4">
          <p className="mb-2 font-semibold">
            Entry Fee: {details.entryFee} DOJO
          </p>
          <button
            onClick={handleRegister}
            disabled={isRegistering}
            className={`px-4 py-2 rounded text-white ${isRegistering ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {isRegistering ? 'Registering...' : 'Register Now'}
          </button>
        </div>
      )}
      {!details.canRegister && details.status === 'Registration Open' && (
        <p className="text-green-700 font-semibold mb-4">You are registered!</p>
      )}
      {error && <p className="text-red-500 mb-3">Error: {error}</p>}

      {/* Participants */}
      <div className="mt-4">
        <h3 className="text-xl font-semibold mb-2">
          Participants ({details.participants.length})
        </h3>
        <ul className="list-disc list-inside text-sm">
          {details.participants.map((p) => (
            <li key={p.id}>{p.name}</li>
          ))}
        </ul>
      </div>

      {/* Matches */}
      <div className="mt-4">
        <h3 className="text-xl font-semibold mb-2">Bracket / Matches</h3>
        <p className="text-gray-500">Bracket view coming soon...</p>
        {details.matches.map((m) => (
          <div key={m.id} className="text-sm border-t pt-2 mt-2">
            Round {m.round}: {m.player1?.name ?? 'TBD'} vs {m.player2?.name ?? 'TBD'} ({m.status})
          </div>
        ))}
      </div>
    </div>
  );
};

export default TournamentDetail;
