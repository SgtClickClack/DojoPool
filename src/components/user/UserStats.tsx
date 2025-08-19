import React, { useEffect, useState } from 'react';
import type { FC } from 'react';
import { getUserStatsWithRings } from '@/services/userStats';

export interface CueRing {
  id: string;
  name: string;
  color?: string;
}

export interface UserStatsData {
  name: string;
  rings: CueRing[];
}

interface UserStatsProps {
  data?: UserStatsData;
  loader?: () => Promise<UserStatsData>;
}

const UserStats: FC<UserStatsProps> = ({ data, loader }) => {
  const [state, setState] = useState<UserStatsData | null>(data ?? null);
  const [loading, setLoading] = useState<boolean>(!data);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      if (state) return;
      try {
        setLoading(true);
        const result = await (loader ? loader() : getUserStatsWithRings());
        if (isMounted) setState(result);
      } catch (e) {
        if (isMounted) setError(e instanceof Error ? e.message : 'Failed to load user stats');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    void run();
    return () => {
      isMounted = false;
    };
  }, [loader, state]);

  if (loading) return <div role="status">Loading user stats…</div>;
  if (error) return <div role="alert">{error}</div>;
  if (!state) return null;

  return (
    <section aria-label="User Stats">
      <h2>{state.name}</h2>
      <p>
        Total Rings: <strong>{state.rings.length}</strong>
      </p>
      <div aria-label="Cue Rings" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {state.rings.map((ring) => (
          <div
            key={ring.id}
            data-testid={`ring-${ring.id}`}
            aria-label={`Cue Ring: ${ring.name}`}
            role="img"
            title={ring.name}
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              backgroundColor: ring.color ?? '#ccc',
              display: 'inline-block',
              border: '2px solid #222',
            }}
          />
        ))}
      </div>
    </section>
  );
};

export default UserStats;
