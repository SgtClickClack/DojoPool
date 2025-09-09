import { AdminFeedbackDashboard } from '@/components/Feedback';
import {
  getAllFeedback,
  getFeedbackStats,
  updateFeedback,
} from '@/services/APIService';
import {
  FeedbackCategory,
  FeedbackPriority,
  FeedbackStatus,
} from '@dojopool/types';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

// Mock the API service
jest.mock('@/services/APIService', () => ({
  getAllFeedback: jest.fn(),
  getFeedbackStats: jest.fn(),
  updateFeedback: jest.fn(),
  getModerationFeedback: jest.fn(),
  updateModerationFeedbackStatus: jest.fn(),
}));

const mockGetModerationFeedback = require('@/services/APIService')
  .getModerationFeedback as jest.MockedFunction<any>;
const mockUpdateModerationFeedbackStatus = require('@/services/APIService')
  .updateModerationFeedbackStatus as jest.MockedFunction<any>;

const mockGetAllFeedback = getAllFeedback as jest.MockedFunction<
  typeof getAllFeedback
>;
const mockGetFeedbackStats = getFeedbackStats as jest.MockedFunction<
  typeof getFeedbackStats
>;
const mockUpdateFeedback = updateFeedback as jest.MockedFunction<
  typeof updateFeedback
>;

