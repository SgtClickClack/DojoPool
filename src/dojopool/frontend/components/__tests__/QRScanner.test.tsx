import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QRScanner } from '../QRScanner';
import { api } from '../../services/api';
import { SnackbarProvider } from 'notistack';
import { ThemeProvider, createTheme } from '@mui/material';

// Mock dependencies
jest.mock('../../services/api');
jest.mock('react-qr-reader', () => ({
  QrReader: () => <div data-testid="qr-reader">QR Reader Mock</div>
}));

const mockTheme = createTheme();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={mockTheme}>
      <SnackbarProvider>
        {component}
      </SnackbarProvider>
    </ThemeProvider>
  );
};

describe('QRScanner', () => {
  const mockVenueId = 'venue123';
  const mockTableId = 'table456';
  const mockQrCode = 'base64_encoded_qr';
  const mockScanSuccess = jest.fn();
  const mockScanError = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('loads QR code on mount when venue and table IDs are provided', async () => {
    // Mock API response
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { qr_code: mockQrCode }
    });
    
    renderWithProviders(
      <QRScanner
        venueId={mockVenueId}
        tableId={mockTableId}
        onScanSuccess={mockScanSuccess}
        onScanError={mockScanError}
      />
    );
    
    // Verify API call
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        `/venues/${mockVenueId}/tables/${mockTableId}/qr`
      );
    });
    
    // Verify QR code display
    const qrImage = screen.getByAltText('Table QR Code');
    expect(qrImage).toBeInTheDocument();
    expect(qrImage).toHaveAttribute(
      'src',
      `data:image/png;base64,${mockQrCode}`
    );
  });
  
  it('handles QR code loading error', async () => {
    // Mock API error
    (api.get as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
    
    renderWithProviders(
      <QRScanner
        venueId={mockVenueId}
        tableId={mockTableId}
        onScanSuccess={mockScanSuccess}
        onScanError={mockScanError}
      />
    );
    
    // Verify error handling
    await waitFor(() => {
      expect(screen.queryByAltText('Table QR Code')).not.toBeInTheDocument();
    });
  });
  
  it('refreshes QR code when refresh button is clicked', async () => {
    // Mock initial load
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { qr_code: mockQrCode }
    });
    
    // Mock refresh response
    (api.post as jest.Mock).mockResolvedValueOnce({
      data: { qr_code: 'new_qr_code' }
    });
    
    renderWithProviders(
      <QRScanner
        venueId={mockVenueId}
        tableId={mockTableId}
        onScanSuccess={mockScanSuccess}
        onScanError={mockScanError}
      />
    );
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByAltText('Table QR Code')).toBeInTheDocument();
    });
    
    // Click refresh button
    const refreshButton = screen.getByTestId('RefreshIcon').parentElement;
    fireEvent.click(refreshButton!);
    
    // Verify refresh API call
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        `/venues/${mockVenueId}/tables/${mockTableId}/qr/refresh`
      );
    });
    
    // Verify updated QR code
    const qrImage = screen.getByAltText('Table QR Code');
    expect(qrImage).toHaveAttribute(
      'src',
      'data:image/png;base64,new_qr_code'
    );
  });
  
  it('opens scanner dialog when scan button is clicked', () => {
    renderWithProviders(
      <QRScanner
        onScanSuccess={mockScanSuccess}
        onScanError={mockScanError}
      />
    );
    
    // Click scan button
    const scanButton = screen.getByText('Scan QR Code');
    fireEvent.click(scanButton);
    
    // Verify dialog is open
    expect(screen.getByTestId('qr-reader')).toBeInTheDocument();
  });
  
  it('handles successful QR code scan', async () => {
    // Mock verification response
    (api.post as jest.Mock).mockResolvedValueOnce({
      data: {
        valid: true,
        table_id: mockTableId,
        venue_id: mockVenueId,
        timestamp: new Date().toISOString()
      }
    });
    
    renderWithProviders(
      <QRScanner
        onScanSuccess={mockScanSuccess}
        onScanError={mockScanError}
      />
    );
    
    // Open scanner
    fireEvent.click(screen.getByText('Scan QR Code'));
    
    // Simulate successful scan
    const mockScanData = 'scanned_qr_data';
    await waitFor(() => {
      const qrReader = screen.getByTestId('qr-reader');
      fireEvent.change(qrReader, { target: { value: mockScanData } });
    });
    
    // Verify verification API call
    expect(api.post).toHaveBeenCalledWith('/qr/verify', {
      qr_data: mockScanData
    });
    
    // Verify success callback
    expect(mockScanSuccess).toHaveBeenCalled();
  });
  
  it('handles QR code verification error', async () => {
    // Mock verification error
    (api.post as jest.Mock).mockRejectedValueOnce({
      response: {
        data: {
          error: 'Invalid QR code'
        }
      }
    });
    
    renderWithProviders(
      <QRScanner
        onScanSuccess={mockScanSuccess}
        onScanError={mockScanError}
      />
    );
    
    // Open scanner
    fireEvent.click(screen.getByText('Scan QR Code'));
    
    // Simulate failed scan
    const mockScanData = 'invalid_qr_data';
    await waitFor(() => {
      const qrReader = screen.getByTestId('qr-reader');
      fireEvent.change(qrReader, { target: { value: mockScanData } });
    });
    
    // Verify error callback
    expect(mockScanError).toHaveBeenCalledWith('Invalid QR code');
  });
  
  it('closes scanner dialog when cancel is clicked', () => {
    renderWithProviders(
      <QRScanner
        onScanSuccess={mockScanSuccess}
        onScanError={mockScanError}
      />
    );
    
    // Open scanner
    fireEvent.click(screen.getByText('Scan QR Code'));
    
    // Click cancel
    fireEvent.click(screen.getByText('Cancel'));
    
    // Verify dialog is closed
    expect(screen.queryByTestId('qr-reader')).not.toBeInTheDocument();
  });
}); 