import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  AlertTitle,
  IconButton,
  Link
} from '@mui/material';
import {
  Error as ErrorIcon,
  ArrowForward as ArrowForwardIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Help as HelpIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { WalletError, WalletErrorType } from '../../utils/walletErrorHandling';
import { styled } from '@mui/material/styles';

const RecoveryStepItem = styled(ListItem)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  }
}));

interface WalletErrorDialogProps {
  error: WalletError | null;
  open: boolean;
  onClose: () => void;
  onRetry?: () => void;
  onGoToWallet?: (walletType: 'ethereum' | 'solana') => void;
}

/**
 * WalletErrorDialog Component
 * 
 * A dialog that displays wallet errors in a user-friendly way with specific
 * recovery steps based on the error type.
 */
const WalletErrorDialog: React.FC<WalletErrorDialogProps> = ({
  error,
  open,
  onClose,
  onRetry,
  onGoToWallet
}) => {
  if (!error) {
    return null;
  }

  const walletName = error.walletType === 'ethereum' ? 'Ethereum' : 'Solana';
  const walletIcon = error.walletType === 'ethereum' 
    ? 'https://cdn.iconscout.com/icon/free/png-256/ethereum-3-569581.png'
    : 'https://cryptologos.cc/logos/solana-sol-logo.png';
  
  const getErrorSeverity = (): 'error' | 'warning' | 'info' => {
    switch (error.type) {
      case WalletErrorType.INSUFFICIENT_FUNDS:
      case WalletErrorType.TRANSACTION_FAILED:
      case WalletErrorType.WALLET_NOT_FOUND:
        return 'error';
      case WalletErrorType.USER_REJECTED:
      case WalletErrorType.ACCOUNT_ACCESS_REJECTED:
      case WalletErrorType.CHAIN_SWITCH_FAILED:
        return 'warning';
      default:
        return 'info';
    }
  };

  const getHelpLink = (): string => {
    // Return appropriate help documentation links based on wallet type and error
    if (error.walletType === 'ethereum') {
      switch (error.type) {
        case WalletErrorType.WALLET_NOT_FOUND:
          return 'https://metamask.io/download/';
        case WalletErrorType.INSUFFICIENT_FUNDS:
          return 'https://consensys.net/blog/metamask/how-to-add-funds-to-your-metamask-wallet/';
        default:
          return 'https://metamask.io/faqs/';
      }
    } else {
      // Solana links
      switch (error.type) {
        case WalletErrorType.WALLET_NOT_FOUND:
          return 'https://phantom.app/download';
        case WalletErrorType.INSUFFICIENT_FUNDS:
          return 'https://phantom.app/help/adding-sol-to-your-wallet';
        default:
          return 'https://phantom.app/help';
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="wallet-error-dialog-title"
      aria-describedby="wallet-error-dialog-description"
      maxWidth="sm"
      fullWidth
      data-testid="wallet-error-dialog"
    >
      <DialogTitle id="wallet-error-dialog-title" sx={{ pr: 6 }}>
        <Box display="flex" alignItems="center">
          <ErrorIcon color="error" sx={{ mr: 1 }} />
          <Typography component="span">
            {walletName} Wallet Error
          </Typography>
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
          data-testid="close-button"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <Box
            component="img"
            src={walletIcon}
            alt={walletName}
            sx={{ width: 40, height: 40, mr: 2 }}
          />
          <Typography variant="h6" color="text.primary">
            {error.message}
          </Typography>
        </Box>

        <Alert severity={getErrorSeverity()} sx={{ mb: 3 }}>
          <AlertTitle>
            {error.recoverable ? 'This can be resolved' : 'Action required'}
          </AlertTitle>
          {error.recoverable 
            ? 'Follow the steps below to resolve this issue.'
            : 'This error requires your attention before you can proceed.'}
        </Alert>

        {error.recoverySteps && error.recoverySteps.length > 0 && (
          <>
            <Typography variant="subtitle1" gutterBottom>
              Recovery Steps:
            </Typography>
            <List>
              {error.recoverySteps.map((step, index) => (
                <RecoveryStepItem key={index} data-testid={`recovery-step-${index}`}>
                  <ListItemIcon>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: 'primary.main',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                      }}
                    >
                      {index + 1}
                    </Box>
                  </ListItemIcon>
                  <ListItemText primary={step} />
                </RecoveryStepItem>
              ))}
            </List>
          </>
        )}

        <Divider sx={{ my: 2 }} />
        
        <Typography variant="body2" color="text.secondary">
          Error details: {error.type} 
          {error.originalError && 
            ` (${typeof error.originalError === 'string' 
              ? error.originalError 
              : error.originalError.message || 'Unknown error'})`
          }
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'space-between' }}>
        <Box>
          <Button
            startIcon={<HelpIcon />}
            component={Link}
            href={getHelpLink()}
            target="_blank"
            rel="noopener"
            color="inherit"
            sx={{ mr: 1 }}
            data-testid="help-button"
          >
            Help Center
          </Button>
        </Box>

        <Box>
          {error.recoverable && onRetry && (
            <Button 
              onClick={onRetry}
              variant="contained" 
              color="primary"
              startIcon={<RefreshIcon />}
              sx={{ mr: 1 }}
              data-testid="retry-button"
            >
              Try Again
            </Button>
          )}
          
          {onGoToWallet && (
            <Button
              onClick={() => onGoToWallet(error.walletType)}
              variant="outlined"
              startIcon={<SettingsIcon />}
              sx={{ mr: 1 }}
            >
              Open Wallet
            </Button>
          )}
          
          <Button 
            onClick={onClose} 
            color="inherit"
            startIcon={<CloseIcon />}
            data-testid="close-dialog-button"
          >
            Close
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default WalletErrorDialog; 