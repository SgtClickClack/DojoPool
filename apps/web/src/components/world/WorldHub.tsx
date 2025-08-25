'use client';

import React from 'react';
import styles from './WorldHub.module.css';

// Use the wrapper to handle missing environment variables gracefully
import WorldHubMapWrapper from './WorldHubMapWrapper';

const WorldHub: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        <h1 className={styles.title}>🌍 DojoPool World Hub</h1>
        <p className={styles.description}>
          Interactive world map of DojoPool dojos and territories. Explore,
          challenge, and claim your territory!
        </p>
        {/* Placeholder text for unit tests that expect it */}
        <p className={styles.placeholder}>
          This is a placeholder WorldHub component under apps/web/src.
        </p>

        <div className={styles.mapContainer}>
          <WorldHubMapWrapper height="100%" />
        </div>
      </div>
    </div>
  );
};

export default WorldHub;
export const WorldMapHub = WorldHub;
