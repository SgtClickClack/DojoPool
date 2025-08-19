import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMapData } from '../../hooks/useMapData';
import { CurrentUserService } from '../../services/CurrentUserService';
import { DojoMatchesService } from '../../services/DojoMatchesService';
import {
  DojoPresenceService,
  PresenceUser,
} from '../../services/DojoPresenceService';
import { DojoMapPin } from '../../types/map';
import ChallengePlayerModal from './ChallengePlayerModal';
import DojoActiveMatches from './DojoActiveMatches';
import styles from './DojoInterior.module.css';
import DojoLeaderboard from './DojoLeaderboard';
import JoinTournamentModal from './JoinTournamentModal';
import ViewScheduleModal from './ViewScheduleModal';

interface DojoInteriorProps {
  dojoId: string;
  onExit: () => void;
}

const HEARTBEAT_MS = 30_000;

const DojoInterior: React.FC<DojoInteriorProps> = ({ dojoId, onExit }) => {
  const { dojos } = useMapData();
  const [dojo, setDojo] = useState<DojoMapPin | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [activePlayers, setActivePlayers] = useState<PresenceUser[]>([]);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const me = useMemo(() => CurrentUserService.getCurrentUser(), []);
  const heartbeatRef = useRef<number | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const foundDojo = dojos.find((d) => d.id === dojoId);
    setDojo(foundDojo || null);
  }, [dojoId, dojos]);

  // subscribe to presence updates and initialize checked-in state
  useEffect(() => {
    // cleanup previous
    if (unsubRef.current) unsubRef.current();
    if (heartbeatRef.current) {
      window.clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }

    // subscribe for this dojo
    unsubRef.current = DojoPresenceService.subscribe(dojoId, (users) => {
      setActivePlayers(users);
      setIsCheckedIn(users.some((u) => u.id === me.id));
    });

    // initialize state from storage in case no storage event fires
    setIsCheckedIn(DojoPresenceService.isCheckedIn(dojoId, me.id));
    setActivePlayers(DojoPresenceService.getActive(dojoId));

    // heartbeat if currently checked in
    if (DojoPresenceService.isCheckedIn(dojoId, me.id)) {
      heartbeatRef.current = window.setInterval(() => {
        DojoPresenceService.heartbeat(dojoId, me.id);
      }, HEARTBEAT_MS);
    }

    return () => {
      // auto checkout when leaving this dojo view
      DojoPresenceService.checkOut(dojoId, me.id);
      if (unsubRef.current) unsubRef.current();
      if (heartbeatRef.current) window.clearInterval(heartbeatRef.current);
      unsubRef.current = null;
      heartbeatRef.current = null;
    };
  }, [dojoId, me.id]);

  const handleCheckIn = () => {
    if (!isCheckedIn) {
      DojoPresenceService.checkIn(dojoId, me);
      setIsCheckedIn(true);
      // start heartbeat
      if (!heartbeatRef.current) {
        heartbeatRef.current = window.setInterval(() => {
          DojoPresenceService.heartbeat(dojoId, me.id);
        }, HEARTBEAT_MS);
      }
    }
  };

  const handleCheckOut = () => {
    if (isCheckedIn) {
      DojoPresenceService.checkOut(dojoId, me.id);
      setIsCheckedIn(false);
      if (heartbeatRef.current) {
        window.clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    }
  };

  const handleExit = () => {
    // auto check-out on exit for clean presence
    handleCheckOut();
    onExit();
  };

  const handleCreateSampleMatches = () => {
    DojoMatchesService.createSampleMatches(dojoId);
  };

  const handleChallengePlayer = () => {
    setShowChallengeModal(true);
  };

  const handleJoinTournament = () => {
    setShowTournamentModal(true);
  };

  const handleViewSchedule = () => {
    setShowScheduleModal(true);
  };

  if (!dojo) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Dojo Not Found</h2>
          <p>The requested Dojo could not be found.</p>
          <button onClick={handleExit} className={styles.backButton}>
            Return to Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.dojoInfo}>
          <div className={styles.clanLogo}>
            <img
              src={dojo.clanLogoUrl}
              alt={`${dojo.controllingClan} logo`}
              className={styles.logoImage}
            />
          </div>
          <div className={styles.dojoDetails}>
            <h1 className={styles.dojoName}>{dojo.name}</h1>
            <p className={styles.clanName}>{dojo.controllingClan}</p>
            <p className={styles.address}>{dojo.address}</p>
          </div>
        </div>
        <button onClick={handleExit} className={styles.backButton}>
          ← Return to Map
        </button>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Check-in Status */}
        <div className={styles.checkInSection}>
          {isCheckedIn ? (
            <div className={styles.checkedInStatus}>
              <span className={styles.statusIcon}>✓</span>
              <span>Checked In</span>
              <button
                onClick={handleCheckOut}
                className={styles.checkOutButton}
              >
                Check Out
              </button>
            </div>
          ) : (
            <button onClick={handleCheckIn} className={styles.checkInButton}>
              Check In
            </button>
          )}
        </div>

        {/* Main Panels Grid */}
        <div className={styles.panelsGrid}>
          {/* Active Players Panel */}
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Active Players</h3>
            <div className={styles.panelContent}>
              {activePlayers.length === 0 ? (
                <p className={styles.placeholderText}>
                  No players are currently checked in.
                </p>
              ) : (
                <ul className={styles.playersList}>
                  {activePlayers.map((p) => (
                    <li key={p.id} className={styles.playerItem}>
                      <img
                        src={p.avatarUrl}
                        alt={p.username}
                        className={styles.playerAvatar}
                      />
                      <div className={styles.playerInfo}>
                        <span className={styles.playerName}>{p.username}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className={styles.playerCount}>
                <span className={styles.countNumber}>
                  {activePlayers.length}
                </span>
                <span className={styles.countLabel}>Players Online</span>
              </div>
            </div>
          </div>

          {/* Dojo Leaderboard Panel */}
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Dojo Leaderboard</h3>
            <div className={styles.panelContent}>
              <DojoLeaderboard dojoId={dojoId} />
            </div>
          </div>

          {/* Active Matches Panel */}
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Active Matches</h3>
            <div className={styles.panelContent}>
              <DojoActiveMatches dojoId={dojoId} />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <button
            onClick={handleChallengePlayer}
            className={styles.actionButton}
          >
            Challenge Player
          </button>
          <button
            onClick={handleJoinTournament}
            className={styles.actionButton}
          >
            Join Tournament
          </button>
          <button onClick={handleViewSchedule} className={styles.actionButton}>
            View Schedule
          </button>
          <button
            onClick={handleCreateSampleMatches}
            className={styles.actionButton}
          >
            Create Sample Matches
          </button>
        </div>
      </main>

      {/* Challenge Player Modal */}
      <ChallengePlayerModal
        isOpen={showChallengeModal}
        onClose={() => setShowChallengeModal(false)}
        dojoId={dojoId}
        dojoName={dojo?.name || 'Unknown Dojo'}
        activePlayers={activePlayers}
        currentUserId={me.id}
      />

      {/* Join Tournament Modal */}
      <JoinTournamentModal
        isOpen={showTournamentModal}
        onClose={() => setShowTournamentModal(false)}
        dojoId={dojoId}
        dojoName={dojo?.name || 'Unknown Dojo'}
        currentUserId={me.id}
      />

      {/* View Schedule Modal */}
      <ViewScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        dojoId={dojoId}
        dojoName={dojo?.name || 'Unknown Dojo'}
      />
    </div>
  );
};

export default DojoInterior;
