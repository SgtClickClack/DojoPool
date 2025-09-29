import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@/components/__tests__/test-utils';
import ClanCard, { type ClanCardProps } from '../ClanCard';
import type { Clan } from '@/types/clan';

const baseClan: Clan = {
  id: 'clan-1',
  name: 'Test Clan',
  description: 'A test clan for testing',
  motto: 'Unity and Strength',
  logo: '/logo.png',
  banner: '/banner.png',
  tag: 'TEST',
  leaderId: 'leader-1',
  maxMembers: 50,
  dojoCoinBalance: 1000,
  seasonalPoints: 500,
  level: 1,
  experience: 0,
  experienceToNext: 100,
  reputation: 100,
  isActive: true,
  location: 'Test Location',
  warWins: 5,
  warLosses: 3,
  territoryCount: 2,
  leader: {
    id: 'leader-1',
    email: 'leader@example.com',
    username: 'ClanLeader',
  },
  members: [],
  territories: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const onJoin = vi.fn();
const onView = vi.fn();

const buildProps = (overrides: Partial<ClanCardProps> = {}): ClanCardProps => ({
  id: baseClan.id,
  name: baseClan.name,
  description: baseClan.description,
  location: baseClan.location,
  memberCount: baseClan.members.length,
  treasury: baseClan.dojoCoinBalance ?? 0,
  leader: baseClan.leader!,
  clan: baseClan,
  onJoin,
  onView,
  disabled: false,
  ...overrides,
});

describe('ClanCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders core clan details', () => {
    render(<ClanCard {...buildProps()} />);

    expect(screen.getByText('Test Clan')).toBeInTheDocument();
    expect(screen.getByText('A test clan for testing')).toBeInTheDocument();
    expect(screen.getByText('Test Location')).toBeInTheDocument();
    expect(screen.getByText(/0\s+members/i)).toBeInTheDocument();
    expect(screen.getByText(/Treasury:\s+1000\s+DojoCoins/i)).toBeInTheDocument();
    expect(screen.getByText(/Level:\s+1/)).toBeInTheDocument();
    expect(screen.getByText(/Reputation:\s+100/)).toBeInTheDocument();
  });

  it('calls join handler when join button is clicked', () => {
    render(<ClanCard {...buildProps()} />);

    fireEvent.click(screen.getByRole('button', { name: /join clan/i }));
    expect(onJoin).toHaveBeenCalledWith(baseClan.id);
  });

  it('calls view handler when view button is clicked', () => {
    render(<ClanCard {...buildProps()} />);

    fireEvent.click(screen.getByRole('button', { name: /view details/i }));
    expect(onView).toHaveBeenCalledWith(baseClan.id);
  });

  it('disables join button when disabled prop is true', () => {
    render(<ClanCard {...buildProps({ disabled: true })} />);

    expect(screen.getByRole('button', { name: /join clan/i })).toBeDisabled();
  });

  it('shows updated member count when provided', () => {
    const clanWithMembers = {
      ...baseClan,
      members: [
        {
          id: 'member-1',
          clanId: 'clan-1',
          userId: 'user-1',
          role: 'MEMBER',
          joinedAt: '2024-01-02T00:00:00Z',
        },
      ],
    } satisfies Clan;

    render(
      <ClanCard
        {...buildProps({
          clan: clanWithMembers,
          memberCount: clanWithMembers.members.length,
        })}
      />
    );

    expect(screen.getByText(/1\s+members/i)).toBeInTheDocument();
  });

  it('renders minimal props without crashing', () => {
    expect(() =>
      render(
        <ClanCard
          {...buildProps({
            description: undefined,
            treasury: 0,
            clan: { ...baseClan, description: undefined },
          })}
        />
      )
    ).not.toThrow();
  });
});
