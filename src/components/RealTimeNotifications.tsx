import React, { useEffect, useState } from 'react';
import Pusher from 'pusher-js';

const RealTimeNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    // Enable Pusher logging - disable in production
    Pusher.logToConsole = true;

    // Initialize Pusher with your credentials.
    // Replace 'YOUR_PUSHER_KEY' and 'YOUR_CLUSTER' with your actual Pusher credentials.
    const pusher = new Pusher('YOUR_PUSHER_KEY', {
      cluster: 'YOUR_CLUSTER',
    });

    // Subscribe to the channel for DojoPool game events.
    const channel = pusher.subscribe('dojo-pool-channel');

    // Bind to the game event and update notifications.
    channel.bind('game-event', (data: any) => {
      setNotifications((prev) => [...prev, JSON.stringify(data)]);
    });

    // Clean up on component unmount
    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, []);

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Real-Time Notifications</h2>
      {notifications.length === 0 ? (
        <p>No notifications yet.</p>
      ) : (
        <ul>
          {notifications.map((note, index) => (
            <li key={index}>{note}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RealTimeNotifications; 