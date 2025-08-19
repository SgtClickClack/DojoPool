import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Chip,
  Box,
  Divider,
} from '@mui/material';
import {
  CallReceived,
  CallMade,
  EmojiEvents,
  ShoppingCart,
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/format';
import { formatDistanceToNow } from 'date-fns';
import { type Transaction } from '../../types/wallet';

interface WalletTransactionListProps {
  transactions: Transaction[];
}

export const WalletTransactionList: React.FC<WalletTransactionListProps> = ({
  transactions,
}) => {
  const getTransactionIcon = (type: string | undefined, amount: number) => {
    const upperType = type?.toUpperCase();
    if (upperType === 'REWARD')
      return (
        <EmojiEvents
          sx={{ color: '#ff00ff', textShadow: '0 0 10px #ff00ff' }}
        />
      );
    if (upperType === 'PURCHASE')
      return (
        <ShoppingCart
          sx={{ color: '#00a8ff', textShadow: '0 0 10px #00a8ff' }}
        />
      );
    return amount > 0 ? (
      <CallReceived sx={{ color: '#00ff9d', textShadow: '0 0 10px #00ff9d' }} />
    ) : (
      <CallMade sx={{ color: '#ff3860', textShadow: '0 0 10px #ff3860' }} />
    );
  };

  const getTransactionColor = (type: string | undefined, amount: number) => {
    const upperType = type?.toUpperCase();
    if (upperType === 'REWARD') return '#ff00ff';
    if (upperType === 'PURCHASE') return '#00a8ff';
    return amount > 0 ? '#00ff9d' : '#ff3860';
  };

  const getTransactionLabel = (transaction: Transaction) => {
    const upperType = transaction.type?.toUpperCase();
    if (upperType === 'REWARD') return 'Reward';
    if (upperType === 'PURCHASE') return 'Purchase';
    if (upperType === 'TRANSFER') {
      return transaction.amount > 0 ? 'Received Transfer' : 'Sent Transfer';
    }
    return transaction.amount > 0 ? 'Received' : 'Sent';
  };

  const cyberListItemStyle = {
    background: 'rgba(16, 24, 39, 0.8)',
    border: '1px solid rgba(0, 255, 157, 0.2)',
    borderRadius: '8px',
    margin: '8px 0',
    transition: 'all 0.3s ease',
    '&:hover': {
      background: 'rgba(16, 24, 39, 0.9)',
      borderColor: 'rgba(0, 255, 157, 0.4)',
      boxShadow: '0 0 15px rgba(0, 255, 157, 0.2)',
      transform: 'translateX(5px)',
    },
  };

  const cyberChipStyle = (color: string) => ({
    background: `rgba(${color === '#00ff9d' ? '0, 255, 157' : color === '#ff3860' ? '255, 56, 96' : color === '#00a8ff' ? '0, 168, 255' : '255, 0, 255'}, 0.2)`,
    border: `1px solid ${color}`,
    color: color,
    fontWeight: 600,
    textShadow: `0 0 5px ${color}`,
    '&:hover': {
      background: `rgba(${color === '#00ff9d' ? '0, 255, 157' : color === '#ff3860' ? '255, 56, 96' : color === '#00a8ff' ? '0, 168, 255' : '255, 0, 255'}, 0.3)`,
      boxShadow: `0 0 10px ${color}`,
    },
  });

  const neonTextStyle = {
    color: '#fff',
    textShadow: '0 0 5px rgba(255, 255, 255, 0.5)',
    fontWeight: 500,
  };

  if (!transactions.length) {
    return (
      <Box
        sx={{
          p: 4,
          textAlign: 'center',
          background: 'rgba(16, 24, 39, 0.5)',
          border: '1px solid rgba(0, 255, 157, 0.2)',
          borderRadius: '8px',
          margin: '16px 0',
        }}
      >
        <Typography
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '1.1rem',
            textShadow: '0 0 10px rgba(0, 255, 157, 0.3)',
          }}
        >
          No transactions yet
        </Typography>
        <Typography
          sx={{
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '0.9rem',
            mt: 1,
          }}
        >
          Start playing to earn Dojo Coins!
        </Typography>
      </Box>
    );
  }

  return (
    <List sx={{ p: 0 }}>
      {transactions.map((transaction, index) => (
        <React.Fragment key={transaction.id}>
          <ListItem alignItems="flex-start" sx={cyberListItemStyle}>
            <ListItemIcon sx={{ minWidth: '40px' }}>
              {getTransactionIcon(transaction.type, transaction.amount)}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                  <Typography
                    variant="subtitle1"
                    component="span"
                    sx={neonTextStyle}
                  >
                    {transaction.description || 'Transaction'}
                  </Typography>
                  <Chip
                    label={getTransactionLabel(transaction)}
                    size="small"
                    sx={cyberChipStyle(
                      getTransactionColor(transaction.type, transaction.amount)
                    )}
                  />
                </Box>
              }
              secondary={
                <React.Fragment>
                  <Typography
                    component="span"
                    variant="body2"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      display: 'block',
                      mt: 0.5,
                    }}
                  >
                    {transaction.date
                      ? formatDistanceToNow(new Date(transaction.date), {
                          addSuffix: true,
                        })
                      : 'Date unavailable'}
                  </Typography>
                  <Typography
                    component="span"
                    variant="h6"
                    sx={{
                      display: 'block',
                      fontWeight: 'bold',
                      mt: 1,
                      color: transaction.amount > 0 ? '#00ff9d' : '#ff3860',
                      textShadow: `0 0 10px ${transaction.amount > 0 ? 'rgba(0, 255, 157, 0.5)' : 'rgba(255, 56, 96, 0.5)'}`,
                      fontSize: '1.1rem',
                    }}
                  >
                    {transaction.amount > 0 ? '+' : ''}
                    {formatCurrency(
                      Math.abs(transaction.amount),
                      transaction.currency || 'DP'
                    )}
                  </Typography>
                </React.Fragment>
              }
            />
          </ListItem>
          {index < transactions.length - 1 && (
            <Divider
              sx={{
                borderColor: 'rgba(0, 255, 157, 0.2)',
                margin: '8px 0',
                opacity: 0.5,
              }}
            />
          )}
        </React.Fragment>
      ))}
    </List>
  );
};
