import { apiClient } from '@/services/APIService';
import { websocketService } from '@/services/WebSocketService';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import React, { useEffect } from 'react';
import styles from './strategic-map.module.css';

const WorldHubMapWrapper = dynamic(
  () => import('@/components/world/WorldHubMapWrapper'),
  { ssr: false }
);

const StrategicMapPage: React.FC = () => {
  useEffect(() => {
    let isMounted = true;
    websocketService
      .connect()
      .then(() => {
        websocketService.emit('join_world_map', {
          playerId: 'viewer',
          playerName: 'Strategist',
        });
        websocketService.requestPlayerPositions();
      })
      .catch(() => {});

    // Preload strategic map data
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
        <title>Strategic Map - DojoPool</title>
      </Head>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Strategic Map</h1>
          <span>Manage territories and watch real-time updates</span>
        </div>
        <div className={styles.mapContainer}>
          <WorldHubMapWrapper height="100%" />
        </div>
      </div>
    </>
  );
};

export default StrategicMapPage;
