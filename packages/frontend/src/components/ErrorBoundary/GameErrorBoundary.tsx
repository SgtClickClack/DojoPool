import React, { Component, ErrorInfo } from 'react';
import { ErrorTracker } from '../../services/error/ErrorTracker';
import { connect } from 'react-redux';

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    resetOnError?: boolean;
    gameId?: string;
    matchId?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class GameErrorBoundary extends Component<Props, State> {
    private errorTracker: ErrorTracker;

    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null
        };
        this.errorTracker = ErrorTracker.getInstance();
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Track error with context
        this.errorTracker.trackError(error, {
            component: 'GameErrorBoundary',
            timestamp: Date.now(),
            additionalInfo: {
                componentStack: errorInfo.componentStack,
                gameId: this.props.gameId,
                matchId: this.props.matchId
            }
        });

        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // Reset state if configured
        if (this.props.resetOnError) {
            this.setState({ hasError: false, error: null });
        }
    }

    handleRetry = (): void => {
        this.setState({ hasError: false, error: null });
    };

    render(): React.ReactNode {
        const { hasError, error } = this.state;
        const { children, fallback } = this.props;

        if (hasError) {
            if (fallback) {
                return fallback;
            }

            return (
                <div className="game-error-boundary">
                    <h2>Something went wrong in the game</h2>
                    <p>{error?.message || 'An unexpected error occurred'}</p>
                    <button 
                        onClick={this.handleRetry}
                        className="retry-button"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return children;
    }
}

const mapStateToProps = (state: any) => ({
    gameId: state.game?.currentGame?.id,
    matchId: state.game?.currentMatch?.id
});

export default connect(mapStateToProps)(GameErrorBoundary); 