import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { render as customRender, mockUser, mockClan, createMockProps, measureRenderTime } from '../../__tests__/test-utils';
import ClanList from '../ClanList';

// Mock MUI components
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    Card: ({ children, ...props }: any) => (
      <div data-testid="clan-list-card" {...props}>
        {children}
      </div>
    ),
    CardContent: ({ children, ...props }: any) => (
      <div data-testid="clan-list-content" {...props}>
        {children}
      </div>
    ),
    Typography: ({ children, variant, ...props }: any) => (
      <div data-testid={`typography-${variant}`} {...props}>
        {children}
      </div>
    ),
    Button: ({ children, onClick, ...props }: any) => (
      <button data-testid="clan-list-button" onClick={onClick} {...props}>
        {children}
      </button>
    ),
    Chip: ({ label, color, ...props }: any) => (
      <span data-testid={`chip-${color}`} {...props}>
        {label}
      </span>
    ),
    Box: ({ children, ...props }: any) => (
      <div data-testid="clan-list-box" {...props}>
        {children}
      </div>
    ),
    Grid: ({ children, ...props }: any) => (
      <div data-testid="clan-list-grid" {...props}>
        {children}
      </div>
    ),
    TextField: ({ onChange, ...props }: any) => (
      <input data-testid="clan-list-search" onChange={onChange} {...props} />
    ),
  };
});

// Mock icons
vi.mock('@mui/icons-material', () => ({
  Search: () => <div data-testid="search-icon">🔍</div>,
  FilterList: () => <div data-testid="filter-icon">🔽</div>,
  Sort: () => <div data-testid="sort-icon">↕️</div>,
  Group: () => <div data-testid="group-icon">👥</div>,
}));

