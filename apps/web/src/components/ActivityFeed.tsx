import { useEffect, useState } from 'react';
import api from '../services/api';

interface Activity {
  id: string;
  type: string;
  details: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    profile: {
      avatarUrl: string;
    };
  };
}

const ActivityFeed = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchActivities = async (pageNum: number) => {
    setLoading(true);
    try {
      const response = await api.get(`/activity/feed?page=${pageNum}&limit=10`);
      if (response.data.length > 0) {
        setActivities((prev) => [...prev, ...response.data]);
        setPage(pageNum + 1);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to fetch activities', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities(1);
  }, []);

  const renderActivityDetails = (activity: Activity) => {
    const details = JSON.parse(activity.details || '{}');
    switch (activity.type) {
      case 'MATCH_WIN':
        return `defeated opponent with a score of ${details.scoreA} to ${details.scoreB}.`;
      case 'TOURNAMENT_WIN':
        return `won the ${details.tournamentName} tournament and a prize of ${details.prizePool} DojoCoins.`;
      default:
        return 'did something cool.';
    }
  };

  return (
    <div>
      <h2>Activity Feed</h2>
      <ul>
        {activities.map((activity) => (
          <li key={activity.id}>
            <strong>{activity.user.username}</strong>{' '}
            {renderActivityDetails(activity)}
            <br />
            <small>{new Date(activity.createdAt).toLocaleString()}</small>
          </li>
        ))}
      </ul>
      {loading && <p>Loading...</p>}
      {hasMore && !loading && (
        <button onClick={() => fetchActivities(page)}>Load More</button>
      )}
    </div>
  );
};

export default ActivityFeed;
