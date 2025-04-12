import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VenueAnalyticsDashboard from '../VenueAnalyticsDashboard';
import { VenueAnalyticsData } from '../types';

// Mock the analytics data
const mockAnalyticsData: VenueAnalyticsData = {
  totalRevenue: 10000,
  totalGames: 500,
  averageOccupancy: 75.5,
  peakHours: {
    '18:00': 90,
    '19:00': 95,
    '20:00': 85,
  },
  revenueByDay: [
    { date: '2024-01-01', revenue: 1000 },
    { date: '2024-01-02', revenue: 1200 },
    { date: '2024-01-03', revenue: 800 },
  ],
  gamesByDay: [
    { date: '2024-01-01', count: 50 },
    { date: '2024-01-02', count: 60 },
    { date: '2024-01-03', count: 40 },
  ],
  tableUtilization: [
    { tableId: 1, utilization: 80 },
    { tableId: 2, utilization: 70 },
    { tableId: 3, utilization: 90 },
  ],
  maintenanceStats: {
    totalMaintenance: 10,
    averageDuration: 2.5,
    maintenanceByReason: {
      'Cleaning': 5,
      'Repair': 3,
      'Inspection': 2,
    },
  },
};

// Mock the fetch function
global.fetch = jest.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockAnalyticsData),
  })
);

describe('VenueAnalyticsDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<VenueAnalyticsDashboard />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders error state when fetch fails', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error('Failed to fetch'))
    );
    render(<VenueAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/failed to fetch analytics/i)).toBeInTheDocument();
    });
  });

  it('renders analytics data correctly', async () => {
    render(<VenueAnalyticsDashboard />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('$10,000')).toBeInTheDocument(); // Total Revenue
      expect(screen.getByText('500')).toBeInTheDocument(); // Total Games
      expect(screen.getByText('75.5%')).toBeInTheDocument(); // Average Occupancy
    });

    // Check if charts are rendered
    expect(screen.getByTestId('revenue-chart')).toBeInTheDocument();
    expect(screen.getByTestId('games-chart')).toBeInTheDocument();
    expect(screen.getByTestId('utilization-chart')).toBeInTheDocument();
  });

  it('handles date range changes', async () => {
    render(<VenueAnalyticsDashboard />);
    
    // Wait for initial data load
    await waitFor(() => {
      expect(screen.getByText('$10,000')).toBeInTheDocument();
    });

    // Change date range
    const startDateInput = screen.getByLabelText(/start date/i);
    const endDateInput = screen.getByLabelText(/end date/i);

    fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
    fireEvent.change(endDateInput, { target: { value: '2024-01-31' } });

    // Verify fetch was called with new dates
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('start_date=2024-01-01&end_date=2024-01-31')
    );
  });

  it('handles venue selection changes', async () => {
    render(<VenueAnalyticsDashboard />);
    
    // Wait for initial data load
    await waitFor(() => {
      expect(screen.getByText('$10,000')).toBeInTheDocument();
    });

    // Change venue
    const venueSelect = screen.getByLabelText(/venue/i);
    fireEvent.change(venueSelect, { target: { value: '2' } });

    // Verify fetch was called with new venue ID
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/venues/2/analytics')
    );
  });

  it('handles data export', async () => {
    render(<VenueAnalyticsDashboard />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('$10,000')).toBeInTheDocument();
    });

    // Click export button
    const exportButton = screen.getByLabelText(/export data/i);
    fireEvent.click(exportButton);

    // Select export format
    const formatSelect = screen.getByLabelText(/export format/i);
    fireEvent.change(formatSelect, { target: { value: 'csv' } });

    // Click export
    const exportConfirmButton = screen.getByText(/export/i);
    fireEvent.click(exportConfirmButton);

    // Verify export service was called
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/venues/1/analytics/export?format=csv')
    );
  });

  it('handles filter toggling', async () => {
    render(<VenueAnalyticsDashboard />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('$10,000')).toBeInTheDocument();
    });

    // Toggle filters
    const filterButton = screen.getByLabelText(/filter analytics/i);
    fireEvent.click(filterButton);

    // Verify filters are visible
    expect(screen.getByText(/filters/i)).toBeInTheDocument();
  });

  it('handles refresh button click', async () => {
    render(<VenueAnalyticsDashboard />);
    
    // Wait for initial data load
    await waitFor(() => {
      expect(screen.getByText('$10,000')).toBeInTheDocument();
    });

    // Click refresh button
    const refreshButton = screen.getByLabelText(/refresh analytics/i);
    fireEvent.click(refreshButton);

    // Verify fetch was called again
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('displays maintenance statistics correctly', async () => {
    render(<VenueAnalyticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument(); // Total Maintenance
      expect(screen.getByText('2.5')).toBeInTheDocument(); // Average Duration
      
      // Check maintenance reasons
      expect(screen.getByText('Cleaning')).toBeInTheDocument();
      expect(screen.getByText('Repair')).toBeInTheDocument();
      expect(screen.getByText('Inspection')).toBeInTheDocument();
    });
  });

  it('displays table utilization correctly', async () => {
    render(<VenueAnalyticsDashboard />);
    
    await waitFor(() => {
      // Check table utilization data
      expect(screen.getByText('Table 1')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();
      expect(screen.getByText('Table 2')).toBeInTheDocument();
      expect(screen.getByText('70%')).toBeInTheDocument();
      expect(screen.getByText('Table 3')).toBeInTheDocument();
      expect(screen.getByText('90%')).toBeInTheDocument();
    });
  });
}); 