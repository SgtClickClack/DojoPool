import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Define a simple type for the tournament data expected from the API
// Expand this based on the actual data returned by the API
interface Tournament {
  id: number;
  name: string;
  format: string;
  status: string;
  start_date: string; // Assuming ISO string format
  // Add other relevant fields: venue_name, entry_fee, max_participants, etc.
}

const TournamentList: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTournaments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch all tournaments initially. Add filtering options later (e.g., ?status=active)
        const response = await fetch('/api/tournaments/');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Tournament[] = await response.json();
        setTournaments(data);
      } catch (err) {
        console.error("Failed to fetch tournaments:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTournaments();
  }, []); // Empty dependency array means this runs once on mount

  if (isLoading) {
    return <div>Loading tournaments...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error fetching tournaments: {error}</div>;
  }

  if (tournaments.length === 0) {
    return <div>No tournaments found.</div>;
  }

  return (
    <div>
      <h2>Tournament List</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {tournaments.map((tournament) => (
          <li key={tournament.id} style={{ marginBottom: '15px', border: '1px solid #eee', padding: '10px', borderRadius: '4px' }}>
            <Link to={`/tournaments/${tournament.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <strong>{tournament.name}</strong>
              <div>Format: {tournament.format}</div>
              <div>Status: {tournament.status}</div>
              <div>Starts: {new Date(tournament.start_date).toLocaleDateString()}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TournamentList; 