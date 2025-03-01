import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box,
  Chip,
  Tooltip,
  Avatar
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  LinkOff as DisconnectIcon,
  Link as ConnectIcon,
  SwapHoriz as SwapIcon,
  ContentCopy as CopyIcon,
  AccountCircle as AccountIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useWallet } from '../../hooks/useWallet';
import { toast } from 'react-toastify';
import WalletErrorRecovery from './WalletErrorRecovery';
// Import wallet notifications utilities
import { 
  notifyWalletConnected, 
  notifyWalletDisconnected 
} from '../../utils/walletNotifications';

// Chain icons (you would need to add these to your assets)
import EthereumIcon from '../../assets/icons/ethereum.svg';
import SolanaIcon from '../../assets/icons/solana.svg';

interface CrossChainWalletButtonProps {
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  size?: 'small' | 'medium' | 'large';
  defaultChain?: 'ethereum' | 'solana';
  showBalances?: boolean;
  onConnected?: (chainType: 'ethereum' | 'solana') => void;
  onDisconnected?: (chainType: 'ethereum' | 'solana') => void;
}

export const CrossChainWalletButton: React.FC<CrossChainWalletButtonProps> = ({
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  defaultChain = 'ethereum',
  showBalances = true,
  onConnected,
  onDisconnected
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [connecting, setConnecting] = useState(false);
  const [activeCopyButton, setActiveCopyButton] = useState<string | null>(null);
  const [lastConnectAttempt, setLastConnectAttempt] = useState<'ethereum' | 'solana' | null>(null);
  
  const {
    connectWallet,
    disconnectWallet,
    walletAddress,
    isConnected,
    isConnecting,
    balance,
    isCrossChainReady,
    activeChainId,
    walletError,
    showErrorDialog,
    handleCloseErrorDialog
  } = useWallet();
  
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleConnect = async (chainType: 'ethereum' | 'solana') => {
    setConnecting(true);
    setLastConnectAttempt(chainType);
    
    try {
      const success = await connectWallet(chainType);
      if (success) {
        // Use the notification utility instead of toast directly
        const address = walletAddress[chainType] || '';
        notifyWalletConnected(chainType);
        toast.success(`${chainType === 'ethereum' ? 'Ethereum' : 'Solana'} wallet connected`);
        if (onConnected) onConnected(chainType);
      }
    } finally {
      setConnecting(false);
      handleClose();
    }
  };
  
  const handleDisconnect = async (chainType: 'ethereum' | 'solana') => {
    try {
      const address = walletAddress[chainType] || '';
      await disconnectWallet(chainType);
      // Use the notification utility instead of toast directly
      notifyWalletDisconnected(chainType);
      toast.info(`${chainType === 'ethereum' ? 'Ethereum' : 'Solana'} wallet disconnected`);
      if (onDisconnected) onDisconnected(chainType);
    } catch (error) {
      // Error handling is done by the useWallet hook
    }
    handleClose();
  };
  
  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setActiveCopyButton(address);
    toast.info('Address copied to clipboard');
    setTimeout(() => setActiveCopyButton(null), 2000);
  };

  const handleRetryConnection = async () => {
    if (lastConnectAttempt) {
      handleConnect(lastConnectAttempt);
    }
    handleCloseErrorDialog();
  };
  
  // Format address for display (first 6 and last 4 chars)
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  // Determine primary display based on connections
  const getPrimaryChainInfo = () => {
    // If ethereum is connected, show it first
    if (isConnected('ethereum')) {
      return {
        type: 'ethereum',
        address: walletAddress.ethereum,
        icon: EthereumIcon,
        chainLabel: activeChainId ? getEthereumNetworkName(activeChainId) : 'Ethereum'
      };
    }
    
    // Otherwise if solana is connected, show it
    if (isConnected('solana')) {
      return {
        type: 'solana',
        address: walletAddress.solana,
        icon: SolanaIcon,
        chainLabel: 'Solana'
      };
    }
    
    // Default to the preferred chain if nothing is connected
    return {
      type: defaultChain,
      address: null,
      icon: defaultChain === 'ethereum' ? EthereumIcon : SolanaIcon,
      chainLabel: defaultChain === 'ethereum' ? 'Ethereum' : 'Solana'
    };
  };
  
  // Get Ethereum network name from chain ID
  const getEthereumNetworkName = (chainId: string): string => {
    const id = Number(chainId);
    switch (id) {
      case 1:
        return 'Ethereum Mainnet';
      case 3:
        return 'Ropsten Testnet';
      case 4:
        return 'Rinkeby Testnet';
      case 5:
        return 'Goerli Testnet';
      case 42:
        return 'Kovan Testnet';
      case 56:
        return 'Binance Smart Chain';
      case 137:
        return 'Polygon';
      default:
        return `Chain ID ${chainId}`;
    }
  };
  
  const primaryChain = getPrimaryChainInfo();
  
  return (
    <>
      <Button
        variant={variant}
        color={color}
        size={size}
        onClick={handleClick}
        startIcon={<WalletIcon />}
        endIcon={isConnected('ethereum') || isConnected('solana') ? null : undefined}
        disabled={connecting || isConnecting}
      >
        {isConnected('ethereum') || isConnected('solana') ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <img 
              src={primaryChain.icon} 
              alt={primaryChain.type} 
              style={{ width: 16, height: 16 }} 
            />
            <Typography variant="body2">
              {formatAddress(primaryChain.address || '')}
            </Typography>
            {isCrossChainReady && (
              <Tooltip title="Cross-chain ready">
                <SwapIcon fontSize="small" color="success" />
              </Tooltip>
            )}
          </Box>
        ) : (
          'Connect Wallet'
        )}
      </Button>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            minWidth: '280px',
            p: 1
          }
        }}
      >
        <Typography variant="subtitle1" sx={{ px: 2, py: 1 }}>
          Blockchain Wallets
        </Typography>
        
        <Divider sx={{ mb: 1 }} />
        
        {/* Ethereum Wallet Section */}
        <Box sx={{ px: 2, py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <img src={EthereumIcon} alt="Ethereum" style={{ width: 20, height: 20, marginRight: 8 }} />
            <Typography variant="body1" fontWeight={500}>
              Ethereum
            </Typography>
            {isConnected('ethereum') && (
              <Chip 
                label={getEthereumNetworkName(activeChainId || '1')} 
                size="small" 
                color="primary" 
                sx={{ ml: 1 }} 
              />
            )}
          </Box>
          
          {isConnected('ethereum') ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                  {formatAddress(walletAddress.ethereum || '')}
                </Typography>
                <Tooltip title={activeCopyButton === walletAddress.ethereum ? 'Copied!' : 'Copy Address'}>
                  <IconButton 
                    size="small" 
                    onClick={() => walletAddress.ethereum && handleCopyAddress(walletAddress.ethereum)}
                  >
                    {activeCopyButton === walletAddress.ethereum ? <CheckIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </Box>
              
              {showBalances && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Balance:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {balance.ethereum ? parseFloat(balance.ethereum).toFixed(4) : '0.0000'} ETH
                  </Typography>
                </Box>
              )}
              
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<DisconnectIcon />}
                fullWidth
                onClick={() => handleDisconnect('ethereum')}
              >
                Disconnect
              </Button>
            </>
          ) : (
            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<ConnectIcon />}
              fullWidth
              onClick={() => handleConnect('ethereum')}
              disabled={connecting || isConnecting}
            >
              Connect MetaMask
            </Button>
          )}
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Solana Wallet Section */}
        <Box sx={{ px: 2, py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <img src={SolanaIcon} alt="Solana" style={{ width: 20, height: 20, marginRight: 8 }} />
            <Typography variant="body1" fontWeight={500}>
              Solana
            </Typography>
            {isConnected('solana') && (
              <Chip 
                label="Mainnet" 
                size="small" 
                color="primary" 
                sx={{ ml: 1 }} 
              />
            )}
          </Box>
          
          {isConnected('solana') ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                  {formatAddress(walletAddress.solana || '')}
                </Typography>
                <Tooltip title={activeCopyButton === walletAddress.solana ? 'Copied!' : 'Copy Address'}>
                  <IconButton 
                    size="small" 
                    onClick={() => walletAddress.solana && handleCopyAddress(walletAddress.solana)}
                  >
                    {activeCopyButton === walletAddress.solana ? <CheckIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </Box>
              
              {showBalances && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Balance:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {balance.solana ? parseFloat(balance.solana).toFixed(4) : '0.0000'} SOL
                  </Typography>
                </Box>
              )}
              
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<DisconnectIcon />}
                fullWidth
                onClick={() => handleDisconnect('solana')}
              >
                Disconnect
              </Button>
            </>
          ) : (
            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<ConnectIcon />}
              fullWidth
              onClick={() => handleConnect('solana')}
              disabled={connecting || isConnecting}
            >
              Connect Phantom
            </Button>
          )}
        </Box>
        
        {isCrossChainReady && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                <SwapIcon color="success" sx={{ mr: 1 }} />
                Cross-chain functionality enabled
              </Typography>
              <Typography variant="caption" color="text.secondary">
                You can now participate in cross-chain tournaments and activities across Ethereum and Solana.
              </Typography>
            </Box>
          </>
        )}
      </Menu>

      {/* Error dialog */}
      <WalletErrorRecovery
        error={walletError}
        open={showErrorDialog}
        onClose={handleCloseErrorDialog}
        onRetry={handleRetryConnection}
      />
    </>
  );
};

// Simple IconButton component for the Copy address functionality
const IconButton: React.FC<{
  size: 'small' | 'medium' | 'large';
  onClick: () => void;
  children: React.ReactNode;
}> = ({ size, onClick, children }) => {
  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: size === 'small' ? '4px' : size === 'medium' ? '8px' : '12px',
        borderRadius: '50%',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        color: 'primary.main',
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
        },
      }}
    >
      {children}
    </Box>
  );
};

export default CrossChainWalletButton; 