import React, { useState, useEffect } from 'react';

// Placeholder Type - Define based on actual backend model
interface TournamentSummary {
  id: string;
  name: string;
  format: 'Single Elimination' | 'Double Elimination' | 'Round Robin' | 'Swiss';
  status: 'Upcoming' | 'Registration Open' | 'In Progress' | 'Completed';
  startDate: string;
  venueName: string;
}

// Placeholder prop type - function to call when a tournament is selected
interface TournamentListProps {
  onSelectTournament?: (id: string) => void; // Optional callback
}

const TournamentList: React.FC<TournamentListProps> = ({
  onSelectTournament,
}) => {
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTournaments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // --- Placeholder API Call ---
        const response = await fetch('/api/tournaments'); // FAKE ENDPOINT
        if (!response.ok) throw new Error('Failed to fetch tournaments');
        const data: TournamentSummary[] = await response.json(); // FAKE DATA STRUCTURE
        setTournaments(data);
        // --- End Placeholder ---
      } catch (err: any) {
        console.error('Failed to load tournaments:', err);
        setError(err.message || 'Could not load tournament list.');
        // Fake data for UI dev
        setTournaments([
          {
            id: 't1',
            name: 'Weekly 8-Ball Challenge',
            format: 'Single Elimination',
            status: 'Registration Open',
            startDate: '2024-08-05',
            venueName: 'Main St. Dojo',
          },
          {
            id: 't2',
            name: 'Summer Swiss Showdown',
            format: 'Swiss',
            status: 'Upcoming',
            startDate: '2024-08-12',
            venueName: 'Downtown Dojo',
          },
          {
            id: 't3',
            name: 'Invitational Pro League',
            format: 'Round Robin',
            status: 'In Progress',
            startDate: '2024-07-20',
            venueName: 'Main St. Dojo',
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTournaments();
  }, []);

  if (isLoading) {
    return <div className="text-center p-4">Loading Tournaments...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="border p-4 rounded shadow">
      <h2 className="text-xl font-semibold mb-3">Available Tournaments</h2>
      {tournaments.length > 0 ? (
        <ul className="divide-y divide-gray-200">
          {tournaments.map((t) => (
            <li key={t.id} className="py-3 hover:bg-gray-50">
              <button
                onClick={() => onSelectTournament && onSelectTournament(t.id)}
                className="w-full text-left px-2 focus:outline-none"
                title={onSelectTournament ? 'View Details' : ''}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {t.name} ({t.format})
                  </span>
                  <span
                    className={`text-sm px-2 py-0.5 rounded ${t.status === 'Registration Open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                  >
                    {t.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Starts: {new Date(t.startDate).toLocaleDateString()} at{' '}
                  {t.venueName}
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No tournaments found.</p>
      )}
    </div>
  );
};

export default TournamentList;
