import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  CircularProgress, 
  Divider, 
  FormControl, 
  FormControlLabel, 
  Radio, 
  RadioGroup,
  Tooltip,
  Alert,
  Chip
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import PoolIcon from '@mui/icons-material/Pool';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { toast } from 'react-toastify';
import { crossChainTournamentService } from '../../services/crossChainTournamentService';
import { blockchainService } from '../../services/blockchainService';
import { useWallet } from '../../hooks/useWallet';
import { CrossChainWalletButton } from '../wallet/CrossChainWalletButton';
import { Link } from 'react-router-dom';
import { LoadingButton } from '@mui/lab';
import { AlertTitle } from '@mui/material';

interface TournamentRegistrationProps {
  tournamentId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const TournamentRegistration: React.FC<TournamentRegistrationProps> = ({ 
  tournamentId, 
  onSuccess, 
  onCancel 
}) => {
  // State
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [tournamentDetails, setTournamentDetails] = useState<any>(null);
  const [selectedChain, setSelectedChain] = useState<'ethereum' | 'solana'>('ethereum');
  const [walletStatus, setWalletStatus] = useState<{
    ethereum: boolean;
    solana: boolean;
  }>({ ethereum: false, solana: false });
  
  // Add new state for transaction
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [registrationStep, setRegistrationStep] = useState<'initial' | 'processing' | 'complete' | 'failed'>('initial');
  
  // Hooks
  const { connectWallet } = useWallet();
  
  // Load tournament details and check wallet status
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch tournament details with cross-chain information
        const details = await crossChainTournamentService.getTournamentWithChainDetails(tournamentId);
        setTournamentDetails(details);
        
        // Set the native chain as the default selected chain
        if (details.nativeChain) {
          setSelectedChain(details.nativeChain);
        }
        
        // Check wallet status for both chains
        const ethConnected = await blockchainService.isWalletConnected('ethereum');
        const solConnected = await blockchainService.isWalletConnected('solana');
        
        setWalletStatus({
          ethereum: ethConnected,
          solana: solConnected
        });
        
      } catch (error) {
        console.error('Error loading tournament details:', error);
        toast.error('Failed to load tournament details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [tournamentId]);
  
  // Handle chain selection change
  const handleChainChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedChain(event.target.value as 'ethereum' | 'solana');
  };
  
  // Handle wallet connection
  const handleConnectWallet = async () => {
    try {
      await connectWallet(selectedChain);
      
      // Update wallet status after connection attempt
      const isConnected = await blockchainService.isWalletConnected(selectedChain);
      setWalletStatus({
        ...walletStatus,
        [selectedChain]: isConnected
      });
      
      if (isConnected) {
        toast.success(`${selectedChain === 'ethereum' ? 'MetaMask' : 'Phantom'} wallet connected successfully.`);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error(`Failed to connect ${selectedChain === 'ethereum' ? 'MetaMask' : 'Phantom'} wallet.`);
    }
  };
  
  // Handle registration
  const handleRegister = async () => {
    if (!tournamentDetails) return;
    
    setRegistering(true);
    setRegistrationStep('processing');
    
    try {
      // Get appropriate entry fee based on selected blockchain
      const entryFee = selectedChain === 'ethereum' 
        ? tournamentDetails.entryFeeEth 
        : tournamentDetails.entryFeeSol;
      
      // Check if the tournament is cross-chain and if this is a cross-chain transaction
      const isCrossChainTransaction = tournamentDetails.isNativeChain !== selectedChain;
      
      // Calculate additional fees if this is a cross-chain transaction
      const crossChainFee = isCrossChainTransaction ? (selectedChain === 'ethereum' ? '0.001' : '0.05') : '0';
      const totalFee = (parseFloat(entryFee) + parseFloat(crossChainFee)).toString();
      
      // Show informational toast about the registration process
      toast.info(
        `Registering for ${tournamentDetails.name}. Please confirm the transaction in your wallet.`,
        { autoClose: 5000 }
      );
      
      // Call the service to register for the tournament
      const result = await crossChainTournamentService.registerForTournament(
        tournamentId,
        selectedChain,
        totalFee,
        isCrossChainTransaction
      );
      
      if (result.success) {
        setTransactionHash(result.transactionHash || null);
        setRegistrationStep('complete');
        toast.success('Successfully registered for the tournament!');
      } else {
        setRegistrationStep('failed');
        toast.error(`Registration failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error registering for tournament:', error);
      setRegistrationStep('failed');
      
      // Provide specific error messages based on common issues
      if (error instanceof Error) {
        if (error.message.includes('insufficient funds')) {
          toast.error('Insufficient funds in your wallet to complete registration.');
        } else if (error.message.includes('user rejected')) {
          toast.error('Transaction was rejected. Please try again when ready.');
        } else if (error.message.includes('network')) {
          toast.error('Network error. Please check your connection and try again.');
        } else {
          toast.error(`Registration failed: ${error.message}`);
        }
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      setRegistering(false);
    }
  };
  
  // Handle wallet connection success
  const handleWalletConnected = (chainType: 'ethereum' | 'solana') => {
    setSelectedChain(chainType);
    // Refresh wallet status
    blockchainService.checkWalletStatus(chainType)
      .then((status) => {
        setWalletStatus(prev => ({
          ...prev,
          [chainType]: status
        }));
      });
  };
  
  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Render error state if tournament details couldn't be loaded
  if (!tournamentDetails) {
    return (
      <Alert severity="error">
        Could not load tournament details. Please try again later.
      </Alert>
    );
  }
  
  // Determine if the tournament is cross-chain (accepts both Ethereum and Solana)
  const isCrossChainTournament = tournamentDetails.entryFees?.ethereum && tournamentDetails.entryFees?.solana;
  
  // Determine if this is a cross-chain transaction (paying with a different chain than the tournament's native chain)
  const isCrossChainTransaction = selectedChain !== tournamentDetails.nativeChain;
  
  // Calculate additional fee if applicable
  const baseFee = tournamentDetails.entryFees[selectedChain];
  const nativeFee = tournamentDetails.entryFees[tournamentDetails.nativeChain];
  
  return (
    <>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="400px">
          <CircularProgress />
        </Box>
      ) : !tournamentDetails ? (
        <Box p={3}>
          <Typography variant="h5" color="error">
            Unable to load tournament details
          </Typography>
          <Button variant="outlined" color="primary" sx={{ mt: 2 }} component={Link} to="/tournaments">
            View All Tournaments
          </Button>
        </Box>
      ) : (
        <Box p={3}>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h4">{tournamentDetails.name}</Typography>
                <Box>
                  <Chip 
                    label={`Prize Pool: ${tournamentDetails.prizePool} ${tournamentDetails.isNativeChain === 'ethereum' ? 'ETH' : 'SOL'}`} 
                    color="primary" 
                    sx={{ mr: 1 }}
                  />
                  <Chip 
                    label={`${tournamentDetails.participantsCount}/${tournamentDetails.maxParticipants} Participants`} 
                    color={tournamentDetails.participantsCount >= tournamentDetails.maxParticipants ? 'error' : 'default'} 
                  />
                </Box>
              </Box>
              
              <Typography variant="body1" mb={2}>
                {tournamentDetails.description}
              </Typography>
              
              <Box mb={2}>
                <Chip 
                  icon={<AccessTimeIcon />} 
                  label={`Starts: ${new Date(tournamentDetails.startTime).toLocaleString()}`} 
                  sx={{ mr: 1, mb: 1 }}
                />
                <Chip 
                  icon={<LocationOnIcon />} 
                  label={tournamentDetails.location} 
                  sx={{ mr: 1, mb: 1 }}
                />
                <Chip 
                  icon={<FormatListBulletedIcon />} 
                  label={tournamentDetails.format} 
                  sx={{ mr: 1, mb: 1 }}
                />
                <Chip 
                  icon={<PoolIcon />} 
                  label={tournamentDetails.gameType} 
                  sx={{ mb: 1 }}
                />
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" mb={2}>
                Registration Details
              </Typography>
              
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' }, 
                  justifyContent: 'space-between',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  gap: 2,
                  mb: 2
                }}
              >
                <Box>
                  <Box display="flex" alignItems="center">
                    <Typography variant="subtitle1" component="div">
                      Native Chain: 
                    </Typography>
                    <Chip 
                      label={tournamentDetails.isNativeChain === 'ethereum' ? 'Ethereum' : 'Solana'}
                      color={tournamentDetails.isNativeChain === 'ethereum' ? 'primary' : 'secondary'}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Box>
                  
                  <Typography variant="subtitle2" color="text.secondary" mt={1}>
                    {tournamentDetails.isNativeChain === 'ethereum' 
                      ? 'This tournament is hosted on Ethereum blockchain' 
                      : 'This tournament is hosted on Solana blockchain'}
                  </Typography>
                </Box>
                
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: { xs: 'flex-start', sm: 'flex-end' }
                  }}
                >
                  <Typography variant="subtitle1">Registration Deadline</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(tournamentDetails.registrationDeadline).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
              
              {tournamentDetails.isCrossChain && (
                <Box mb={3}>
                  <Alert severity="info" icon={<SwapHorizIcon />}>
                    <AlertTitle>Cross-Chain Tournament</AlertTitle>
                    This tournament supports registration from both Ethereum and Solana blockchains. Choose your preferred payment method below.
                  </Alert>
                </Box>
              )}
              
              {tournamentDetails.isCrossChain && (
                <Box mb={3}>
                  <Typography variant="subtitle1" mb={1}>Select Payment Method</Typography>
                  <RadioGroup 
                    row 
                    value={selectedChain} 
                    onChange={(e) => setSelectedChain(e.target.value as 'ethereum' | 'solana')}
                  >
                    <FormControlLabel 
                      value="ethereum" 
                      control={<Radio />} 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <img 
                            src="/assets/icons/ethereum.svg" 
                            alt="Ethereum" 
                            style={{ width: 20, height: 20, marginRight: 8 }} 
                          />
                          Ethereum
                        </Box>
                      } 
                    />
                    <FormControlLabel 
                      value="solana" 
                      control={<Radio />} 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <img 
                            src="/assets/icons/solana.svg" 
                            alt="Solana" 
                            style={{ width: 20, height: 20, marginRight: 8 }} 
                          />
                          Solana
                        </Box>
                      } 
                    />
                  </RadioGroup>
                </Box>
              )}
              
              <Box mb={3}>
                <Typography variant="subtitle1" mb={1}>Entry Fee</Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  {tournamentDetails.isCrossChain ? (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <img 
                          src="/assets/icons/ethereum.svg" 
                          alt="Ethereum" 
                          style={{ width: 20, height: 20, marginRight: 8 }} 
                        />
                        <Box
                          sx={{ 
                            fontWeight: selectedChain === 'ethereum' ? 'bold' : 'normal',
                            color: selectedChain === 'ethereum' ? 'primary.main' : 'text.primary',
                            typography: 'body1',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          {tournamentDetails.entryFeeEth} ETH
                          {tournamentDetails.isNativeChain === 'ethereum' && (
                            <Chip label="Native Chain" size="small" color="primary" sx={{ ml: 1 }} />
                          )}
                          {selectedChain === 'ethereum' && (
                            <Chip 
                              label={walletStatus.ethereum ? 'Wallet Connected' : 'Wallet Not Connected'} 
                              size="small" 
                              color={walletStatus.ethereum ? 'success' : 'error'} 
                              sx={{ ml: 1 }} 
                            />
                          )}
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <img 
                          src="/assets/icons/solana.svg" 
                          alt="Solana" 
                          style={{ width: 20, height: 20, marginRight: 8 }} 
                        />
                        <Typography 
                          variant="body1" 
                          component="div"
                          sx={{ 
                            fontWeight: selectedChain === 'solana' ? 'bold' : 'normal',
                            color: selectedChain === 'solana' ? 'secondary.main' : 'text.primary',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          {tournamentDetails.entryFeeSol} SOL
                        </Typography>
                        {tournamentDetails.isNativeChain === 'solana' && (
                          <Chip label="Native Chain" size="small" color="secondary" sx={{ ml: 1 }} />
                        )}
                        {selectedChain === 'solana' && (
                          <Chip 
                            label={walletStatus.solana ? 'Wallet Connected' : 'Wallet Not Connected'} 
                            size="small" 
                            color={walletStatus.solana ? 'success' : 'error'} 
                            sx={{ ml: 1 }} 
                          />
                        )}
                      </Box>
                    </>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <img 
                        src={tournamentDetails.isNativeChain === 'ethereum' ? '/assets/icons/ethereum.svg' : '/assets/icons/solana.svg'} 
                        alt={tournamentDetails.isNativeChain} 
                        style={{ width: 20, height: 20, marginRight: 8 }} 
                      />
                      <Box sx={{ typography: 'body1', display: 'flex', alignItems: 'center' }}>
                        {tournamentDetails.isNativeChain === 'ethereum' 
                          ? `${tournamentDetails.entryFeeEth} ETH` 
                          : `${tournamentDetails.entryFeeSol} SOL`}
                        <Chip 
                          label={walletStatus[tournamentDetails.isNativeChain] ? 'Wallet Connected' : 'Wallet Not Connected'} 
                          size="small" 
                          color={walletStatus[tournamentDetails.isNativeChain] ? 'success' : 'error'} 
                          sx={{ ml: 1 }} 
                        />
                      </Box>
                    </Box>
                  )}
                </Box>
                
                {tournamentDetails.isCrossChain && selectedChain !== tournamentDetails.isNativeChain && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    You are registering using a different blockchain than the tournament's native chain. 
                    Additional conversion fees may apply.
                  </Alert>
                )}
              </Box>
              
              <Box mt={4} display="flex" justifyContent="space-between" alignItems="center">
                {!walletStatus[selectedChain] ? (
                  <CrossChainWalletButton 
                    variant="contained" 
                    color={selectedChain === 'ethereum' ? 'primary' : 'secondary'}
                    defaultChain={selectedChain}
                    onConnected={handleWalletConnected}
                    disabled={registering}
                  />
                ) : (
                  <>
                    <Button 
                      variant="outlined" 
                      component={Link} 
                      to="/tournaments" 
                      disabled={registering}
                    >
                      Cancel
                    </Button>
                    <LoadingButton 
                      variant="contained" 
                      color="primary" 
                      onClick={handleRegister} 
                      loading={registering}
                      disabled={
                        tournamentDetails.participantsCount >= tournamentDetails.maxParticipants || 
                        new Date() > new Date(tournamentDetails.registrationDeadline) ||
                        !walletStatus[selectedChain]
                      }
                      loadingPosition="start"
                      startIcon={<HowToRegIcon />}
                    >
                      Register Now
                    </LoadingButton>
                  </>
                )}
              </Box>
              
              {registrationStep === 'complete' && transactionHash && (
                <Box mt={3}>
                  <Alert severity="success">
                    <AlertTitle>Registration Complete!</AlertTitle>
                    Your registration was successful. Transaction has been recorded on the blockchain.
                    <Box mt={1}>
                      <Typography variant="body2">
                        Transaction Hash: 
                        <Link 
                          href={`${selectedChain === 'ethereum' ? 'https://etherscan.io/tx/' : 'https://explorer.solana.com/tx/'}${transactionHash}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          {transactionHash.slice(0, 10)}...{transactionHash.slice(-6)}
                        </Link>
                      </Typography>
                    </Box>
                  </Alert>
                </Box>
              )}
              
              {registrationStep === 'failed' && (
                <Box mt={3}>
                  <Alert severity="error">
                    <AlertTitle>Registration Failed</AlertTitle>
                    Please check your wallet balance and try again. If the problem persists, contact support.
                  </Alert>
                </Box>
              )}
              
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
                By registering, you agree to the tournament rules and terms. Entry fees are non-refundable.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}
    </>
  );
}; 