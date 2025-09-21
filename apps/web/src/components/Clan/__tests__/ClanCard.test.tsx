import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { render as customRender, mockUser, mockClan, createMockProps, measureRenderTime } from '../../__tests__/test-utils';
import ClanCard from '../ClanCard';

// Mock MUI components
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    Card: ({ children, onClick, ...props }: any) => (
      <div data-testid="clan-card" onClick={onClick} {...props}>
        {children}
      </div>
    ),
    CardContent: ({ children, ...props }: any) => (
      <div data-testid="clan-card-content" {...props}>
        {children}
      </div>
    ),
    Typography: ({ children, variant, ...props }: any) => (
      <div data-testid={`typography-${variant}`} {...props}>
        {children}
      </div>
    ),
    Chip: ({ label, color, ...props }: any) => (
      <span data-testid={`chip-${color}`} {...props}>
        {label}
      </span>
    ),
    Button: ({ children, onClick, ...props }: any) => (
      <button data-testid="clan-button" onClick={onClick} {...props}>
        {children}
      </button>
    ),
    Avatar: ({ children, ...props }: any) => (
      <div data-testid="clan-avatar" {...props}>
        {children}
      </div>
    ),
  };
});

// Mock icons
vi.mock('@mui/icons-material', () => ({
  Group: () => <div data-testid="group-icon">👥</div>,
  AttachMoney: () => <div data-testid="money-icon">💰</div>,
  LocationOn: () => <div data-testid="location-icon">📍</div>,
}));

describe('ClanCard Component', () => {
  const defaultProps = createMockProps({
    clan: mockClan,
    onJoin: vi.fn(),
    onView: vi.fn(),
    onLeave: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders clan information correctly', () => {
    customRender(<ClanCard {...defaultProps} />);
    
    expect(screen.getByText('Test Clan')).toBeInTheDocument();
    expect(screen.getByText('A test clan')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // memberCount
    expect(screen.getByText('1000')).toBeInTheDocument(); // treasury
  });

  it('displays clan avatar', () => {
    customRender(<ClanCard {...defaultProps} />);
    
    expect(screen.getByTestId('clan-avatar')).toBeInTheDocument();
  });

  it('renders all required icons', () => {
    customRender(<ClanCard {...defaultProps} />);
    
    expect(screen.getByTestId('group-icon')).toBeInTheDocument();
    expect(screen.getByTestId('money-icon')).toBeInTheDocument();
    expect(screen.getByTestId('location-icon')).toBeInTheDocument();
  });

  it('calls onJoin when join button is clicked', () => {
    customRender(<ClanCard {...defaultProps} />);
    
    const joinButton = screen.getByText('Join Clan');
    fireEvent.click(joinButton);
    
    expect(defaultProps.onJoin).toHaveBeenCalledWith(mockClan.id);
  });

  it('calls onView when view button is clicked', () => {
    customRender(<ClanCard {...defaultProps} />);
    
    const viewButton = screen.getByText('View Details');
    fireEvent.click(viewButton);
    
    expect(defaultProps.onView).toHaveBeenCalledWith(mockClan.id);
  });

  it('calls onLeave when leave button is clicked', () => {
    const propsWithLeave = {
      ...defaultProps,
      isMember: true,
    };
    
    customRender(<ClanCard {...propsWithLeave} />);
    
    const leaveButton = screen.getByText('Leave Clan');
    fireEvent.click(leaveButton);
    
    expect(defaultProps.onLeave).toHaveBeenCalledWith(mockClan.id);
  });

  it('shows join button when user is not a member', () => {
    const propsNotMember = {
      ...defaultProps,
      isMember: false,
    };
    
    customRender(<ClanCard {...propsNotMember} />);
    
    expect(screen.getByText('Join Clan')).toBeInTheDocument();
    expect(screen.queryByText('Leave Clan')).not.toBeInTheDocument();
  });

  it('shows leave button when user is a member', () => {
    const propsMember = {
      ...defaultProps,
      isMember: true,
    };
    
    customRender(<ClanCard {...propsMember} />);
    
    expect(screen.getByText('Leave Clan')).toBeInTheDocument();
    expect(screen.queryByText('Join Clan')).not.toBeInTheDocument();
  });

  it('displays territory count correctly', () => {
    const clanWithTerritories = {
      ...mockClan,
      territories: [
        { id: '1', name: 'Territory 1' },
        { id: '2', name: 'Territory 2' },
      ],
    };
    
    customRender(<ClanCard {...defaultProps} clan={clanWithTerritories} />);
    
    expect(screen.getByText('2')).toBeInTheDocument(); // territory count
  });

  it('handles clan with no territories', () => {
    const clanWithNoTerritories = {
      ...mockClan,
      territories: [],
    };
    
    customRender(<ClanCard {...defaultProps} clan={clanWithNoTerritories} />);
    
    expect(screen.getByText('0')).toBeInTheDocument(); // territory count
  });

  it('renders without crashing with minimal props', () => {
    const minimalProps = {
      clan: mockClan,
      onJoin: vi.fn(),
      onView: vi.fn(),
    };
    
    expect(() => customRender(<ClanCard {...minimalProps} />)).not.toThrow();
  });

  it('has proper accessibility attributes', () => {
    customRender(<ClanCard {...defaultProps} />);
    
    const card = screen.getByTestId('clan-card');
    expect(card).toBeInTheDocument();
    
    // Check for proper heading structure
    const heading = screen.getByTestId('typography-h6');
    expect(heading).toBeInTheDocument();
  });

  it('handles disabled state correctly', () => {
    const disabledProps = {
      ...defaultProps,
      disabled: true,
    };
    
    customRender(<ClanCard {...disabledProps} />);
    
    const joinButton = screen.getByText('Join Clan');
    expect(joinButton).toBeDisabled();
  });

  it('renders within acceptable performance threshold', async () => {
    const renderTime = await measureRenderTime(() => {
      customRender(<ClanCard {...defaultProps} />);
    });
    
    // Should render in less than 50ms
    expect(renderTime).toBeLessThan(50);
  });

  it('handles long clan names gracefully', () => {
    const clanWithLongName = {
      ...mockClan,
      name: 'This is a very long clan name that should be handled gracefully',
    };
    
    customRender(<ClanCard {...defaultProps} clan={clanWithLongName} />);
    
    expect(screen.getByText(clanWithLongName.name)).toBeInTheDocument();
  });

  it('handles empty description', () => {
    const clanWithEmptyDescription = {
      ...mockClan,
      description: '',
    };
    
    customRender(<ClanCard {...defaultProps} clan={clanWithEmptyDescription} />);
    
    expect(screen.getByText('Test Clan')).toBeInTheDocument();
  });
});
