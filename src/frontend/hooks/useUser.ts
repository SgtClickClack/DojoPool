import { useMemo } from 'react';

export function useUser() {
  // Minimal mock for test and dev
  const [user, setUser] = useMemo(() => ([
    {
      id: 'test-user',
      username: 'Test User',
      tournaments: [],
      teams: [],
    },
    () => {},
  ]), []);

  const updateUser = (updatedUser: any) => {
    // No-op for mock, but could update state if needed
  };

  return {
    user,
    updateUser,
    loading: false,
  };
} 