import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PredictiveDashboard } from '../../../components/predictive/PredictiveDashboard';
import { usePredictiveAnalytics } from '../../../hooks/usePredictiveAnalytics';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../../../theme';

// Mock the custom hook
jest.mock('../../../hooks/usePredictiveAnalytics');

const mockUsePredictiveAnalytics = usePredictiveAnalytics as jest.Mock;

describe('PredictiveDashboard', () => {
    const mockModelMetrics = {
        performance_forecast: {
            mse: 0.15,
            mae: 0.12,
            r2: 0.85
        },
        skill_progression: {
            mse: 0.18,
            mae: 0.14,
            r2: 0.82
        },
        matchup_prediction: {
            accuracy: 0.78,
            precision: 0.76,
            recall: 0.75
        }
    };

    beforeEach(() => {
        mockUsePredictiveAnalytics.mockReturnValue({
            loading: false,
            error: null,
            modelMetrics: mockModelMetrics,
            fetchModelMetrics: jest.fn(),
            generatePerformanceForecast: jest.fn(),
            predictSkillProgression: jest.fn(),
            predictMatchup: jest.fn(),
            clearError: jest.fn()
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('renders without crashing', () => {
        render(
            <ThemeProvider theme={theme}>
                <PredictiveDashboard />
            </ThemeProvider>
        );
        expect(screen.getByText('Predictive Analytics Dashboard')).toBeInTheDocument();
    });

    it('displays loading state', () => {
        mockUsePredictiveAnalytics.mockReturnValue({
            loading: true,
            error: null,
            modelMetrics: null,
            fetchModelMetrics: jest.fn()
        });

        render(
            <ThemeProvider theme={theme}>
                <PredictiveDashboard />
            </ThemeProvider>
        );
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('displays error state', () => {
        const errorMessage = 'Failed to load data';
        mockUsePredictiveAnalytics.mockReturnValue({
            loading: false,
            error: errorMessage,
            modelMetrics: null,
            fetchModelMetrics: jest.fn()
        });

        render(
            <ThemeProvider theme={theme}>
                <PredictiveDashboard />
            </ThemeProvider>
        );
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('switches between tabs correctly', async () => {
        render(
            <ThemeProvider theme={theme}>
                <PredictiveDashboard />
            </ThemeProvider>
        );

        // Click on each tab and verify content changes
        const tabs = [
            'Performance Forecast',
            'Skill Progression',
            'Matchup Prediction',
            'Model Metrics'
        ];

        for (const tab of tabs) {
            fireEvent.click(screen.getByRole('tab', { name: tab }));
            await waitFor(() => {
                expect(screen.getByRole('tabpanel')).toBeVisible();
            });
        }
    });

    it('fetches model metrics on mount', () => {
        const fetchModelMetrics = jest.fn();
        mockUsePredictiveAnalytics.mockReturnValue({
            loading: false,
            error: null,
            modelMetrics: mockModelMetrics,
            fetchModelMetrics
        });

        render(
            <ThemeProvider theme={theme}>
                <PredictiveDashboard />
            </ThemeProvider>
        );

        expect(fetchModelMetrics).toHaveBeenCalledTimes(1);
    });

    it('displays model metrics correctly', () => {
        render(
            <ThemeProvider theme={theme}>
                <PredictiveDashboard />
            </ThemeProvider>
        );

        // Switch to Model Metrics tab
        fireEvent.click(screen.getByRole('tab', { name: 'Model Metrics' }));

        // Verify metrics are displayed
        expect(screen.getByText('Performance Forecast Metrics')).toBeInTheDocument();
        expect(screen.getByText('Skill Progression Metrics')).toBeInTheDocument();
        expect(screen.getByText('Matchup Prediction Metrics')).toBeInTheDocument();
    });

    it('handles error clearing', () => {
        const clearError = jest.fn();
        mockUsePredictiveAnalytics.mockReturnValue({
            loading: false,
            error: 'Test error',
            modelMetrics: null,
            fetchModelMetrics: jest.fn(),
            clearError
        });

        render(
            <ThemeProvider theme={theme}>
                <PredictiveDashboard />
            </ThemeProvider>
        );

        // Verify error is displayed and can be cleared
        expect(screen.getByText('Test error')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /close/i }));
        expect(clearError).toHaveBeenCalledTimes(1);
    });

    it('updates when new data is received', async () => {
        const { rerender } = render(
            <ThemeProvider theme={theme}>
                <PredictiveDashboard />
            </ThemeProvider>
        );

        // Update mock with new data
        const newModelMetrics = {
            ...mockModelMetrics,
            performance_forecast: {
                ...mockModelMetrics.performance_forecast,
                mse: 0.10
            }
        };

        mockUsePredictiveAnalytics.mockReturnValue({
            loading: false,
            error: null,
            modelMetrics: newModelMetrics,
            fetchModelMetrics: jest.fn()
        });

        rerender(
            <ThemeProvider theme={theme}>
                <PredictiveDashboard />
            </ThemeProvider>
        );

        // Switch to Model Metrics tab
        fireEvent.click(screen.getByRole('tab', { name: 'Model Metrics' }));

        // Verify new metrics are displayed
        await waitFor(() => {
            expect(screen.getByText('MSE: 0.10')).toBeInTheDocument();
        });
    });

    it('handles tab panel accessibility', () => {
        render(
            <ThemeProvider theme={theme}>
                <PredictiveDashboard />
            </ThemeProvider>
        );

        const tabs = screen.getAllByRole('tab');
        const tabPanel = screen.getByRole('tabpanel');

        // Verify ARIA attributes
        tabs.forEach((tab, index) => {
            expect(tab).toHaveAttribute('aria-controls', `predictive-tabpanel-${index}`);
        });

        expect(tabPanel).toHaveAttribute('aria-labelledby', 'predictive-tab-0');
    });
}); 