import React from 'react';

interface QRScannerProps {
  onScanSuccess?: (result: any) => void;
  onScanError?: (error: string) => void;
  venueId?: string;
  tableId?: string;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onScanSuccess,
  onScanError,
  venueId,
  tableId,
}) => {
  // Temporarily disabled due to build issues
  return (
    <div>
      <p>QR Scanner temporarily disabled due to build issues</p>
      <p>Props received: venueId={venueId}, tableId={tableId}</p>
    </div>
  );
};
