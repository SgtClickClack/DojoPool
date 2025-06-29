import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
// Import MatchList - adjust path as necessary
import MatchList from '../components/MatchList'; // Corrected path assumption
import TournamentBracket from '../components/TournamentBracket'; // Import Bracket component
import Layout from '../components/layout/Layout';
// Assuming you have an auth context/hook providing the current user
// import { useAuth } from '../context/AuthContext'; // Example import

// Define Match interface (Consider moving to a types file)
export interface Match {
    id: number;
    round: number;
    match_number?: number;
    player1_id?: number | null;
    player2_id?: number | null;
    winner_id?: number | null;
    status: string;
    score?: string | null;
    bracket_type?: string | null;
    player1_username?: string;
    player2_username?: string;
}

// Base Tournament interface (Consider moving to a types file)
export interface Tournament {
  id: number;
  name: string;
  format: string;
  status: string;
  start_date: string;
}

// Expand this interface based on the full details returned by /api/tournaments/<id>
interface TournamentDetails extends Tournament {
    description?: string;
    rules?: string;
    venue_id?: number;
    max_participants?: number;
    entry_fee?: number;
    prize_pool?: number;
    participants?: Array<{ user_id: number; username: string; seed?: number }>;
    matches?: Array<Match>;
}

const TournamentDetailPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [tournament, setTournament] = useState<TournamentDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [registrationMessage, setRegistrationMessage] = useState<string | null>(null);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [reportingScoreFor, setReportingScoreFor] = useState<number | null>(null); // Track which match score is being reported
  const [scoreReportMessage, setScoreReportMessage] = useState<string | null>(null);
  const [scoreReportError, setScoreReportError] = useState<string | null>(null);

  // --- Hypothetical Auth State --- //
  // Replace this with your actual auth state logic
  // const { currentUser, isAdmin } = useAuth(); // Example: Get user & admin status
  const currentUser = { id: 1 }; // Placeholder: Replace with actual user object or null
  const isAdmin = true; // Placeholder: Replace with actual admin check
  // ----------------------------- //

  // Function to fetch tournament details
  const fetchTournamentDetails = async () => {
      if (!tournamentId) return;
      setIsLoading(true);
      setError(null);
      // Clear previous action messages on refresh
      setRegistrationMessage(null);
      setRegistrationError(null);
      setScoreReportMessage(null);
      setScoreReportError(null);
      try {
          const response = await fetch(`/api/tournaments/${tournamentId}`);
          if (!response.ok) {
              if (response.status === 404) throw new Error('Tournament not found');
              throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data: TournamentDetails = await response.json();
          setTournament(data);
      } catch (err) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
    fetchTournamentDetails();
  }, [tournamentId]);

  const handleRegister = async () => {
    if (!tournamentId || isRegistering) return;
    setIsRegistering(true);
    setRegistrationMessage(null);
    setRegistrationError(null);
    try {
        const response = await fetch(`/api/tournaments/${tournamentId}/register`, {
            method: 'POST',
            headers: { /* Auth headers */ },
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result?.error || `Registration failed`);
        setRegistrationMessage(result?.message || "Successfully registered!");
        fetchTournamentDetails(); // Refresh data after successful registration
    } catch (err) {
        setRegistrationError(err instanceof Error ? err.message : 'Registration error');
    } finally {
        setIsRegistering(false);
    }
  };

  // --- Score Reporting Logic --- //
  const handleReportScore = async (matchId: number) => {
      if (!isAdmin || !tournamentId) return;

      const match = tournament?.matches?.find(m => m.id === matchId);
      if (!match || !match.player1_id || !match.player2_id) {
          setScoreReportError("Cannot report score for this match (missing players).");
          return;
      }

      // Simple prompt for demo - replace with modal/form UI
      const winnerInput = prompt(`Report winner for Match ${matchId} (P${match.player1_id} vs P${match.player2_id}): Enter winner ID (${match.player1_id} or ${match.player2_id})`);
      if (!winnerInput) return; // User cancelled
      const winnerId = parseInt(winnerInput, 10);

      if (isNaN(winnerId) || ![match.player1_id, match.player2_id].includes(winnerId)) {
          alert("Invalid winner ID entered.");
          return;
      }

      const scoreInput = prompt(`Enter final score (e.g., 7-5) for Match ${matchId}:`);
      if (scoreInput === null) return; // User cancelled
      const score = scoreInput.trim();
      if (!score) {
           alert("Score cannot be empty.");
           return;
      }
      // --- End prompt --- //

      setReportingScoreFor(matchId);
      setScoreReportMessage(null);
      setScoreReportError(null);

      try {
          const response = await fetch(`/api/tournaments/${tournamentId}/matches/${matchId}/complete`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  // Add Auth headers
              },
              body: JSON.stringify({ winner_id: winnerId, score: score }),
          });

          const result = await response.json();
          if (!response.ok) {
              throw new Error(result?.error || `Score reporting failed`);
          }

          setScoreReportMessage(`Score for Match ${matchId} reported successfully!`);
          fetchTournamentDetails(); // Refresh data to show updated match status/bracket

      } catch (err) {
          setScoreReportError(err instanceof Error ? err.message : 'Score reporting error');
      } finally {
          setReportingScoreFor(null);
      }
  };

  if (isLoading) return <Layout><div>Loading tournament details...</div></Layout>;
  if (error) return <Layout><div style={{ color: 'red' }}>Error: {error}</div></Layout>;
  if (!tournament) return <Layout><div>Tournament data not available.</div></Layout>;

  // Check if the current user is registered using the actual user state
  const isUserRegistered = currentUser && tournament.participants?.some(p => p.user_id === currentUser.id) || false;

  const renderMatches = () => {
      if (!tournament.matches || tournament.matches.length === 0) {
          return <p>No matches generated yet.</p>;
      }
      // Conditionally render bracket or list
      if (tournament.format === 'SINGLE_ELIMINATION' || tournament.format === 'DOUBLE_ELIMINATION') {
          return (
              <TournamentBracket
                  matches={tournament.matches}
                  participants={tournament.participants || []}
                  format={tournament.format}
                  bracket={tournament}
              />
          );
      } else {
          // Use MatchList for RR, Swiss, or others
          return (
              <MatchList
                  matches={tournament.matches}
                  onReportScore={handleReportScore}
                  isAdmin={isAdmin}
              />
          );
      }
  };

  return (
    <Layout>
      <div>
        <h1>{tournament.name}</h1>
        <p><strong>Status:</strong> {tournament.status}</p>
        <p><strong>Format:</strong> {tournament.format}</p>
        <p><strong>Starts:</strong> {new Date(tournament.start_date).toLocaleString()}</p>
        {tournament.description && <p><strong>Description:</strong> {tournament.description}</p>}
        {tournament.rules && <p><strong>Rules:</strong> {tournament.rules}</p>}
        {tournament.max_participants && <p><strong>Max Players:</strong> {tournament.max_participants}</p>}
        {tournament.entry_fee && <p><strong>Entry Fee:</strong> ${tournament.entry_fee.toFixed(2)}</p>}
        {tournament.prize_pool && <p><strong>Prize Pool:</strong> ${tournament.prize_pool.toFixed(2)}</p>}

        {/* Registration Button Logic */}
        {/* Show button only if user is logged in, tournament accepts registration, and user isn't already registered */}
        {currentUser && (tournament.status === 'PENDING' || tournament.status === 'REGISTRATION') && !isUserRegistered && (
          <button onClick={handleRegister} disabled={isRegistering}>
            {isRegistering ? 'Registering...' : 'Register Now'}
          </button>
        )}
        {registrationMessage && <div style={{ color: 'green', marginTop: '10px' }}>{registrationMessage}</div>}
        {registrationError && <div style={{ color: 'red', marginTop: '10px' }}>Error: {registrationError}</div>}

        {/* Show message if user is registered */}
        {currentUser && isUserRegistered && <p>You are registered for this tournament.</p>}

        {/* Participant List */}
        {tournament.participants && tournament.participants.length > 0 && (
          <div>
            <h2>Participants ({tournament.participants.length})</h2>
            <ul>
              {tournament.participants.map(p => (
                <li key={p.user_id}>{p.username} {p.seed ? `(Seed ${p.seed})` : ''}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Score Reporting Feedback */}
        {scoreReportMessage && <div style={{ color: 'green', marginTop: '10px' }}>{scoreReportMessage}</div>}
        {scoreReportError && <div style={{ color: 'red', marginTop: '10px' }}>Error: {scoreReportError}</div>}

        {/* Render Matches/Bracket */}
        {renderMatches()}

      </div>
    </Layout>
  );
};

export default TournamentDetailPage; 