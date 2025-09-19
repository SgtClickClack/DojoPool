import React from 'react';
import styles from './AchievementsList.module.css';

const AchievementsList: React.FC = () => {
  return (
    <div
      role="region"
      aria-label="AchievementsList placeholder"
      className={styles['achievements-list-placeholder']}
    >
      Achievements List (placeholder)
    </div>
  );
};

export default AchievementsList;
