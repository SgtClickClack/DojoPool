import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@/components/__tests__/test-utils';
import JournalFeed from '../JournalFeed';
import { getMyJournal } from '@/services/APIService';
import type { JournalResponse } from '@/types/journal';
import { generateMockJournalResponse } from '@/utils/mockJournalData';

vi.mock('@/services/APIService', () => ({
  getMyJournal: vi.fn(),
}));

vi.mock('@/utils/mockJournalData', () => ({
  generateMockJournalResponse: vi.fn(),
}));

const mockedGetMyJournal = vi.mocked(getMyJournal);
const mockedGenerateMockJournalResponse = vi.mocked(generateMockJournalResponse);

const createResponse = (
  entries: JournalResponse['entries'],
  overrides: Partial<JournalResponse['pagination']> = {}
): JournalResponse => ({
  entries,
  pagination: {
    page: 1,
    limit: 20,
    total: entries.length,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
    ...overrides,
  },
});

describe('JournalFeed', () => {
  beforeEach(() => {
    mockedGetMyJournal.mockReset();
    mockedGenerateMockJournalResponse.mockReset();
    mockedGenerateMockJournalResponse.mockReturnValue(
      createResponse([
        {
          id: 'fallback-entry-1',
          type: 'SYSTEM_EVENT',
          message: 'System maintenance completed successfully',
          metadata: {},
          createdAt: '2024-01-02T00:00:00Z',
          userId: 'system',
        },
      ])
    );
  });

  it('renders journal entries after loading', async () => {
    mockedGetMyJournal.mockResolvedValue(
      createResponse([
        {
          id: 'entry-1',
          type: 'MATCH_PLAYED',
          message: 'Won the Night Tournament',
          metadata: {},
          createdAt: '2024-01-01T00:00:00Z',
          userId: 'user-1',
        },
      ])
    );

    render(<JournalFeed />);

    expect(await screen.findByText(/Won the Night Tournament/i)).toBeInTheDocument();
  });

  it('falls back to mock data when the API fails', async () => {
    mockedGetMyJournal.mockRejectedValue(new Error('API Error'));

    render(<JournalFeed />);

    await waitFor(() =>
      expect(mockedGenerateMockJournalResponse).toHaveBeenCalledWith(1, 20)
    );
    expect(
      await screen.findByText(/System maintenance completed successfully/i)
    ).toBeInTheDocument();
  });

  it('shows empty state when the API returns no entries', async () => {
    mockedGetMyJournal.mockResolvedValue(createResponse([]));

    render(<JournalFeed />);

    expect(await screen.findByText(/No journal entries yet/i)).toBeInTheDocument();
  });
});
