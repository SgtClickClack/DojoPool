import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Error as ErrorIcon,
  Info as InfoIcon,
  BugReport as BugIcon,
  NotInterested as RejectIcon,
  AccountBalanceWallet as WalletIcon,
  Link as ChainIcon,
  AccountCircle as AccountIcon,
  SignalWifiOff as NetworkIcon,
  LocalAtm as FundsIcon,
  SwapHoriz as TransactionIcon,
  Create as SignIcon,
  Help as UnknownIcon
} from '@mui/icons-material';
import { WalletError, WalletErrorType } from '../../utils/walletErrorHandling';

interface WalletErrorRecoveryProps {
  error: WalletError | null;
  open: boolean;
  onClose: () => void;
  onRetry?: () => void;
}

const WalletErrorRecovery: React.FC<WalletErrorRecoveryProps> = ({
  error,
  open,
  onClose,
  onRetry
}) => {
  if (!error) return null;

  // Get icon based on error type
  const getErrorIcon = (errorType: WalletErrorType) => {
    switch (errorType) {
      case WalletErrorType.WALLET_NOT_FOUND:
        return <WalletIcon color="error" />;
      case WalletErrorType.USER_REJECTED:
        return <RejectIcon color="warning" />;
      case WalletErrorType.ACCOUNT_ACCESS_REJECTED:
        return <AccountIcon color="warning" />;
      case WalletErrorType.UNSUPPORTED_CHAIN:
        return <ChainIcon color="error" />;
      case WalletErrorType.NETWORK_ERROR:
        return <NetworkIcon color="error" />;
      case WalletErrorType.INSUFFICIENT_FUNDS:
        return <FundsIcon color="error" />;
      case WalletErrorType.TRANSACTION_FAILED:
        return <TransactionIcon color="error" />;
      case WalletErrorType.SIGNATURE_FAILED:
        return <SignIcon color="error" />;
      case WalletErrorType.CHAIN_SWITCH_FAILED:
        return <ChainIcon color="warning" />;
      case WalletErrorType.CONNECTION_FAILED:
        return <ErrorIcon color="error" />;
      case WalletErrorType.UNKNOWN:
      default:
        return <UnknownIcon color="error" />;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="wallet-error-dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="wallet-error-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {getErrorIcon(error.type)}
        <Typography variant="h6" component="span">
          Wallet Error
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" color="error" gutterBottom>
            {error.message}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {error.walletType === 'ethereum' ? 'Ethereum' : 'Solana'} wallet issue detected.
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <InfoIcon fontSize="small" sx={{ mr: 1 }} /> 
          Suggested Recovery Steps:
        </Typography>

        <List dense>
          {error.recoverySteps?.map((step, index) => (
            <ListItem key={index}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Typography variant="body2" fontWeight="bold">
                  {index + 1}.
                </Typography>
              </ListItemIcon>
              <ListItemText primary={step} />
            </ListItem>
          ))}
        </List>

        {error.type === WalletErrorType.UNKNOWN && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
              <BugIcon fontSize="small" sx={{ mr: 1, color: 'warning.main' }} />
              If this error persists, please contact support with this error code:
            </Typography>
            <Typography variant="caption" component="pre" sx={{ 
              p: 1, 
              mt: 1, 
              bgcolor: 'grey.100', 
              borderRadius: 1, 
              fontFamily: 'monospace', 
              overflowX: 'auto' 
            }}>
              {error.type}: {error.originalError?.message || 'Unknown error'}
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
        {error.recoverable && onRetry && (
          <Button onClick={onRetry} variant="contained" color="primary" autoFocus>
            Try Again
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default WalletErrorRecovery; 