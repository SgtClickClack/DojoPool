import React, { Component, ErrorInfo } from 'react';
import {
    Box,
    Typography,
    Button,
    Alert,
    AlertTitle,
    Collapse,
    IconButton
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    expanded: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
        expanded: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null,
            expanded: false
        };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({
            error,
            errorInfo
        });

        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // Log error to your error reporting service
        console.error('Error caught by ErrorBoundary:', error, errorInfo);
    }

    private handleExpand = () => {
        this.setState(prev => ({ expanded: !prev.expanded }));
    };

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <Box sx={{ p: 2 }}>
                    <Alert 
                        severity="error"
                        action={
                            <Button 
                                color="inherit" 
                                size="small"
                                onClick={this.handleReload}
                            >
                                RELOAD PAGE
                            </Button>
                        }
                    >
                        <AlertTitle>Something went wrong</AlertTitle>
                        {this.state.error?.message || 'An unexpected error occurred'}
                    </Alert>

                    {this.state.errorInfo && (
                        <Box sx={{ mt: 2 }}>
                            <Box 
                                sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    '&:hover': { opacity: 0.8 }
                                }}
                                onClick={this.handleExpand}
                            >
                                <Typography variant="body2" color="text.secondary">
                                    Show error details
                                </Typography>
                                <IconButton size="small">
                                    {this.state.expanded ? <ExpandLess /> : <ExpandMore />}
                                </IconButton>
                            </Box>
                            <Collapse in={this.state.expanded}>
                                <Box 
                                    component="pre" 
                                    sx={{ 
                                        mt: 1, 
                                        p: 1, 
                                        bgcolor: 'background.paper',
                                        borderRadius: 1,
                                        overflow: 'auto'
                                    }}
                                >
                                    {this.state.errorInfo.componentStack}
                                </Box>
                            </Collapse>
                        </Box>
                    )}
                </Box>
            );
        }

        return this.props.children;
    }
} 