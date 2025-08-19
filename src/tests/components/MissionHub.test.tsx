import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import MissionHub from '@/components/missions/MissionHub';

vi.mock('@/services/missions', () => ({
  getCurrentMission: vi.fn(),
}));

const { getCurrentMission } = await import('@/services/missions');

describe('MissionHub component', () => {
  it('renders active state with progress bar and objectives', async () => {
    (getCurrentMission as unknown as vi.Mock).mockResolvedValueOnce({
      state: 'active',
      progress: 45,
      objectives: ['Sink 3 balls', 'Win the frame'],
    });

    render(<MissionHub />);

    const activeHeading = await screen.findByRole('heading', { name: /Mission Active/i });
    expect(activeHeading).toBeInTheDocument();

    const progress = screen.getByTestId('mission-progress');
    expect(progress).toHaveAttribute('aria-valuenow', '45');

    const list = screen.getByLabelText('Mission Objectives');
    const utils = within(list);
    expect(utils.getByText('Sink 3 balls')).toBeInTheDocument();
    expect(utils.getByText('Win the frame')).toBeInTheDocument();
  });

  it('renders completed state with victory message and rewards', async () => {
    (getCurrentMission as unknown as vi.Mock).mockResolvedValueOnce({
      state: 'completed',
      rewards: ['500 XP', 'Gold Ring'],
    });

    render(<MissionHub />);

    const completedHeading = await screen.findByRole('heading', { name: /Mission Completed/i });
    expect(completedHeading).toBeInTheDocument();
    expect(screen.getByText(/Congratulations!/)).toBeInTheDocument();

    const rewards = screen.getByLabelText('Mission Rewards');
    const utils = within(rewards);
    expect(utils.getByText('500 XP')).toBeInTheDocument();
    expect(utils.getByText('Gold Ring')).toBeInTheDocument();
  });

  it('renders failed state with failure message', async () => {
    (getCurrentMission as unknown as vi.Mock).mockResolvedValueOnce({
      state: 'failed',
    });

    render(<MissionHub />);

    const failedHeading = await screen.findByRole('heading', { name: /Mission Failed/i });
    expect(failedHeading).toBeInTheDocument();
    expect(screen.getByText(/Better luck next time/i)).toBeInTheDocument();
  });
});
