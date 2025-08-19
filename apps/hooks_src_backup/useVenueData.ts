import { useEffect, useState } from 'react';

export interface PoolTable {
  id: string;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
  currentMatch?: string;
}

export interface ActiveMatch {
  id: string;
  tableId: string;
  player1: string;
  player2: string;
  score: [number, number];
  startTime: string;
  gameType: string;
}

export interface VenueStats {
  activeTables: number;
  playersCheckedIn: number;
  todaysEarnings: number;
  totalTables: number;
}

export interface VenueData {
  id: string;
  name: string;
  stats: VenueStats;
  tables: PoolTable[];
  activeMatches: ActiveMatch[];
}

const mockVenueData: VenueData = {
  id: 'venue-001',
  name: 'The Golden Cue Lounge',
  stats: {
    activeTables: 5,
    playersCheckedIn: 12,
    todaysEarnings: 450,
    totalTables: 8,
  },
  tables: [
    { id: 'T1', status: 'IN_USE', currentMatch: 'match-001' },
    { id: 'T2', status: 'AVAILABLE' },
    { id: 'T3', status: 'IN_USE', currentMatch: 'match-002' },
    { id: 'T4', status: 'AVAILABLE' },
    { id: 'T5', status: 'IN_USE', currentMatch: 'match-003' },
    { id: 'T6', status: 'MAINTENANCE' },
    { id: 'T7', status: 'IN_USE', currentMatch: 'match-004' },
    { id: 'T8', status: 'AVAILABLE' },
  ],
  activeMatches: [
    {
      id: 'match-001',
      tableId: 'T1',
      player1: 'RyuKlaw',
      player2: 'ShadowStriker',
      score: [3, 2],
      startTime: '2024-01-15T14:30:00Z',
      gameType: '8-Ball',
    },
    {
      id: 'match-002',
      tableId: 'T3',
      player1: 'NeonNinja',
      player2: 'CyberQueen',
      score: [1, 4],
      startTime: '2024-01-15T15:00:00Z',
      gameType: '9-Ball',
    },
    {
      id: 'match-003',
      tableId: 'T5',
      player1: 'PoolMaster',
      player2: 'CueArtist',
      score: [2, 2],
      startTime: '2024-01-15T15:15:00Z',
      gameType: '8-Ball',
    },
    {
      id: 'match-004',
      tableId: 'T7',
      player1: 'DojoLegend',
      player2: 'TableTitan',
      score: [0, 5],
      startTime: '2024-01-15T15:30:00Z',
      gameType: '9-Ball',
    },
  ],
};

export const useVenueData = (venueId?: string) => {
  const [venueData, setVenueData] = useState<VenueData | null>(null);
  const [tables, setTables] = useState<PoolTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getVenueDashboardData = async (): Promise<VenueData> => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockVenueData;
  };

  const updateTableStatus = (tableId: string) => {
    setTables((prevTables) =>
      prevTables.map((table) => {
        if (table.id === tableId) {
          // Cycle through statuses: Available → In Use → Maintenance → Available
          const statusOrder = ['AVAILABLE', 'IN_USE', 'MAINTENANCE'];
          const currentIndex = statusOrder.indexOf(table.status);
          const nextIndex = (currentIndex + 1) % statusOrder.length;
          const newStatus = statusOrder[nextIndex] as
            | 'AVAILABLE'
            | 'IN_USE'
            | 'MAINTENANCE';

          return {
            ...table,
            status: newStatus,
            currentMatch:
              newStatus === 'AVAILABLE' ? undefined : table.currentMatch,
          };
        }
        return table;
      })
    );
  };

  useEffect(() => {
    const fetchVenueData = async () => {
      try {
        setLoading(true);
        const data = await getVenueDashboardData();
        setVenueData(data);
        setTables(data.tables);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch venue data'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchVenueData();
  }, [venueId]);

  const refreshData = async () => {
    try {
      setLoading(true);
      const data = await getVenueDashboardData();
      setVenueData(data);
      setTables(data.tables);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to refresh venue data'
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    venueData,
    tables,
    loading,
    error,
    refreshData,
    getVenueDashboardData,
    updateTableStatus,
  };
};
