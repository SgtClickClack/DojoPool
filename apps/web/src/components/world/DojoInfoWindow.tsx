import React from 'react';
import { DojoData } from '@/services/dojoService';
import styles from './WorldHubMap.module.css';

interface DojoInfoWindowProps {
  dojo: DojoData;
  isRival: boolean;
  isLeader: boolean;
  onClose: () => void;
  onChallenge: (dojoId: string) => void;
  onViewDetails: (dojoId: string) => void;
  onShadowRun: () => void;
}

export const DojoInfoWindow: React.FC<DojoInfoWindowProps> = ({
  dojo,
  isRival,
  isLeader,
  onClose,
  onChallenge,
  onViewDetails,
  onShadowRun,
}) => {
  return (
    <div className={styles.infoWindowContent}>
      <h3 className={styles.infoWindowTitle}>{dojo.name}</h3>
      <p className={styles.infoWindowText}>
        {dojo.isLocked
          ? 'Locked'
          : dojo.controllingClan
            ? 'Controlled'
            : 'Available'}
      </p>
      <div className={styles.infoWindowSection}>
        <strong>Coordinates:</strong>{' '}
        {dojo.coordinates.lat.toFixed(4)}, {dojo.coordinates.lng.toFixed(4)}
      </div>
      <div className={styles.infoWindowSection}>
        <strong>Status:</strong>{' '}
        {dojo.isLocked
          ? 'Locked'
          : dojo.controllingClan
            ? 'Controlled'
            : 'Free'}
      </div>
      {dojo.controllingClan && (
        <div className={styles.infoWindowSection}>
          <strong>Controlled by:</strong>
          <div className={styles.controllerContainer}>
            <div>
              <div className={styles.clanName}>
                {dojo.controllingClan.name}
              </div>
            </div>
          </div>
        </div>
      )}
      {dojo.distance && (
        <div className={styles.infoWindowSection}>
          <strong>Distance:</strong> {dojo.distance}
        </div>
      )}
      {dojo.isLocked && (
        <div className={styles.infoWindowSection}>
          <strong>Status:</strong> 🔒 Locked
        </div>
      )}
      <div className={styles.buttonRow}>
        <button
          onClick={() => onChallenge(dojo.id)}
          className={styles.challengeButton}
        >
          Challenge
        </button>
        <button
          onClick={() => onViewDetails(dojo.id)}
          className={styles.viewDetailsButton}
        >
          View Details
        </button>
      </div>
      {isRival && isLeader && (
        <button
          onClick={onShadowRun}
          className={styles.shadowRunButton}
        >
          Initiate Shadow Run
        </button>
      )}
    </div>
  );
};
