import React from 'react';
import { logError } from '../utils/analytics';
import ServerError from './ErrorPages/500';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        logError(error, {
            componentStack: errorInfo.componentStack,
            ...this.props.errorContext
        });
    }

    render() {
        if (this.state.hasError) {
            return <ServerError />;
        }

        return this.props.children;
    }
}

export default ErrorBoundary; 