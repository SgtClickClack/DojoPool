import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';
import { ErrorTracker } from '../../../utils/monitoring';

// Mock ErrorTracker
jest.mock('../../../utils/monitoring', () => ({
  ErrorTracker: {
    getInstance: jest.fn(() => ({
      trackError: jest.fn(),
    })),
  },
}));

describe('ErrorBoundary', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };

  const consoleError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = consoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders children when there is no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(getByText('Test content')).toBeInTheDocument();
  });

  test('renders error UI when there is an error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeInTheDocument();
    expect(getByText(/Test error/)).toBeInTheDocument();
  });

  test('calls onError when an error occurs', () => {
    const onError = jest.fn();
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][0].message).toBe('Test error');
  });

  test('tracks error with ErrorTracker', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const mockTrackError = ErrorTracker.getInstance().trackError;
    expect(mockTrackError).toHaveBeenCalledTimes(1);
    expect(mockTrackError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(mockTrackError.mock.calls[0][0].message).toBe('Test error');
    expect(mockTrackError.mock.calls[0][1]).toEqual({
      component: 'ErrorBoundary',
      severity: 'high',
      timestamp: expect.any(Number),
    });
  });

  test('resets error state when Try Again button is clicked', () => {
    const onReset = jest.fn();
    const { getByText } = render(
      <ErrorBoundary onReset={onReset}>
        <ThrowError />
      </ErrorBoundary>
    );

    const tryAgainButton = getByText('Try Again');
    fireEvent.click(tryAgainButton);

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  test('handles nested errors', () => {
    const NestedError = () => (
      <div>
        <ThrowError />
      </div>
    );

    const { getByText } = render(
      <ErrorBoundary>
        <NestedError />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeInTheDocument();
    expect(getByText(/Test error/)).toBeInTheDocument();
  });

  test('maintains error boundary isolation', () => {
    const SafeComponent = () => <div>Safe content</div>;

    const { getByText } = render(
      <div>
        <ErrorBoundary>
          <SafeComponent />
        </ErrorBoundary>
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
        <ErrorBoundary>
          <SafeComponent />
        </ErrorBoundary>
      </div>
    );

    expect(getByText('Safe content')).toBeInTheDocument();
    expect(getByText('Something went wrong')).toBeInTheDocument();
  });
});
