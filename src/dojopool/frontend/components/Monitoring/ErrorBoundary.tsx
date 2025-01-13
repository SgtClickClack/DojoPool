import React, { Component, ErrorInfo } from 'react';
import { ErrorTracker } from '../../utils/monitoring';

interface Props {
  children: React.ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      errorInfo,
    });

    // Track error
    ErrorTracker.getInstance().trackError(error, {
      component: 'ErrorBoundary',
      severity: 'high',
      timestamp: Date.now(),
    });

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Call onReset callback if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h2>Something went wrong</h2>
            <div className="error-details">
              <div className="error-message">{this.state.error && this.state.error.toString()}</div>
              {this.state.errorInfo && (
                <pre className="error-stack">{this.state.errorInfo.componentStack}</pre>
              )}
            </div>
            <button className="retry-button" onClick={this.handleReset}>
              Try Again
            </button>
          </div>

          <style jsx>{`
            .error-boundary {
              padding: 20px;
              border-radius: 8px;
              background: #fff;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }

            .error-content {
              text-align: center;
            }

            h2 {
              color: #e53e3e;
              margin-bottom: 16px;
            }

            .error-details {
              margin: 16px 0;
              text-align: left;
            }

            .error-message {
              color: #4a5568;
              font-size: 16px;
              margin-bottom: 8px;
            }

            .error-stack {
              background: #f7fafc;
              padding: 12px;
              border-radius: 4px;
              font-size: 14px;
              color: #718096;
              overflow-x: auto;
              white-space: pre-wrap;
            }

            .retry-button {
              background: #4299e1;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
              transition: background-color 0.2s;
            }

            .retry-button:hover {
              background: #3182ce;
            }

            .retry-button:focus {
              outline: none;
              box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.5);
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}
