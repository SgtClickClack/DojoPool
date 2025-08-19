import React, { useEffect, useMemo, useState } from 'react';
import {
  DojoMatch,
  DojoMatchesService,
} from '../../services/DojoMatchesService';
import styles from './DojoInterior.module.css';

interface DojoActiveMatchesProps {
  dojoId: string;
  maxMatches?: number;
}

const formatDuration = (startMs: number) => {
  const elapsed = Date.now() - startMs;
  const mins = Math.floor(elapsed / 60000);
  const secs = Math.floor((elapsed % 60000) / 1000);
  const mm = mins.toString().padStart(2, '0');
  const ss = secs.toString().padStart(2, '0');
  return `${mm}:${ss}`;
};

const DojoActiveMatches: React.FC<DojoActiveMatchesProps> = ({
  dojoId,
  maxMatches = 8,
}) => {
  const [matches, setMatches] = useState<DojoMatch[]>([]);
  const [tick, setTick] = useState(0); // to refresh timers every second

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const unsub = DojoMatchesService.subscribe(dojoId, setMatches);
    const interval = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      unsub && unsub();
      window.clearInterval(interval);
    };
  }, [dojoId]);

  const visible = useMemo(
    () => matches.slice(0, maxMatches),
    [matches, maxMatches]
  );

  if (matches.length === 0) {
    return (
      <div>
        <p className={styles.placeholderText}>No active matches</p>
        <div className={styles.matchPlaceholder}>
          <span className={styles.matchPlaceholderDot}>●</span>
          <span>Waiting for matches to start…</span>
        </div>
      </div>
    );
  }

  return (
    <ul
      className={styles.playersList}
      aria-live="polite"
      aria-label="Active matches list"
    >
      {visible.map((m) => (
        <li key={m.id} className={styles.matchItem}>
          <div className={styles.matchPlayers}>
            <span
              title={m.status}
              aria-label={m.status}
              className={`${styles.statusDot} ${
                m.status === 'in_progress' ? styles.inProgress : styles.paused
              }`}
            />
            <div className={styles.matchPlayer}>
              <img
                src={m.players[0].avatarUrl}
                alt={m.players[0].username}
                className={styles.playerAvatar}
              />
              <span className={styles.playerName}>{m.players[0].username}</span>
            </div>
            <span className={styles.matchVs}>vs</span>
            <div className={styles.matchPlayer}>
              <img
                src={m.players[1].avatarUrl}
                alt={m.players[1].username}
                className={styles.playerAvatar}
              />
              <span className={styles.playerName}>{m.players[1].username}</span>
            </div>
          </div>
          <div className={styles.matchInfo}>
            <span className={styles.matchDuration}>
              {formatDuration(m.startedAt)}
            </span>
            <span title={`Table ${m.table}`} className={styles.matchTable}>
              Tbl {m.table}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default DojoActiveMatches;
