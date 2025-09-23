import React, { ComponentType, Component } from 'react';
import ErrorBoundary from '@/components/Common/ErrorBoundary';

interface ErrorBoundaryOptions {
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  componentName?: string;
  showRetry?: boolean;
  showHome?: boolean;
  showReport?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundaryWrapper extends Component<
  { children: React.ReactNode } & ErrorBoundaryOptions,
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode } & ErrorBoundaryOptions) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by withErrorBoundary:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <ErrorBoundary fallback={this.props.fallback}>
          {this.props.children}
        </ErrorBoundary>
      );
    }

    return this.props.children;
  }
}

export function withErrorBoundary<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: ErrorBoundaryOptions = {}
) {
  const WithErrorBoundaryComponent = (props: P) => {
    return (
      <ErrorBoundaryWrapper {...options}>
        <WrappedComponent {...props} />
      </ErrorBoundaryWrapper>
    );
  };

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundaryComponent;
}
