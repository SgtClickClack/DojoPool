import React from 'react';
import { Box, Typography, Paper, Button, Divider } from '@mui/material';
import { NftItem } from '../../types/nft';
import Snackbar from '@mui/material/Snackbar';

interface NftDetailViewProps {
  nft: NftItem;
  onClose: () => void;
}

const NftDetailView: React.FC<NftDetailViewProps> = ({ nft, onClose }) => {
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMsg, setSnackbarMsg] = React.useState('');

  const handleAction = (action: 'list' | 'transfer') => {
    setSnackbarMsg(`${action === 'list' ? 'List' : 'Transfer'} NFT: not yet implemented`);
    setSnackbarOpen(true);
  };

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Typography variant="h5" gutterBottom>NFT Details</Typography>
      <Divider sx={{ my: 2 }} />
      <Box>
        {nft.imageUrl && (
          <Box sx={{ mb: 2 }}>
            <img src={nft.imageUrl} alt={nft.name} style={{ maxWidth: '100%', height: 'auto' }} />
          </Box>
        )}
        <Typography variant="h6">{nft.name}</Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>{nft.description}</Typography>
        {nft.contractAddress && (
          <Typography variant="body2"><strong>Contract Address:</strong> {nft.contractAddress}</Typography>
        )}
        {nft.tokenId && (
          <Typography variant="body2"><strong>Token ID:</strong> {nft.tokenId}</Typography>
        )}
        {nft.collection && nft.collection.name && (
          <Typography variant="body2"><strong>Collection:</strong> {nft.collection.name}</Typography>
        )}
        {nft.owner && (
          <Typography variant="body2"><strong>Owner:</strong> {nft.owner}</Typography>
        )}
        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button variant="outlined" onClick={() => handleAction('list')}>List NFT</Button>
          <Button variant="outlined" onClick={() => handleAction('transfer')}>Transfer NFT</Button>
        </Box>
      </Box>
      <Button variant="contained" onClick={onClose} sx={{ mt: 3 }}>
        Back to Rewards
      </Button>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMsg}
      />
    </Paper>
  );
};

export default NftDetailView; 