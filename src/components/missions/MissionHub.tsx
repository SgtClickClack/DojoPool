import React, { useEffect, useState } from 'react';
import type { FC } from 'react';
import { getCurrentMission } from '@/services/missions';

export type MissionState = 'active' | 'completed' | 'failed';

export interface MissionData {
  state: MissionState;
  objectives?: string[];
  progress?: number; // 0..100
  rewards?: string[];
}

interface MissionHubProps {
  mission?: MissionData;
  loader?: () => Promise<MissionData>;
}

const MissionHub: FC<MissionHubProps> = ({ mission, loader }) => {
  const [state, setState] = useState<MissionData | null>(mission ?? null);
  const [loading, setLoading] = useState<boolean>(!mission);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      if (state) return;
      try {
        setLoading(true);
        const result = await (loader ? loader() : getCurrentMission());
        if (isMounted) setState(result);
      } catch (e) {
        if (isMounted) setError(e instanceof Error ? e.message : 'Failed to load mission');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    void run();
    return () => {
      isMounted = false;
    };
  }, [loader, state]);

  if (loading) return <div role="status">Loading mission…</div>;
  if (error) return <div role="alert">{error}</div>;
  if (!state) return null;

  if (state.state === 'active') {
    return (
      <section aria-label="Active Mission">
        <h2>Mission Active</h2>
        <div
          role="progressbar"
          aria-valuenow={state.progress ?? 0}
          aria-valuemin={0}
          aria-valuemax={100}
          data-testid="mission-progress"
          style={{ width: 200, height: 12, background: '#eee', position: 'relative', borderRadius: 6 }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: `${state.progress ?? 0}%`,
              background: '#4caf50',
              borderRadius: 6,
            }}
          />
        </div>
        <ul aria-label="Mission Objectives">
          {(state.objectives ?? []).map((obj, idx) => (
            <li key={idx}>{obj}</li>
          ))}
        </ul>
      </section>
    );
  }

  if (state.state === 'completed') {
    return (
      <section aria-label="Completed Mission">
        <h2>Mission Completed</h2>
        <p>Congratulations! You have completed the mission.</p>
        <h3>Rewards</h3>
        <ul aria-label="Mission Rewards">
          {(state.rewards ?? []).map((rwd, idx) => (
            <li key={idx}>{rwd}</li>
          ))}
        </ul>
      </section>
    );
  }

  // failed
  return (
    <section aria-label="Failed Mission">
      <h2>Mission Failed</h2>
      <p>Better luck next time.</p>
    </section>
  );
};

export default MissionHub;
