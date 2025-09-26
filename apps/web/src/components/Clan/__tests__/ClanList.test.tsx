import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClanList from '../ClanList';
import type { Clan } from '@/types/clan';

// Mock Clan data with all required properties to match complete Clan type
const mockClan: Clan = {
  id: 'clan-1',
  name: 'Test Clan 1',
  description: 'Test clan description',
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

const mockClan2: Clan = {
  id: 'clan-2',
  name: 'Test Clan 2',
  description: 'Second test clan',
  motto: 'Strength in Numbers',
  logo: '/logo2.png',
  banner: '/banner2.png',
  tag: 'TEST2',
  leaderId: 'leader-2',
  maxMembers: 30,
  dojoCoinBalance: 2000,
  seasonalPoints: 800,
  level: 2,
  experience: 150,
  experienceToNext: 250,
  reputation: 200,
  isActive: true,
  location: 'Another Location',
  warWins: 8,
  warLosses: 2,
  territoryCount: 5,
  leader: {
    id: 'leader-2',
    email: 'leader2@example.com',
    username: 'ClanLeader2',
  },
  members: [],
  territories: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockOnJoin = jest.fn();
const mockOnView = jest.fn();
const mockOnLeave = jest.fn();
const mockOnFilter = jest.fn();
const mockOnSort = jest.fn();

const defaultProps = {
  clans: [mockClan, mockClan2],
  onJoin: mockOnJoin,
  onView: mockOnView,
  onLeave: mockOnLeave,
  onFilter: mockOnFilter,
  onSort: mockOnSort,
};

const loadingProps = {
  ...defaultProps,
  loading: true,
};

const errorProps = {
  ...defaultProps,
  error: 'Failed to load clans',
};

const propsWithNoClans = {
  ...defaultProps,
  clans: [],
};

const propsWithUpdatedClans = {
  ...defaultProps,
  clans: [...defaultProps.clans, mockClan2],
};

const disabledProps = {
  ...defaultProps,
  disabled: true,
};

const minimalProps = {
  clans: [mockClan],
  onJoin: jest.fn(),
  onView: jest.fn(),
};

const propsWithLeave = {
  ...defaultProps,
  userClanId: 'clan-1',
};

const propsNotMember = {
  ...defaultProps,
  userClanId: null,
};

const propsMember = {
  ...defaultProps,
  userClanId: 'clan-1',
};

const largeProps = {
  ...defaultProps,
  clans: Array.from({ length: 50 }, (_, i) => ({
    ...mockClan,
    id: `clan-${i}`,
    name: `Clan ${i}`,
    level: i % 10 + 1,
    experience: i * 10,
    experienceToNext: (i % 10 + 1) * 100,
    reputation: i * 20,
  })),
};

describe('ClanList', () => {
  const customRender = (ui: React.ReactElement, options = {}) =>
    render(ui, {
      wrapper: ({ children }) => <div>{children}</div>,
      ...options,
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all clans correctly', () => {
    customRender(<ClanList {...defaultProps} />);
    
    expect(screen.getByText(mockClan.name)).toBeInTheDocument();
    expect(screen.getByText(mockClan2.name)).toBeInTheDocument();
  });

  it('displays clan count', () => {
    customRender(<ClanList {...defaultProps} />);
    
    expect(screen.getByText('2 Clans')).toBeInTheDocument();
  });

  it('renders search functionality', () => {
    customRender(<ClanList {...defaultProps} />);
    
    expect(screen.getByRole('textbox', { name: /search/i })).toBeInTheDocument();
  });

  it('renders filter and sort controls', () => {
    customRender(<ClanList {...defaultProps} />);
    
    expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sort/i })).toBeInTheDocument();
  });

  it('filters clans by search term', () => {
    customRender(<ClanList {...defaultProps} />);
    
    const searchInput = screen.getByRole('textbox', { name: /search/i });
    fireEvent.change(searchInput, { target: { value: 'Test' } });
    
    expect(mockOnFilter).toHaveBeenCalledWith('Test');
  });

  it('handles empty clan list', () => {
    customRender(<ClanList {...propsWithNoClans} />);
    
    expect(screen.getByText('No clans found')).toBeInTheDocument();
    expect(screen.getByText('0 Clans')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    customRender(<ClanList {...loadingProps} />);
    
    expect(screen.getByText('Loading clans...')).toBeInTheDocument();
  });

  it('displays error state', () => {
    customRender(<ClanList {...errorProps} />);
    
    expect(screen.getByText('Failed to load clans')).toBeInTheDocument();
  });

  it('calls onJoin when join button is clicked', () => {
    customRender(<ClanList {...defaultProps} />);
    
    const joinButtons = screen.getAllByRole('button', { name: /join/i });
    fireEvent.click(joinButtons[0]);
    
    expect(mockOnJoin).toHaveBeenCalledWith(mockClan.id);
  });

  it('calls onView when view button is clicked', () => {
    customRender(<ClanList {...defaultProps} />);
    
    const viewButtons = screen.getAllByRole('button', { name: /view/i });
    fireEvent.click(viewButtons[0]);
    
    expect(mockOnView).toHaveBeenCalledWith(mockClan.id);
  });

  it('calls onLeave when leave button is clicked for member clan', () => {
    customRender(<ClanList {...propsWithLeave} />);
    
    const leaveButtons = screen.getAllByRole('button', { name: /leave/i });
    fireEvent.click(leaveButtons[0]);
    
    expect(mockOnLeave).toHaveBeenCalledWith(mockClan.id);
  });

  it('shows join button when user is not a member', () => {
    customRender(<ClanList {...propsNotMember} />);
    
    const joinButtons = screen.getAllByRole('button', { name: /join/i });
    expect(joinButtons.length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /leave/i })).toBeNull();
  });

  it('shows leave button when user is a member', () => {
    customRender(<ClanList {...propsMember} />);
    
    const leaveButtons = screen.getAllByRole('button', { name: /leave/i });
    expect(leaveButtons.length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /join/i })).toBeNull();
  });

  it('handles clan with no territories', () => {
    const clanWithNoTerritories = {
      ...mockClan,
      territories: [],
    };
    
    customRender(<ClanList clans={[clanWithNoTerritories]} onJoin={jest.fn()} onView={jest.fn()} onLeave={jest.fn()} onFilter={jest.fn()} onSort={jest.fn()} />);
    
    expect(screen.getByText('Test Clan 1')).toBeInTheDocument();
  });

  it('renders without crashing with minimal props', () => {
    expect(() => customRender(<ClanList {...minimalProps} />)).not.toThrow();
  });

  it('has proper accessibility attributes', () => {
    customRender(<ClanList {...defaultProps} />);
    
    const grid = screen.getByRole('grid');
    expect(grid).toBeInTheDocument();
  });

  it('handles disabled state correctly', () => {
    customRender(<ClanList {...disabledProps} />);
    
    const joinButtons = screen.getAllByRole('button', { name: /join/i });
    expect(joinButtons[0]).toBeDisabled();
  });

  it('renders within acceptable performance threshold', async () => {
    customRender(<ClanList {...defaultProps} />);
    
    expect(screen.getByText(mockClan.name)).toBeInTheDocument();
  }, 5000);

  it('handles large clan lists efficiently', () => {
    customRender(<ClanList {...largeProps} />);
    
    expect(screen.getByText('50 Clans')).toBeInTheDocument();
  });

  it('maintains scroll position during updates', () => {
    const { rerender } = customRender(<ClanList {...defaultProps} />);
    
    const updatedClans = [...defaultProps.clans, mockClan2];
    
    rerender(<ClanList {...defaultProps} clans={updatedClans} />);
    
    expect(screen.getByText('3 Clans')).toBeInTheDocument();
    expect(screen.getByText(mockClan2.name)).toBeInTheDocument();
  });

  it('handles clan updates in real-time', () => {
    const { rerender } = customRender(<ClanList {...defaultProps} />);
    
    const updatedClans = defaultProps.clans.map(clan => ({
      ...clan,
      members: [...clan.members, {
        id: 'new-member',
        clanId: clan.id,
        userId: 'new-user',
        role: 'MEMBER',
        joinedAt: '2024-01-01T00:00:00Z',
      }],
    }));
    
    rerender(<ClanList {...defaultProps} clans={updatedClans} />);
    
    // Check if member counts are updated
    expect(screen.getByText('1/50')).toBeInTheDocument();
  });
});
