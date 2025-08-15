import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Divider, ListItemAvatar, Avatar, ListItemSecondaryAction, IconButton } from '@mui/material';
import ListIcon from '@mui/icons-material/List';
import SendIcon from '@mui/icons-material/Send';
import { NftItem } from '../../types/nft';

interface EarnedNftsDisplayProps {
  nfts: NftItem[];
  onNftClick: (nft: NftItem) => void;
  onActionClick: (nft: NftItem, action: 'list' | 'transfer') => void;
}

const EarnedNftsDisplay: React.FC<EarnedNftsDisplayProps> = ({ nfts, onNftClick, onActionClick }) => {
  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6" gutterBottom>Earned NFTs (Trophy Cabinet)</Typography>
      <Divider sx={{ my: 1 }} />
      <List dense>
        {nfts.length === 0 ? (
          <ListItem>
            <ListItemText primary="No NFTs earned yet." />
          </ListItem>
        ) : (
          nfts.map((nft) => (
            <ListItem 
              key={nft.id} 
              button
              onClick={() => onNftClick(nft)}
            >
              {nft.imageUrl && (
                <ListItemAvatar>
                  <Avatar src={nft.imageUrl} alt={nft.name} />
                </ListItemAvatar>
              )}
              <ListItemText primary={nft.name} secondary={nft.description} />
              <ListItemSecondaryAction>
                <IconButton edge="end" aria-label="list" onClick={(e) => { e.stopPropagation(); onActionClick(nft, 'list'); }}>
                  <ListIcon />
                </IconButton>
                <IconButton edge="end" aria-label="transfer" onClick={(e) => { e.stopPropagation(); onActionClick(nft, 'transfer'); }}>
                  <SendIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))
        )}
      </List>
    </Paper>
  );
};

export default EarnedNftsDisplay; 