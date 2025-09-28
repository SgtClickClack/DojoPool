import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/components/__tests__/test-utils';
import ActivityFeed from '@/components/ActivityFeed';
import { getActivityFeed } from '@/services/APIService';
import type { ActivityFeedResponse } from '@/types/activity';

vi.mock('@/services/APIService', () => ({
  getActivityFeed: vi.fn(),
}));

const mockResponse = (
  overrides: Partial<ActivityFeedResponse> = {}
): ActivityFeedResponse => ({
  entries: [
    {
      id: 'event-1',
      type: 'tournament_won',
      title: 'Won the Night Tournament',
      description: 'Dominated the midnight bracket',
      userId: 'user-1',
      username: 'NeonSamurai',
      createdAt: new Date().toISOString(),
      isPublic: true,
    },
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  },
  ...overrides,
});

describe('ActivityFeed (integration)', () => {
  const mockedGetActivityFeed = vi.mocked(getActivityFeed);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders activity entries after loading resolves', async () => {
    mockedGetActivityFeed.mockResolvedValueOnce(mockResponse());

    render(<ActivityFeed filter="global" />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Won the Night Tournament')).toBeInTheDocument();
  });

  it('renders error state when API call fails', async () => {
    mockedGetActivityFeed.mockRejectedValueOnce(new Error('network down'));

    render(<ActivityFeed filter="global" />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    const errorBanner = await screen.findByRole('alert');
    expect(errorBanner).toHaveTextContent('network down');
  });

  it('supports friends filter and refresh flow', async () => {
    mockedGetActivityFeed.mockResolvedValueOnce(
      mockResponse({
        entries: [
          {
            id: 'event-2',
            type: 'clan_joined',
            title: 'Clanmate joined your squad',
            description: 'New member from Kyoto Arcade',
            userId: 'user-2',
            username: 'CyberNeko',
            createdAt: new Date().toISOString(),
            isPublic: true,
          },
        ],
      })
    );

    render(<ActivityFeed filter="friends" />);

    expect(await screen.findByText('Friends Activity')).toBeInTheDocument();
    expect(screen.getByText('Clanmate joined your squad')).toBeInTheDocument();
  });
});
