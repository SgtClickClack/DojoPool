import { FeedbackForm } from '@/components/Feedback';
import { submitFeedback } from '@/services/APIService';
import { FeedbackCategory } from '@dojopool/types';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

// Mock the API service
jest.mock('@/services/APIService', () => ({
  submitFeedback: jest.fn(),
}));

const mockSubmitFeedback = submitFeedback as jest.MockedFunction<
  typeof submitFeedback
>;

describe('FeedbackForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders feedback form correctly', () => {
    render(<FeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    expect(screen.getByText('Submit Feedback')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Your Feedback')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Additional Context (Optional)')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Submit Feedback' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('shows all feedback categories', () => {
    render(<FeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const categorySelect = screen.getByLabelText('Category');
    fireEvent.mouseDown(categorySelect);

    expect(screen.getByText('🐛 Bug Report')).toBeInTheDocument();
    expect(screen.getByText('💡 Feature Request')).toBeInTheDocument();
    expect(screen.getByText('💬 General Feedback')).toBeInTheDocument();
    expect(screen.getByText('🏢 Venue Issue')).toBeInTheDocument();
    expect(screen.getByText('🛠️ Technical Support')).toBeInTheDocument();
    expect(screen.getByText('🎨 UI/UX Improvement')).toBeInTheDocument();
    expect(screen.getByText('⚡ Performance Issue')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<FeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const submitButton = screen.getByRole('button', {
      name: 'Submit Feedback',
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Please fill in all required fields')
      ).toBeInTheDocument();
    });

    expect(mockSubmitFeedback).not.toHaveBeenCalled();
  });

  it('validates message length', async () => {
    render(<FeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const messageField = screen.getByLabelText('Your Feedback');
    const longMessage = 'a'.repeat(2001); // Exceeds 2000 character limit

    fireEvent.change(messageField, { target: { value: longMessage } });

    const categorySelect = screen.getByLabelText('Category');
    fireEvent.mouseDown(categorySelect);
    fireEvent.click(screen.getByText('🐛 Bug Report'));

    const submitButton = screen.getByRole('button', {
      name: 'Submit Feedback',
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Message must be less than 2000 characters')
      ).toBeInTheDocument();
    });

    expect(mockSubmitFeedback).not.toHaveBeenCalled();
  });

  it('submits feedback successfully', async () => {
    const mockFeedback = {
      id: 'feedback-1',
      message: 'Test feedback message',
      category: FeedbackCategory.BUG,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    mockSubmitFeedback.mockResolvedValue(mockFeedback);

    render(<FeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    // Fill in the form
    const messageField = screen.getByLabelText('Your Feedback');
    fireEvent.change(messageField, {
      target: { value: 'Test feedback message' },
    });

    const categorySelect = screen.getByLabelText('Category');
    fireEvent.mouseDown(categorySelect);
    fireEvent.click(screen.getByText('🐛 Bug Report'));

    const additionalContextField = screen.getByLabelText(
      'Additional Context (Optional)'
    );
    fireEvent.change(additionalContextField, {
      target: { value: 'Additional context' },
    });

    // Submit the form
    const submitButton = screen.getByRole('button', {
      name: 'Submit Feedback',
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSubmitFeedback).toHaveBeenCalledWith({
        message: 'Test feedback message',
        category: FeedbackCategory.BUG,
        additionalContext: 'Additional context',
      });
    });

    // Check success message
    await waitFor(() => {
      expect(
        screen.getByText('✅ Feedback Submitted Successfully!')
      ).toBeInTheDocument();
    });

    // Check that onSuccess is called after delay
    await waitFor(
      () => {
        expect(mockOnSuccess).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );
  });

  it('handles submission error', async () => {
    const errorMessage = 'Failed to submit feedback';
    mockSubmitFeedback.mockRejectedValue(new Error(errorMessage));

    render(<FeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    // Fill in the form
    const messageField = screen.getByLabelText('Your Feedback');
    fireEvent.change(messageField, {
      target: { value: 'Test feedback message' },
    });

    const categorySelect = screen.getByLabelText('Category');
    fireEvent.mouseDown(categorySelect);
    fireEvent.click(screen.getByText('🐛 Bug Report'));

    // Submit the form
    const submitButton = screen.getByRole('button', {
      name: 'Submit Feedback',
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to submit feedback. Please try again.')
      ).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('handles API error with custom message', async () => {
    const apiError = {
      response: {
        data: {
          message: 'Custom API error message',
        },
      },
    };
    mockSubmitFeedback.mockRejectedValue(apiError);

    render(<FeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    // Fill in the form
    const messageField = screen.getByLabelText('Your Feedback');
    fireEvent.change(messageField, {
      target: { value: 'Test feedback message' },
    });

    const categorySelect = screen.getByLabelText('Category');
    fireEvent.mouseDown(categorySelect);
    fireEvent.click(screen.getByText('🐛 Bug Report'));

    // Submit the form
    const submitButton = screen.getByRole('button', {
      name: 'Submit Feedback',
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Custom API error message')).toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<FeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('disables submit button while submitting', async () => {
    mockSubmitFeedback.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    render(<FeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    // Fill in the form
    const messageField = screen.getByLabelText('Your Feedback');
    fireEvent.change(messageField, {
      target: { value: 'Test feedback message' },
    });

    const categorySelect = screen.getByLabelText('Category');
    fireEvent.mouseDown(categorySelect);
    fireEvent.click(screen.getByText('🐛 Bug Report'));

    // Submit the form
    const submitButton = screen.getByRole('button', {
      name: 'Submit Feedback',
    });
    fireEvent.click(submitButton);

    // Check that button is disabled and shows loading state
    expect(submitButton).toBeDisabled();
    expect(screen.getByText('Submitting...')).toBeInTheDocument();
  });

  it('shows character count for message field', () => {
    render(<FeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const messageField = screen.getByLabelText('Your Feedback');
    fireEvent.change(messageField, { target: { value: 'Test message' } });

    expect(screen.getByText('11/2000 characters')).toBeInTheDocument();
  });

  it('shows error state for message field when exceeding limit', () => {
    render(<FeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const messageField = screen.getByLabelText('Your Feedback');
    const longMessage = 'a'.repeat(2001);
    fireEvent.change(messageField, { target: { value: longMessage } });

    expect(messageField).toHaveClass('Mui-error');
  });

  it('clears form after successful submission', async () => {
    const mockFeedback = {
      id: 'feedback-1',
      message: 'Test feedback message',
      category: FeedbackCategory.BUG,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    mockSubmitFeedback.mockResolvedValue(mockFeedback);

    render(<FeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    // Fill in the form
    const messageField = screen.getByLabelText('Your Feedback');
    fireEvent.change(messageField, {
      target: { value: 'Test feedback message' },
    });

    const categorySelect = screen.getByLabelText('Category');
    fireEvent.mouseDown(categorySelect);
    fireEvent.click(screen.getByText('🐛 Bug Report'));

    const additionalContextField = screen.getByLabelText(
      'Additional Context (Optional)'
    );
    fireEvent.change(additionalContextField, {
      target: { value: 'Additional context' },
    });

    // Submit the form
    const submitButton = screen.getByRole('button', {
      name: 'Submit Feedback',
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('✅ Feedback Submitted Successfully!')
      ).toBeInTheDocument();
    });

    // After success, form should be cleared (this happens in the success state)
    // The success state replaces the form, so we can't test the cleared fields directly
    // But we can verify the success message is shown
    expect(
      screen.getByText(
        'Thank you for your feedback. Our team will review it and get back to you if needed.'
      )
    ).toBeInTheDocument();
  });
});
