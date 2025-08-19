import { useEffect, useState } from 'react';

export interface User {
  id: string;
  username: string;
  email: string;
}

interface UseUsersReturn {
  data: User[] | undefined;
  error: unknown;
  isLoading: boolean;
}

export function useUsers(): UseUsersReturn {
  const [data, setData] = useState<User[] | undefined>(undefined);
  const [error, setError] = useState<unknown>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // Minimal mock to satisfy build; replace with real API integration
        const mock: User[] = [
          { id: '1', username: 'Alice', email: 'alice@example.com' },
          { id: '2', username: 'Bob', email: 'bob@example.com' },
        ];
        if (!cancelled) setData(mock);
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, error, isLoading };
}
