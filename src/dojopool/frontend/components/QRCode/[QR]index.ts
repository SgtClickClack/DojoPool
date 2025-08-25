export { default as QRDialog } from './[QR]QRDialog';
export { default as QRDisplay } from './[QR]QRDisplay';
export { default as QRScanner } from './[QR]QRScanner';

// Types
export interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

export interface QRDisplayProps {
  qrCode: string;
  title?: string;
  tableNumber?: number;
  onDownload?: () => void;
}

export interface QRDialogProps {
  open: boolean;
  onClose: () => void;
  onScan?: (data: string) => void;
  qrCode?: string;
  tableNumber?: number;
  mode?: 'scan' | 'display' | 'both';
  title?: string;
}