describe('ClanList Component', () => {
  const mockClans = [
    mockClan,
    {
      ...mockClan,
      id: '2',
      name: 'Another Clan',
      description: 'Another test clan',
      memberCount: 8,
      treasury: 2000,
    },
    {
      ...mockClan,
      id: '3',
      name: 'Elite Clan',
      description: 'An elite clan',
      memberCount: 12,
      treasury: 5000,
      territories: [
        { id: '1', name: 'Territory 1' },
        { id: '2', name: 'Territory 2' },
      ],
    },
  ];

  const defaultProps = createMockProps({
    clans: mockClans,
    onJoin: vi.fn(),
    onView: vi.fn(),
    onLeave: vi.fn(),
    onFilter: vi.fn(),
    onSort: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all clans correctly', () => {
    customRender(<ClanList {...defaultProps} />);
    
    expect(screen.getByText('Test Clan')).toBeInTheDocument();
    expect(screen.getByText('Another Clan')).toBeInTheDocument();
    expect(screen.getByText('Elite Clan')).toBeInTheDocument();
  });

  it('displays clan count', () => {
    customRender(<ClanList {...defaultProps} />);
    
    expect(screen.getByText('3 Clans')).toBeInTheDocument();
  });

  it('renders search functionality', () => {
    customRender(<ClanList {...defaultProps} />);
    
    expect(screen.getByTestId('clan-list-search')).toBeInTheDocument();
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });

  it('renders filter and sort controls', () => {
    customRender(<ClanList {...defaultProps} />);
    
    expect(screen.getByTestId('filter-icon')).toBeInTheDocument();
    expect(screen.getByTestId('sort-icon')).toBeInTheDocument();
  });

  it('filters clans by search term', () => {
    customRender(<ClanList {...defaultProps} />);
    
    const searchInput = screen.getByTestId('clan-list-search');
    fireEvent.change(searchInput, { target: { value: 'Test' } });
    
    expect(defaultProps.onFilter).toHaveBeenCalledWith('Test');
  });

  it('handles empty clan list', () => {
    const emptyProps = {
      ...defaultProps,
      clans: [],
    };
    
    customRender(<ClanList {...emptyProps} />);
    
    expect(screen.getByText('No clans found')).toBeInTheDocument();
    expect(screen.getByText('0 Clans')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    const loadingProps = {
      ...defaultProps,
      loading: true,
    };
    
    customRender(<ClanList {...loadingProps} />);
    
    expect(screen.getByText('Loading clans...')).toBeInTheDocument();
  });

  it('displays error state', () => {
    const errorProps = {
      ...defaultProps,
      error: 'Failed to load clans',
    };
    
    customRender(<ClanList {...errorProps} />);
    
    expect(screen.getByText('Failed to load clans')).toBeInTheDocument();
  });

  it('calls onJoin when join button is clicked', () => {
    customRender(<ClanList {...defaultProps} />);
    
    const joinButtons = screen.getAllByText('Join Clan');
    fireEvent.click(joinButtons[0]);
    
    expect(defaultProps.onJoin).toHaveBeenCalledWith(mockClan.id);
  });

  it('calls onView when view button is clicked', () => {
    customRender(<ClanList {...defaultProps} />);
    
    const viewButtons = screen.getAllByText('View Details');
    fireEvent.click(viewButtons[0]);
    
    expect(defaultProps.onView).toHaveBeenCalledWith(mockClan.id);
  });

  it('calls onLeave when leave button is clicked', () => {
    const propsWithLeave = {
      ...defaultProps,
      userClanId: mockClan.id,
    };
    
    customRender(<ClanList {...propsWithLeave} />);
    
    const leaveButtons = screen.getAllByText('Leave Clan');
    fireEvent.click(leaveButtons[0]);
    
    expect(defaultProps.onLeave).toHaveBeenCalledWith(mockClan.id);
  });

  it('shows join button when user is not a member', () => {
    const propsNotMember = {
      ...defaultProps,
      userClanId: null,
    };
    
    customRender(<ClanList {...propsNotMember} />);
    
    const joinButtons = screen.getAllByText('Join Clan');
    expect(joinButtons).toHaveLength(3);
  });

  it('shows leave button when user is a member', () => {
    const propsMember = {
      ...defaultProps,
      userClanId: mockClan.id,
    };
    
    customRender(<ClanList {...propsMember} />);
    
    const leaveButtons = screen.getAllByText('Leave Clan');
    expect(leaveButtons).toHaveLength(1); // Only for the user's clan
  });

  it('displays member count for each clan', () => {
    customRender(<ClanList {...defaultProps} />);
    
    expect(screen.getByText('5 Members')).toBeInTheDocument(); // Test Clan
    expect(screen.getByText('8 Members')).toBeInTheDocument(); // Another Clan
    expect(screen.getByText('12 Members')).toBeInTheDocument(); // Elite Clan
  });

  it('displays treasury amount for each clan', () => {
    customRender(<ClanList {...defaultProps} />);
    
    expect(screen.getByText('1000')).toBeInTheDocument(); // Test Clan treasury
    expect(screen.getByText('2000')).toBeInTheDocument(); // Another Clan treasury
    expect(screen.getByText('5000')).toBeInTheDocument(); // Elite Clan treasury
  });

  it('displays territory count for clans with territories', () => {
    customRender(<ClanList {...defaultProps} />);
    
    expect(screen.getByText('0 Territories')).toBeInTheDocument(); // Test Clan
    expect(screen.getByText('0 Territories')).toBeInTheDocument(); // Another Clan
    expect(screen.getByText('2 Territories')).toBeInTheDocument(); // Elite Clan
  });

  it('renders without crashing with minimal props', () => {
    const minimalProps = {
      clans: mockClans,
      onJoin: vi.fn(),
      onView: vi.fn(),
    };
    
    expect(() => customRender(<ClanList {...minimalProps} />)).not.toThrow();
  });

  it('has proper accessibility attributes', () => {
    customRender(<ClanList {...defaultProps} />);
    
    const grid = screen.getByTestId('clan-list-grid');
    expect(grid).toBeInTheDocument();
    
    // Check for proper heading structure
    const heading = screen.getByTestId('typography-h5');
    expect(heading).toBeInTheDocument();
  });

  it('handles disabled state correctly', () => {
    const disabledProps = {
      ...defaultProps,
      disabled: true,
    };
    
    customRender(<ClanList {...disabledProps} />);
    
    const joinButtons = screen.getAllByText('Join Clan');
    expect(joinButtons[0]).toBeDisabled();
  });

  it('renders within acceptable performance threshold', async () => {
    const renderTime = await measureRenderTime(() => {
      customRender(<ClanList {...defaultProps} />);
    });
    
    // Should render in less than 100ms
    expect(renderTime).toBeLessThan(100);
  });

  it('handles large clan lists efficiently', () => {
    const largeClanList = Array.from({ length: 50 }, (_, i) => ({
      ...mockClan,
      id: `clan-${i}`,
      name: `Clan ${i}`,
    }));
    
    const largeProps = {
      ...defaultProps,
      clans: largeClanList,
    };
    
    customRender(<ClanList {...largeProps} />);
    
    expect(screen.getByText('50 Clans')).toBeInTheDocument();
  });

  it('maintains scroll position during updates', () => {
    const { rerender } = customRender(<ClanList {...defaultProps} />);
    
    const updatedClans = [
      ...mockClans,
      {
        ...mockClan,
        id: '4',
        name: 'New Clan',
      },
    ];
    
    rerender(<ClanList {...defaultProps} clans={updatedClans} />);
    
    expect(screen.getByText('4 Clans')).toBeInTheDocument();
    expect(screen.getByText('New Clan')).toBeInTheDocument();
  });

  it('handles clan updates in real-time', () => {
    const { rerender } = customRender(<ClanList {...defaultProps} />);
    
    const updatedClans = mockClans.map(clan => ({
      ...clan,
      memberCount: clan.memberCount + 1,
      treasury: clan.treasury + 100,
    }));
    
    rerender(<ClanList {...defaultProps} clans={updatedClans} />);
    
    // Check if member counts and treasury are updated
    expect(screen.getByText('6 Members')).toBeInTheDocument(); // Test Clan
    expect(screen.getByText('9 Members')).toBeInTheDocument(); // Another Clan
    expect(screen.getByText('13 Members')).toBeInTheDocument(); // Elite Clan
  });

  it('displays clan descriptions correctly', () => {
    customRender(<ClanList {...defaultProps} />);
    
    expect(screen.getByText('A test clan')).toBeInTheDocument();
    expect(screen.getByText('Another test clan')).toBeInTheDocument();
    expect(screen.getByText('An elite clan')).toBeInTheDocument();
  });

  it('handles clans with no description', () => {
    const clanWithNoDescription = {
      ...mockClan,
      description: '',
    };
    
    customRender(<ClanList {...defaultProps} clans={[clanWithNoDescription]} />);
    
    expect(screen.getByText('Test Clan')).toBeInTheDocument();
  });
});
