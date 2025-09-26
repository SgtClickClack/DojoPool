import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClanCard, { ClanCardProps } from '../ClanCard';
import type { Clan } from '@/types/clan';

// Mock Clan data with all required properties to match complete Clan type
const mockClan: Clan = {
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

const mockOnJoin = jest.fn();
const mockOnView = jest.fn();

const defaultProps: ClanCardProps = {
  id: mockClan.id,
  name: mockClan.name,
  description: mockClan.description,
  location: mockClan.location,
  memberCount: mockClan.members.length,
  treasury: mockClan.dojoCoinBalance!,
  leader: mockClan.leader!,
  clan: mockClan,
  onJoin: mockOnJoin,
  onView: mockOnView,
};

const clanWithMembers = {
  ...mockClan,
  members: [
    {
      id: 'member-1',
      clanId: 'clan-1',
      userId: 'user1',
      role: 'MEMBER',
      joinedAt: '2024-01-01T00:00:00Z',
    },
  ],
};

const propsWithMembers: ClanCardProps = {
  ...defaultProps,
  clan: clanWithMembers,
  memberCount: clanWithMembers.members.length,
};

const clanWithTerritories = {
  ...mockClan,
  territories: [
    {
      id: 'territory-1',
      venueId: 'venue-1',
      name: 'Test Territory',
      ownerId: undefined,
      clanId: 'clan-1',
      level: 1,
      defenseScore: 0,
      resources: '{}',
      strategicValue: 0,
      resourceRate: '{}',
      lastTickAt: undefined,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ],
};

const propsWithTerritories: ClanCardProps = {
  ...defaultProps,
  clan: clanWithTerritories,
};

const disabledProps: ClanCardProps = {
  ...defaultProps,
  disabled: true,
};

const minimalProps: ClanCardProps = {
  id: 'min-clan',
  name: 'Minimal Clan',
  description: 'Minimal description',
  location: 'Test Location',
  memberCount: 0,
  treasury: 0,
  leader: {
    id: 'leader-1',
    email: 'leader@example.com',
    username: 'Leader',
  },
  clan: {
    id: 'min-clan',
    name: 'Minimal Clan',
    tag: 'MIN',
    leaderId: 'leader-1',
    maxMembers: 50,
    dojoCoinBalance: 0,
    seasonalPoints: 0,
    level: 1,
    experience: 0,
    experienceToNext: 100,
    reputation: 0,
    isActive: true,
    location: 'Test Location',
    warWins: 0,
    warLosses: 0,
    territoryCount: 0,
    members: [],
    territories: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  onJoin: jest.fn(),
  onView: jest.fn(),
};

describe('ClanCard', () => {
  const customRender = (ui: React.ReactElement, options = {}) =>
    render(ui, {
      wrapper: ({ children }) => <div>{children}</div>,
      ...options,
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders clan information correctly', () => {
    customRender(<ClanCard {...defaultProps} />);
    
    expect(screen.getByText(mockClan.name)).toBeInTheDocument();
    expect(screen.getByText(mockClan.tag)).toBeInTheDocument();
    expect(screen.getByText(mockClan.description || '')).toBeInTheDocument();
  });

  it('displays member count', () => {
    customRender(<ClanCard {...defaultProps} />);
    
    expect(screen.getByText(`${mockClan.members.length}/${mockClan.maxMembers}`)).toBeInTheDocument();
  });

  it('shows clan treasury', () => {
    customRender(<ClanCard {...defaultProps} />);
    
    expect(screen.getByText(mockClan.dojoCoinBalance!.toString())).toBeInTheDocument();
  });

  it('handles join button click', () => {
    customRender(<ClanCard {...defaultProps} />);
    
    const joinButton = screen.getByRole('button', { name: /join/i });
    fireEvent.click(joinButton);
    
    expect(mockOnJoin).toHaveBeenCalledWith(mockClan.id);
  });

  it('handles view details click', () => {
    customRender(<ClanCard {...defaultProps} />);
    
    const viewButton = screen.getByRole('button', { name: /view details/i });
    fireEvent.click(viewButton);
    
    expect(mockOnView).toHaveBeenCalledWith(mockClan.id);
  });

  it('displays members when available', () => {
    customRender(<ClanCard {...propsWithMembers} />);
    
    expect(screen.getByText('ClanLeader')).toBeInTheDocument();
  });

  it('displays territories when available', () => {
    customRender(<ClanCard {...propsWithTerritories} />);
    
    expect(screen.getByText('Test Territory')).toBeInTheDocument();
  });

  it('renders disabled state correctly', () => {
    customRender(<ClanCard {...disabledProps} />);
    
    const joinButton = screen.getByRole('button', { name: /join/i });
    expect(joinButton).toBeDisabled();
  });

  it('handles minimal props without errors', () => {
    expect(() => customRender(<ClanCard {...minimalProps} />)).not.toThrow();
  });

  it('renders performance test case', async () => {
    customRender(<ClanCard {...defaultProps} />);
    
    expect(screen.getByText(mockClan.name)).toBeInTheDocument();
  }, 5000);
});
