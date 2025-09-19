'use client';

import {
  ArrowPathIcon,
  ChatBubbleLeftIcon,
  ExclamationTriangleIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console
    console.error('Global Error Boundary caught an error:', error, errorInfo);

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Report error to monitoring service
    this.reportError(error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorId: this.state.errorId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        userId: this.getUserId(),
        sessionId: this.getSessionId(),
      };

      // Send to error reporting service
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      });
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  };

  private getUserId = (): string | null => {
    try {
      return localStorage.getItem('user_id') || null;
    } catch {
      return null;
    }
  };

  private getSessionId = (): string | null => {
    try {
      return (
        localStorage.getItem('session_id') ||
        sessionStorage.getItem('session_id') ||
        null
      );
    } catch {
      return null;
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportIssue = () => {
    const errorId = this.state.errorId;
    const subject = encodeURIComponent(`Bug Report: ${errorId}`);
    const body = encodeURIComponent(`
Error ID: ${errorId}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
Timestamp: ${new Date().toISOString()}

Please describe what you were doing when this error occurred:
`);

    window.open(`mailto:support@dojopool.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-screen bg-gray-900 flex items-center justify-center p-4"
          >
            <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl p-6 text-center">
              {/* Error Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mx-auto w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-6"
              >
                <ExclamationTriangleIcon className="w-8 h-8 text-white" />
              </motion.div>

              {/* Error Title */}
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-white mb-2"
              >
                Oops! Something went wrong
              </motion.h1>

              {/* Error Message */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-300 mb-6"
              >
                We're sorry, but something unexpected happened. Our team has
                been notified and is working to fix this issue.
              </motion.p>

              {/* Error ID */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-gray-700 rounded-lg p-3 mb-6"
              >
                <p className="text-sm text-gray-400 mb-1">Error ID</p>
                <p className="font-mono text-sm text-gray-300">
                  {this.state.errorId}
                </p>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-3"
              >
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  <ArrowPathIcon className="w-5 h-5 mr-2" />
                  Try Again
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={this.handleGoHome}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <HomeIcon className="w-4 h-4 mr-1" />
                    Home
                  </button>

                  <button
                    onClick={this.handleReportIssue}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <ChatBubbleLeftIcon className="w-4 h-4 mr-1" />
                    Report
                  </button>
                </div>
              </motion.div>

              {/* Technical Details (only in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <motion.details
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="mt-6 text-left"
                >
                  <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300">
                    Technical Details
                  </summary>
                  <div className="mt-3 p-3 bg-gray-900 rounded-lg">
                    <p className="text-sm text-red-400 font-medium mb-2">
                      {this.state.error.name}: {this.state.error.message}
                    </p>
                    <pre className="text-xs text-gray-500 overflow-auto max-h-32">
                      {this.state.error.stack}
                    </pre>
                  </div>
                </motion.details>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
