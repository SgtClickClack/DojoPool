import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Leaderboard() {
    const [loading, setLoading] = useState(true);
    const [players, setPlayers] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchLeaderboard() {
            try {
                const response = await axios.get('/api/leaderboard');
                setPlayers(response.data);
            } catch (err) {
                console.error("Failed to fetch leaderboard:", err);
                setError('Failed to load leaderboard data.');
            } finally {
                setLoading(false);
            }
        }
        fetchLeaderboard();
    }, []);

    if (loading) return <div>Loading leaderboards...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div>
            <h2>Leaderboard</h2>
            <ul>
                {players.map(player => (
                    <li key={player.id}>
                        {player.name} – {player.score} points
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Leaderboard; 