import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Chip,
  Box,
  Divider
} from '@mui/material';
import {
  CallReceived,
  CallMade,
  EmojiEvents,
  ShoppingCart
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/format';
import { formatDistanceToNow } from 'date-fns';
import { Transaction } from '../../types/wallet';

interface WalletTransactionListProps {
  transactions: Transaction[];
}

export const WalletTransactionList: React.FC<WalletTransactionListProps> = ({ transactions }) => {
  const getTransactionIcon = (type: string | undefined, amount: number) => {
    const upperType = type?.toUpperCase();
    if (upperType === 'REWARD') return <EmojiEvents color="primary" />;
    if (upperType === 'PURCHASE') return <ShoppingCart color="secondary" />;
    return amount > 0 ? <CallReceived color="success" /> : <CallMade color="error" />;
  };

  const getTransactionColor = (type: string | undefined, amount: number) => {
    const upperType = type?.toUpperCase();
    if (upperType === 'REWARD') return 'primary';
    if (upperType === 'PURCHASE') return 'secondary';
    return amount > 0 ? 'success' : 'error';
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

  if (!transactions.length) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="textSecondary">No transactions yet</Typography>
      </Box>
    );
  }

  return (
    <List>
      {transactions.map((transaction, index) => (
        <React.Fragment key={transaction.id}>
          <ListItem alignItems="flex-start">
            <ListItemIcon>
              {getTransactionIcon(transaction.type, transaction.amount)}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="subtitle1" component="span">
                    {transaction.description || 'Transaction'}
                  </Typography>
                  <Chip
                    label={getTransactionLabel(transaction)}
                    size="small"
                    color={getTransactionColor(transaction.type, transaction.amount) as any}
                  />
                </Box>
              }
              secondary={
                <React.Fragment>
                  <Typography component="span" variant="body2" color="textSecondary">
                    {transaction.created_at ? formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true }) : 'Date unavailable'}
                  </Typography>
                  <Typography
                    component="span"
                    variant="body2"
                    color={transaction.amount > 0 ? 'success.main' : 'error.main'}
                    sx={{ display: 'block', fontWeight: 'bold', mt: 0.5 }}
                  >
                    {formatCurrency(Math.abs(transaction.amount), transaction.currency || 'DP')}
                  </Typography>
                </React.Fragment>
              }
            />
          </ListItem>
          {index < transactions.length - 1 && <Divider variant="inset" component="li" />}
        </React.Fragment>
      ))}
    </List>
  );
}; 