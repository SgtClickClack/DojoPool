import '@testing-library/jest-dom';
import type { ReactNode } from 'react';
import React from 'react';
import { vi } from 'vitest';

vi.mock('next-auth/react', async () => {
  const actual =
    await vi.importActual<typeof import('next-auth/react')>('next-auth/react');

  return {
    ...actual,
    useSession: () => ({
      data: {
        user: {
          name: 'Test User',
          email: 'test@example.com',
          role: 'ADMIN',
        },
      },
      status: 'authenticated',
    }),
    signIn: vi.fn(),
    signOut: vi.fn(),
    SessionProvider: ({ children }: { children: ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  } as typeof actual;
});

// Global mock for any other modules causing issues
// vi.mock('@/components', () => ({ /* ... */ }));