describe('AdminFeedbackDashboard', () => {
  const mockStats = {
    total: 25,
    pending: 5,
    inReview: 3,
    resolved: 15,
    closed: 2,
    rejected: 0,
    averageResolutionTime: 24.5,
  };

  const mockFeedbackList = {
    feedback: [
      {
        id: 'feedback-1',
        userId: 'user-1',
        message: 'Test bug report',
        category: FeedbackCategory.BUG,
        status: FeedbackStatus.PENDING,
        priority: FeedbackPriority.NORMAL,
        adminNotes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        resolvedAt: null,
        resolvedBy: null,
        user: {
          id: 'user-1',
          username: 'testuser',
          email: 'test@example.com',
        },
        resolver: null,
      },
      {
        id: 'feedback-2',
        userId: 'user-2',
        message: 'Feature request for new functionality',
        category: FeedbackCategory.FEATURE_REQUEST,
        status: FeedbackStatus.IN_REVIEW,
        priority: FeedbackPriority.HIGH,
        adminNotes: 'Under review',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        resolvedAt: null,
        resolvedBy: null,
        user: {
          id: 'user-2',
          username: 'featureuser',
          email: 'feature@example.com',
        },
        resolver: null,
      },
    ],
    totalCount: 2,
    pendingCount: 1,
    pagination: {
      page: 1,
      limit: 20,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFeedbackStats.mockResolvedValue(mockStats);
    // Use moderation fetcher now
    mockGetModerationFeedback.mockResolvedValue(mockFeedbackList);
  });

  it('renders dashboard correctly', async () => {
    render(<AdminFeedbackDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText('Feedback Management Dashboard')
      ).toBeInTheDocument();
    });

    // Check stats cards
    expect(screen.getByText('25')).toBeInTheDocument(); // Total
    expect(screen.getByText('5')).toBeInTheDocument(); // Pending
    expect(screen.getByText('3')).toBeInTheDocument(); // In Review
    expect(screen.getByText('15')).toBeInTheDocument(); // Resolved

    // Check table headers
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Message')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Priority')).toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('displays feedback data correctly', async () => {
    render(<AdminFeedbackDashboard />);

    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('featureuser')).toBeInTheDocument();
    });

    // Check category labels
    expect(screen.getByText('🐛 Bug')).toBeInTheDocument();
    expect(screen.getByText('💡 Feature')).toBeInTheDocument();

    // Check status chips
    expect(screen.getByText('PENDING')).toBeInTheDocument();
    expect(screen.getByText('IN REVIEW')).toBeInTheDocument();

    // Check messages
    expect(screen.getByText('Test bug report')).toBeInTheDocument();
    expect(
      screen.getByText('Feature request for new functionality')
    ).toBeInTheDocument();
  });

  it('handles loading state', () => {
    mockGetFeedbackStats.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );
    mockGetAllFeedback.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    render(<AdminFeedbackDashboard />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    const errorMessage = 'Failed to load feedback';
    mockGetFeedbackStats.mockRejectedValue(new Error(errorMessage));
    mockGetAllFeedback.mockRejectedValue(new Error(errorMessage));

    render(<AdminFeedbackDashboard />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('filters feedback by status', async () => {
    render(<AdminFeedbackDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText('Status');
    fireEvent.mouseDown(statusSelect);
    fireEvent.click(screen.getByText('PENDING'));

    await waitFor(() => {
      expect(mockGetModerationFeedback).toHaveBeenCalledWith(
        expect.objectContaining({ status: FeedbackStatus.PENDING }),
        1,
        20
      );
    });
  });

  it('filters feedback by category', async () => {
    render(<AdminFeedbackDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    const categorySelect = screen.getByLabelText('Category');
    fireEvent.mouseDown(categorySelect);
    fireEvent.click(screen.getByText('🐛 Bug'));

    await waitFor(() => {
      expect(mockGetModerationFeedback).toHaveBeenCalledWith(
        expect.objectContaining({ category: FeedbackCategory.BUG }),
        1,
        20
      );
    });
  });

  it('clears filters', async () => {
    render(<AdminFeedbackDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Clear Filters')).toBeInTheDocument();
    });

    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(mockGetModerationFeedback).toHaveBeenCalledWith({}, 1, 20);
    });
  });

  it('opens update dialog when update button is clicked', async () => {
    render(<AdminFeedbackDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Update')).toBeInTheDocument();
    });

    const updateButtons = screen.getAllByText('Update');
    fireEvent.click(updateButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Update Feedback')).toBeInTheDocument();
    });

    // Check dialog content
    expect(screen.getByText('🐛 Bug')).toBeInTheDocument();
    expect(
      screen.getByText('From: testuser (test@example.com)')
    ).toBeInTheDocument();
    expect(screen.getByText('Test bug report')).toBeInTheDocument();
  });

  it('updates feedback status', async () => {
    const updatedFeedback = {
      ...mockFeedbackList.feedback[0],
      status: FeedbackStatus.RESOLVED,
      adminNotes: 'Resolved the issue',
    };

    mockUpdateModerationFeedbackStatus.mockResolvedValue(updatedFeedback);

    render(<AdminFeedbackDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Update')).toBeInTheDocument();
    });

    // Open update dialog
    const updateButtons = screen.getAllByText('Update');
    fireEvent.click(updateButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Update Feedback')).toBeInTheDocument();
    });

    // Change status
    const statusSelect = screen.getByLabelText('Status');
    fireEvent.mouseDown(statusSelect);
    fireEvent.click(screen.getByText('RESOLVED'));

    // Add admin notes
    const adminNotesField = screen.getByLabelText('Admin Notes');
    fireEvent.change(adminNotesField, {
      target: { value: 'Resolved the issue' },
    });

    // Submit update
    const saveButton = screen.getByText('Update');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateModerationFeedbackStatus).toHaveBeenCalledWith(
        'feedback-1',
        {
          status: FeedbackStatus.RESOLVED,
          adminNotes: 'Resolved the issue',
        }
      );
    });
  });

  it('handles update error', async () => {
    const errorMessage = 'Failed to update feedback';
    mockUpdateModerationFeedbackStatus.mockRejectedValue(
      new Error(errorMessage)
    );

    render(<AdminFeedbackDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Update')).toBeInTheDocument();
    });

    // Open update dialog
    const updateButtons = screen.getAllByText('Update');
    fireEvent.click(updateButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Update Feedback')).toBeInTheDocument();
    });

    // Submit update
    const saveButton = screen.getByText('Update');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('updates priority inline', async () => {
    const updatedFeedback = {
      ...mockFeedbackList.feedback[0],
      priority: FeedbackPriority.HIGH,
    };

    mockUpdateModerationFeedbackStatus.mockResolvedValue(updatedFeedback);

    render(<AdminFeedbackDashboard />);

    await waitFor(() => {
      expect(screen.getByText('NORMAL')).toBeInTheDocument();
    });

    // Find priority select and change it
    const prioritySelects = screen.getAllByDisplayValue('NORMAL');
    const prioritySelect = prioritySelects[0];

    fireEvent.mouseDown(prioritySelect);
    fireEvent.click(screen.getByText('HIGH'));

    await waitFor(() => {
      expect(mockUpdateModerationFeedbackStatus).toHaveBeenCalledWith(
        'feedback-1',
        {
          priority: FeedbackPriority.HIGH,
        }
      );
    });
  });

  it('handles pagination', async () => {
    const paginatedResponse = {
      ...mockFeedbackList,
      pagination: {
        page: 1,
        limit: 20,
        totalPages: 3,
        hasNext: true,
        hasPrev: false,
      },
    };

    mockGetModerationFeedback.mockResolvedValue(paginatedResponse);

    render(<AdminFeedbackDashboard />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Go to next page' })
      ).toBeInTheDocument();
    });

    const nextButton = screen.getByRole('button', { name: 'Go to next page' });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(mockGetModerationFeedback).toHaveBeenCalledWith({}, 2, 20);
    });
  });

  it('shows empty state when no feedback', async () => {
    const emptyResponse = {
      feedback: [],
      totalCount: 0,
      pendingCount: 0,
      pagination: {
        page: 1,
        limit: 20,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };

    mockGetModerationFeedback.mockResolvedValue(emptyResponse);

    render(<AdminFeedbackDashboard />);

    await waitFor(() => {
      expect(screen.getByText('No feedback found')).toBeInTheDocument();
    });
  });

  it('calls onFeedbackUpdated callback when provided', async () => {
    const mockOnFeedbackUpdated = jest.fn();
    const updatedFeedback = {
      ...mockFeedbackList.feedback[0],
      status: FeedbackStatus.RESOLVED,
    };

    mockUpdateModerationFeedbackStatus.mockResolvedValue(updatedFeedback);

    render(
      <AdminFeedbackDashboard onFeedbackUpdated={mockOnFeedbackUpdated} />
    );

    await waitFor(() => {
      expect(screen.getByText('Update')).toBeInTheDocument();
    });

    // Open update dialog and submit
    const updateButtons = screen.getAllByText('Update');
    fireEvent.click(updateButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Update Feedback')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('Update');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnFeedbackUpdated).toHaveBeenCalled();
    });
  });
});
