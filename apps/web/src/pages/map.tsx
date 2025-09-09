import { apiClient } from '@/services/APIService';
import { websocketService } from '@/services/WebSocketService';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import React, { useEffect } from 'react';
import styles from './strategic-map.module.css'; // Reuse existing styles

const TacticalMap = dynamic(() => import('@/components/world/TacticalMap'), {
  ssr: false,
});

const MapPage: React.FC = () => {
  useEffect(() => {
    let isMounted = true;
    websocketService
      .connect()
      .then(() => {
        websocketService.emit('join_territory_map', {
          playerId: 'viewer',
          playerName: 'Strategist',
        });
        websocketService.requestPlayerPositions();
      })
      .catch(() => {});

    // Preload territory data
    apiClient
      .get('/v1/territories/map')
      .then(() => {})
      .catch(() => {});

    return () => {
      if (!isMounted) return;
      websocketService.disconnect();
      isMounted = false;
    };
  }, []);

  return (
    <>
      <Head>
        <title>Tactical Map - DojoPool</title>
      </Head>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Tactical Map</h1>
          <span>
            Claim territories, challenge rivals, and conquer the Dojo world
          </span>
        </div>
        <div className={styles.mapContainer}>
          <TacticalMap height="100%" />
        </div>
      </div>
    </>
  );
};

export default MapPage;
