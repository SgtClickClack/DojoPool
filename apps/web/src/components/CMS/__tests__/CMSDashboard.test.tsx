import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@/components/__tests__/test-utils';
import CMSDashboard from '../CMSDashboard';
import { getCMSStats, type CMSStats } from '@/services/APIService';

vi.mock('@/services/APIService', () => ({
  getCMSStats: vi.fn(),
}));

vi.mock('../EventManagement', () => ({
  __esModule: true,
  default: () => <div data-testid="event-management" />,
}));

vi.mock('../NewsManagement', () => ({
  __esModule: true,
  default: () => <div data-testid="news-management" />,
}));

vi.mock('../SystemMessageManagement', () => ({
  __esModule: true,
  default: () => <div data-testid="system-message-management" />,
}));

vi.mock('../CMSTabs', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="cms-tabs">{children}</div>,
}));

const mockedGetCMSStats = vi.mocked(getCMSStats);

const createStats = (overrides: Partial<CMSStats> = {}): CMSStats => ({
  totalEvents: 15,
  totalNewsArticles: 25,
  totalSystemMessages: 10,
  activeSystemMessages: 7,
  pendingContent: 5,
  totalViews: 12345,
  totalLikes: 678,
  totalShares: 234,
  ...overrides,
});

describe('CMSDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetCMSStats.mockResolvedValue(createStats());
  });

  it('renders CMS statistics after fetching data', async () => {
    render(<CMSDashboard />);

    await waitFor(() => {
      expect(mockedGetCMSStats).toHaveBeenCalled();
    });

    expect(screen.getByText('Content Management System')).toBeInTheDocument();

    expect(screen.getByText('Total Events')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('News Articles')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('shows error alert when API fails', async () => {
    mockedGetCMSStats.mockRejectedValueOnce(new Error('API Error'));

    render(<CMSDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch CMS statistics')).toBeInTheDocument();
    });
  });

  it('falls back to mock data when API fails', async () => {
    mockedGetCMSStats.mockRejectedValueOnce(new Error('API Error'));

    render(<CMSDashboard />);

    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('28')).toBeInTheDocument();
    });
  });

  it('renders CMS management tabs', async () => {
    render(<CMSDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('cms-tabs')).toBeInTheDocument();
    });
  });
});
