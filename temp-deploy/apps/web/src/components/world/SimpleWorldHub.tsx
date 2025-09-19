'use client';

import { DojoData, PlayerData, dojoService } from '@/services/dojoService';
import React, { useEffect, useState } from 'react';
import styles from './SimpleWorldHub.module.css';

interface SimpleWorldHubProps {
  height?: string | number;
}

const SimpleWorldHub: React.FC<SimpleWorldHubProps> = ({ height = '100%' }) => {
  // Utility function to generate height class
  const getHeightClass = (heightValue: string | number) => {
    if (typeof heightValue === 'string') {
      if (heightValue === '100%') return 'h100';
      if (heightValue === '100vh') return 'h100vh';
      // Extract numeric value from strings like "200px"
      const match = heightValue.match(/(\d+)px/);
      if (match) {
        const num = parseInt(match[1]);
        if (num <= 900) return `h${Math.floor(num / 100) * 100}`;
      }
    } else if (typeof heightValue === 'number') {
      if (heightValue <= 900) return `h${Math.floor(heightValue / 100) * 100}`;
    }
    return 'h100'; // default fallback
  };

  const heightClass = getHeightClass(height);

  const [dojos, setDojos] = useState<DojoData[]>([]);
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch player data
        const player = await dojoService.getPlayerData();
        setPlayerData(player);

        // Fetch dojos in the Brisbane area
        const dojosData = await dojoService.getNearbyDojos(
          -27.4698,
          153.0251,
          10000
        );
        setDojos(dojosData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className={`${styles.loadingContainer} ${styles[heightClass]}`}>
        <p>Loading DojoPool world data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.errorContainer} ${styles[heightClass]}`}>
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className={`${styles.mainContainer} ${styles[heightClass]}`}>
      <h2 className={styles.title}>🌍 DojoPool World (Simplified)</h2>

      {playerData && (
        <div className={styles.playerInfo}>
          <h3>Player Info</h3>
          <p>Name: {playerData.username}</p>
          {playerData.clan && <p>Clan: {playerData.clan.name}</p>}
        </div>
      )}

      <div>
        <h3 className={styles.sectionTitle}>Nearby Dojos ({dojos.length})</h3>
        <div className={styles.dojosGrid}>
          {dojos.map((dojo) => (
            <div
              key={dojo.id}
              className={`${styles.dojoCard} ${
                dojo.isLocked
                  ? styles.locked
                  : dojo.controllingClanId
                    ? styles.controlled
                    : ''
              }`}
            >
              <h4 className={styles.dojoTitle}>
                {dojo.isLocked ? '🔒' : dojo.controllingClanId ? '🏰' : '🎯'}{' '}
                {dojo.name}
              </h4>
              <p className={styles.dojoStatus}>
                Status:{' '}
                {dojo.isLocked
                  ? 'Locked'
                  : dojo.controllingClanId
                    ? 'Controlled'
                    : 'Free'}
              </p>
              {dojo.controllingClan && (
                <p className={styles.dojoController}>
                  Controlled by: {dojo.controllingClan.name}
                </p>
              )}
              {dojo.distance && (
                <p className={styles.dojoDistance}>Distance: {dojo.distance}</p>
              )}
              <div className={styles.buttonContainer}>
                <button
                  className={styles.challengeButton}
                  disabled={dojo.isLocked}
                  onClick={() => console.log('Challenge dojo:', dojo.name)}
                >
                  {dojo.isLocked ? 'Locked' : 'Challenge'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimpleWorldHub;
