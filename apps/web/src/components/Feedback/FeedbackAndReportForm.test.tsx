import { FeedbackAndReportForm } from '@/components/Feedback/FeedbackAndReportForm';
import { submitFeedback, uploadFiles } from '@/services/APIService';
import { FeedbackCategory } from '@dojopool/types';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

// Mock the API service
jest.mock('@/services/APIService', () => ({
  submitFeedback: jest.fn(),
  uploadFiles: jest.fn(),
}));

const mockSubmitFeedback = submitFeedback as jest.MockedFunction<
  typeof submitFeedback
>;
const mockUploadFiles = uploadFiles as jest.MockedFunction<typeof uploadFiles>;

describe('FeedbackAndReportForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders feedback form correctly', () => {
    render(
      <FeedbackAndReportForm
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Submit Feedback & Reports')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Your Feedback')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Submit Feedback' })
    ).toBeInTheDocument();
  });

  it('shows all feedback categories including player report', () => {
    render(
      <FeedbackAndReportForm
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    const categorySelect = screen.getByLabelText('Category');
    fireEvent.mouseDown(categorySelect);

    expect(screen.getByText('🐛 Bug Report')).toBeInTheDocument();
    expect(screen.getByText('💡 Feature Request')).toBeInTheDocument();
    expect(screen.getByText('💬 General Feedback')).toBeInTheDocument();
    expect(screen.getByText('🏢 Venue Issue')).toBeInTheDocument();
    expect(screen.getByText('🛠️ Technical Support')).toBeInTheDocument();
    expect(screen.getByText('🎨 UI/UX Improvement')).toBeInTheDocument();
    expect(screen.getByText('⚡ Performance Issue')).toBeInTheDocument();
    expect(screen.getByText('👤 Player Report')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <FeedbackAndReportForm
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByRole('button', {
      name: 'Submit Feedback',
    });
    fireEvent.click(submitButton);

    expect(mockSubmitFeedback).not.toHaveBeenCalled();
  });

  it('validates message length', async () => {
    render(
      <FeedbackAndReportForm
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    const messageField = screen.getByLabelText('Your Feedback');
    fireEvent.change(messageField, { target: { value: 'a'.repeat(2001) } });

    const submitButton = screen.getByRole('button', {
      name: 'Submit Feedback',
    });
    fireEvent.click(submitButton);

    expect(mockSubmitFeedback).not.toHaveBeenCalled();
  });

  it('submits feedback successfully', async () => {
    const mockFeedback = {
      id: 'feedback-1',
      message: 'Test feedback message',
      category: FeedbackCategory.BUG,
      attachments: [],
      status: 'PENDING' as any,
      priority: 'NORMAL' as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'user-1',
      user: { id: 'user-1', username: 'testuser', email: 'test@example.com' },
    };

    mockSubmitFeedback.mockResolvedValue(mockFeedback);

    render(
      <FeedbackAndReportForm
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    const messageField = screen.getByLabelText('Your Feedback');
    fireEvent.change(messageField, {
      target: { value: 'Test feedback message' },
    });

    const categorySelect = screen.getByLabelText('Category');
    fireEvent.mouseDown(categorySelect);
    fireEvent.click(screen.getByText('🐛 Bug Report'));

    const submitButton = screen.getByRole('button', {
      name: 'Submit Feedback',
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSubmitFeedback).toHaveBeenCalledWith({
        message: 'Test feedback message',
        category: FeedbackCategory.BUG,
        additionalContext: undefined,
        attachments: [],
      });
    });

    await waitFor(() => {
      expect(
        screen.getByText('✅ Feedback Submitted Successfully!')
      ).toBeInTheDocument();
    });
  });

  it('handles file upload', async () => {
    const mockUploadResponse = {
      files: [
        {
          filename: 'test-image.jpg',
          url: 'http://localhost:3002/uploads/test-image.jpg',
          size: 1024,
          mimetype: 'image/jpeg',
        },
      ],
    };

    mockUploadFiles.mockResolvedValue(mockUploadResponse);

    render(
      <FeedbackAndReportForm
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    const fileInput = screen.getByLabelText(
      /Drag & drop files here or click to browse/i
    );
    const file = new File(['test content'], 'test-image.jpg', {
      type: 'image/jpeg',
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockUploadFiles).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('test-image.jpg (1 KB)')).toBeInTheDocument();
    });
  });

  it('limits file uploads to 5 files', async () => {
    const mockUploadResponse = {
      files: Array.from({ length: 6 }, (_, i) => ({
        filename: `test-image-${i}.jpg`,
        url: `http://localhost:3002/uploads/test-image-${i}.jpg`,
        size: 1024,
        mimetype: 'image/jpeg',
      })),
    };

    mockUploadFiles.mockResolvedValue(mockUploadResponse);

    render(
      <FeedbackAndReportForm
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    const fileInput = screen.getByLabelText(
      /Drag & drop files here or click to browse/i
    );
    const files = Array.from(
      { length: 6 },
      (_, i) =>
        new File(['test content'], `test-image-${i}.jpg`, {
          type: 'image/jpeg',
        })
    );

    fireEvent.change(fileInput, { target: { files } });

    await waitFor(() => {
      expect(
        screen.getByText('Maximum 5 attachments allowed')
      ).toBeInTheDocument();
    });
  });

  it('submits feedback with attachments', async () => {
    const mockFeedback = {
      id: 'feedback-1',
      message: 'Test feedback with attachments',
      category: FeedbackCategory.BUG,
      attachments: ['http://localhost:3002/uploads/test-image.jpg'],
      status: 'PENDING' as any,
      priority: 'NORMAL' as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'user-1',
      user: { id: 'user-1', username: 'testuser', email: 'test@example.com' },
    };

    mockSubmitFeedback.mockResolvedValue(mockFeedback);

    render(
      <FeedbackAndReportForm
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    // Fill form
    const messageField = screen.getByLabelText('Your Feedback');
    fireEvent.change(messageField, {
      target: { value: 'Test feedback with attachments' },
    });

    const categorySelect = screen.getByLabelText('Category');
    fireEvent.mouseDown(categorySelect);
    fireEvent.click(screen.getByText('🐛 Bug Report'));

    // Mock uploaded files
    const mockUploadedFiles = [
      {
        filename: 'test-image.jpg',
        url: 'http://localhost:3002/uploads/test-image.jpg',
        size: 1024,
        mimetype: 'image/jpeg',
      },
    ];

    // Simulate file upload
    const fileInput = screen.getByLabelText(
      /Drag & drop files here or click to browse/i
    );
    const file = new File(['test content'], 'test-image.jpg', {
      type: 'image/jpeg',
    });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('test-image.jpg (1 KB)')).toBeInTheDocument();
    });

    // Submit form
    const submitButton = screen.getByRole('button', {
      name: 'Submit Feedback',
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSubmitFeedback).toHaveBeenCalledWith({
        message: 'Test feedback with attachments',
        category: FeedbackCategory.BUG,
        additionalContext: undefined,
        attachments: ['http://localhost:3002/uploads/test-image.jpg'],
      });
    });
  });

  it('handles submission errors', async () => {
    const errorMessage = 'Failed to submit feedback';
    mockSubmitFeedback.mockRejectedValue(new Error(errorMessage));

    render(
      <FeedbackAndReportForm
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    const messageField = screen.getByLabelText('Your Feedback');
    fireEvent.change(messageField, {
      target: { value: 'Test feedback message' },
    });

    const categorySelect = screen.getByLabelText('Category');
    fireEvent.mouseDown(categorySelect);
    fireEvent.click(screen.getByText('🐛 Bug Report'));

    const submitButton = screen.getByRole('button', {
      name: 'Submit Feedback',
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <FeedbackAndReportForm
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('calls onSuccess after successful submission', async () => {
    const mockFeedback = {
      id: 'feedback-1',
      message: 'Test feedback message',
      category: FeedbackCategory.BUG,
      attachments: [],
      status: 'PENDING' as any,
      priority: 'NORMAL' as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'user-1',
      user: { id: 'user-1', username: 'testuser', email: 'test@example.com' },
    };

    mockSubmitFeedback.mockResolvedValue(mockFeedback);

    render(
      <FeedbackAndReportForm
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    const messageField = screen.getByLabelText('Your Feedback');
    fireEvent.change(messageField, {
      target: { value: 'Test feedback message' },
    });

    const categorySelect = screen.getByLabelText('Category');
    fireEvent.mouseDown(categorySelect);
    fireEvent.click(screen.getByText('🐛 Bug Report'));

    const submitButton = screen.getByRole('button', {
      name: 'Submit Feedback',
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('✅ Feedback Submitted Successfully!')
      ).toBeInTheDocument();
    });

    // Wait for the success callback
    await waitFor(
      () => {
        expect(mockOnSuccess).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );
  });
});
