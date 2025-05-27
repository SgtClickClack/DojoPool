import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PostGameAnalytics from '@/features/game/PostGameAnalytics';

// Mock fetch for analytics
beforeAll(() => {
  global.fetch = jest.fn().mockImplementation((url) => {
    if (url.includes('/api/games/')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          summary: 'Test summary',
          playerStats: {
            'Player 1': {
              accuracy: 90,
              potting_success: 80,
              position_control: 85,
              safety_success: 70,
              break_success: 60,
              total_shots: 20,
              successful_shots: 18,
              failed_shots: 2,
              total_fouls: 1,
              total_points: 50,
            },
          },
          highlights: [
            { id: 'hl1', description: 'Great shot!', timestamp: new Date().toISOString() },
          ],
          trends: {},
        }),
      });
    }
    return Promise.reject(new Error('Unknown endpoint'));
  });
});

afterAll(() => {
  // @ts-ignore
  global.fetch.mockRestore && global.fetch.mockRestore();
});

// Mock LiveCommentary to simulate commentary events
jest.mock('@/features/game/LiveCommentary', () => () => (
  <div data-testid="live-commentary-mock">
    <div>AI Commentary: Amazing break shot!</div>
    <audio data-testid="audio-player" src="http://localhost:8000/audio/game_end_123.mp3" />
  </div>
));

describe('PostGameAnalytics', () => {
  it('renders analytics and AI commentary/audio section', async () => {
    render(<PostGameAnalytics gameId="test-game-1" />);
    // Wait for analytics to load
    await waitFor(() => expect(screen.getByText('Post-Game Analytics')).toBeInTheDocument());
    expect(screen.getByText('Test summary')).toBeInTheDocument();
    // Check AI Commentary section
    expect(screen.getByText('AI Commentary & Audio')).toBeInTheDocument();
    expect(screen.getByTestId('live-commentary-mock')).toBeInTheDocument();
    expect(screen.getByText('AI Commentary: Amazing break shot!')).toBeInTheDocument();
    expect(screen.getByTestId('audio-player')).toBeInTheDocument();
  });
}); 