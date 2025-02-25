import React from 'react';
import RealTimeNotifications from '../components/RealTimeNotifications';

const RealTimePage: React.FC = () => {
  return (
    <div>
      <h1 style={{ textAlign: 'center', padding: '1rem' }}>
        Real-Time Notifications Prototype
      </h1>
      <RealTimeNotifications />
    </div>
  );
};

export default RealTimePage; 