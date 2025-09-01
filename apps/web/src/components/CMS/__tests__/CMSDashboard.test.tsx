import { jest } from '@jest/globals';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import * as APIService from '../../../services/APIService';
import CMSDashboard from '../CMSDashboard';

// Mock the APIService
jest.mock('../../../services/APIService', () => ({
  getCMSStats: jest.fn(),
}));

// Mock MUI icons
jest.mock('@mui/icons-material', () => ({
  Event: () => <div data-testid="event-icon" />,
  Article: () => <div data-testid="article-icon" />,
  Announcement: () => <div data-testid="announcement-icon" />,
  Visibility: () => <div data-testid="visibility-icon" />,
  ThumbUp: () => <div data-testid="thumbup-icon" />,
  People: () => <div data-testid="people-icon" />,
}));

// Mock MUI components
jest.mock('@mui/material', () => ({
  Alert: ({ children, severity }: any) => (
    <div data-testid={`alert-${severity}`}>{children}</div>
  ),
  Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => (
    <div data-testid="card-content">{children}</div>
  ),
  Grid: ({ children }: any) => <div data-testid="grid">{children}</div>,
  Typography: ({ children, variant, component }: any) => (
    <div data-testid={`typography-${variant || component}`}>{children}</div>
  ),
}));

// Mock child components
jest.mock('../CMSTabs', () => {
  return function MockCMSTabs({ children }: any) {
    return <div data-testid="cms-tabs">{children}</div>;
  };
});

jest.mock('../EventManagement', () => {
  return function MockEventManagement() {
    return <div data-testid="event-management">Event Management Component</div>;
  };
});

jest.mock('../NewsManagement', () => {
  return function MockNewsManagement() {
    return <div data-testid="news-management">News Management Component</div>;
  };
});

jest.mock('../SystemMessageManagement', () => {
  return function MockSystemMessageManagement() {
    return (
      <div data-testid="system-message-management">
        System Message Management Component
      </div>
    );
  };
});

describe('CMSDashboard', () => {
  const mockStats = {
    totalEvents: 15,
    totalNewsArticles: 25,
    totalSystemMessages: 10,
    activeSystemMessages: 7,
    pendingContent: 5,
    totalViews: 12345,
    totalLikes: 678,
    totalShares: 234,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (APIService.getCMSStats as jest.Mock).mockResolvedValue(mockStats);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders CMS dashboard with statistics', async () => {
    render(<CMSDashboard />);

    // Check if title is rendered
    expect(screen.getByText('Content Management System')).toBeInTheDocument();

    // Wait for stats to load and verify API call
    await waitFor(() => {
      expect(APIService.getCMSStats).toHaveBeenCalledTimes(1);
    });

    // Verify statistics are displayed
    await waitFor(() => {
      expect(screen.getByText('15')).toBeInTheDocument(); // totalEvents
      expect(screen.getByText('25')).toBeInTheDocument(); // totalNewsArticles
      expect(screen.getByText('10')).toBeInTheDocument(); // totalSystemMessages
      expect(screen.getByText('12,345')).toBeInTheDocument(); // totalViews
      expect(screen.getByText('912')).toBeInTheDocument(); // totalLikes + totalShares
    });
  });

  it('displays CMS tabs', async () => {
    render(<CMSDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Events')).toBeInTheDocument();
      expect(screen.getByText('News Articles')).toBeInTheDocument();
      expect(screen.getByText('System Messages')).toBeInTheDocument();
      expect(screen.getByText('Content Moderation')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    (APIService.getCMSStats as jest.Mock).mockRejectedValue(
      new Error('API Error')
    );

    render(<CMSDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('alert-error')).toBeInTheDocument();
      expect(
        screen.getByText('Failed to fetch CMS statistics')
      ).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it('displays fallback data when API fails', async () => {
    (APIService.getCMSStats as jest.Mock).mockRejectedValue(
      new Error('Network Error')
    );

    render(<CMSDashboard />);

    await waitFor(() => {
      // Should show fallback mock data
      expect(screen.getByText('12')).toBeInTheDocument(); // fallback totalEvents
      expect(screen.getByText('28')).toBeInTheDocument(); // fallback totalNewsArticles
    });
  });

  it('renders stat cards with correct titles and descriptions', async () => {
    render(<CMSDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Total Events')).toBeInTheDocument();
      expect(screen.getByText('News Articles')).toBeInTheDocument();
      expect(screen.getByText('System Messages')).toBeInTheDocument();
      expect(screen.getByText('Content Views')).toBeInTheDocument();
      expect(screen.getByText('Content Engagement')).toBeInTheDocument();
      expect(screen.getByText('Pending Content')).toBeInTheDocument();
    });
  });

  it('renders child management components', async () => {
    render(<CMSDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('cms-tabs')).toBeInTheDocument();
      expect(screen.getByTestId('event-management')).toBeInTheDocument();
      expect(screen.getByTestId('news-management')).toBeInTheDocument();
      expect(
        screen.getByTestId('system-message-management')
      ).toBeInTheDocument();
    });
  });
});
