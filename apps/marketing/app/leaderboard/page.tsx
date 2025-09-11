'use client';

import { useEffect, useState } from 'react';

interface Player {
  id: string;
  username: string;
  skillRating: number;
  dojoCoinBalance: number;
}

const LeaderboardPage = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/v1/users/leaderboard?page=${page}&limit=10`
        );
        const data = await response.json();
        setPlayers(data);
      } catch (error) {
        console.error('Failed to fetch leaderboard', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [page]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Leaderboard</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2">Rank</th>
                <th className="py-2">Player</th>
                <th className="py-2">Skill Rating</th>
                <th className="py-2">Dojo Coins</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, index) => (
                <tr key={player.id}>
                  <td className="border px-4 py-2 text-center">
                    {(page - 1) * 10 + index + 1}
                  </td>
                  <td className="border px-4 py-2">{player.username}</td>
                  <td className="border px-4 py-2 text-center">
                    {player.skillRating}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    {player.dojoCoinBalance}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="bg-gray-300 px-4 py-2 rounded"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              className="bg-gray-300 px-4 py-2 rounded"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default LeaderboardPage;
