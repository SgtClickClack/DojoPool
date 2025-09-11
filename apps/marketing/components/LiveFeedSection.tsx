'use client';

import { useEffect, useState } from 'react';

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

const LiveFeedSection = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/v1/activity/feed?limit=5');
        const data = await response.json();
        setActivities(data);
      } catch (error) {
        console.error('Failed to fetch activities', error);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  const renderActivityDetails = (activity: Activity) => {
    const details = JSON.parse(activity.details || '{}');
    switch (activity.type) {
      case 'MATCH_WIN':
        return `defeated opponent with a score of ${details.scoreA} to ${details.scoreB}.`;
      case 'TOURNAMENT_WIN':
        return `won the ${details.tournamentName} tournament.`;
      default:
        return 'did something cool.';
    }
  };

  return (
    <section className="py-20">
      <h2 className="text-3xl font-bold text-center">Live Player Activity</h2>
      <div className="mt-12">
        {loading ? (
          <p className="text-center">Loading...</p>
        ) : (
          <ul>
            {activities.map((activity) => (
              <li key={activity.id} className="bg-gray-100 p-4 rounded-lg mb-4">
                <strong>{activity.user.username}</strong>{' '}
                {renderActivityDetails(activity)}
                <br />
                <small>{new Date(activity.createdAt).toLocaleString()}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default LiveFeedSection;
