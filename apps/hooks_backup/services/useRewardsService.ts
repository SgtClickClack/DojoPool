import { useCallback, useState } from 'react';
import { type RewardItem } from '../../../../packages/types/src/types/rewards'; // Updated import path
// import { apiClient } from '../../api/apiClient'; // Assuming an axios instance or similar

// Mirrors RewardItem from RewardsDisplayPanel.tsx, should be centralized in types/
// interface RewardItem {
//   id: string;
//   name: string;
//   description: string;
//   imageUrl?: string;
//   type: 'NFT' | 'Item' | 'Badge';
//   earnedDate: string;
//   // Potentially other details like transactionId, rarity, etc.
// }

interface UseRewardsServiceReturn {
  rewards: RewardItem[];
  loading: boolean;
  error: string | null;
  fetchRewards: (userId: string) => Promise<void>;
}

const useRewardsService =
  (/* initialUserId?: string */): UseRewardsServiceReturn => {
    const [rewards, setRewards] = useState<RewardItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRewards = useCallback(async (userId: string) => {
      if (!userId) {
        // setError('User ID is required to fetch rewards.');
        // setRewards([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/rewards/user/${userId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch rewards: ${response.statusText}`);
        }
        const data: RewardItem[] = await response.json();
        setRewards(data);
      } catch (err: any) {
        console.error('Error fetching rewards:', err);
        setError(err.message || 'Failed to fetch rewards');
        setRewards([]);
      } finally {
        setLoading(false);
      }
    }, []);

    // Optional: Auto-fetch if initialUserId is provided
    // useEffect(() => {
    //   if (initialUserId) {
    //     fetchRewards(initialUserId);
    //   }
    // }, [initialUserId, fetchRewards]);

    return { rewards, loading, error, fetchRewards };
  };

export default useRewardsService;
