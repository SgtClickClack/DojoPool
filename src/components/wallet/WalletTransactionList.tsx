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

interface Transaction {
  id: number;
  transaction_type: string;
  amount: number;
  description: string;
  created_at: string;
  metadata: {
    reward_type?: string;
    recipient_user_id?: number;
  };
}

interface WalletTransactionListProps {
  transactions: Transaction[];
}

export const WalletTransactionList: React.FC<WalletTransactionListProps> = ({ transactions }) => {
  const getTransactionIcon = (type: string, amount: number) => {
    if (type === 'REWARD') return <EmojiEvents color="primary" />;
    if (type === 'PURCHASE') return <ShoppingCart color="secondary" />;
    return amount > 0 ? <CallReceived color="success" /> : <CallMade color="error" />;
  };

  const getTransactionColor = (type: string, amount: number) => {
    if (type === 'REWARD') return 'primary';
    if (type === 'PURCHASE') return 'secondary';
    return amount > 0 ? 'success' : 'error';
  };

  const getTransactionLabel = (transaction: Transaction) => {
    if (transaction.transaction_type === 'REWARD') return 'Reward';
    if (transaction.transaction_type === 'PURCHASE') return 'Purchase';
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
              {getTransactionIcon(transaction.transaction_type, transaction.amount)}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="subtitle1" component="span">
                    {transaction.description}
                  </Typography>
                  <Chip
                    label={getTransactionLabel(transaction)}
                    size="small"
                    color={getTransactionColor(transaction.transaction_type, transaction.amount) as any}
                  />
                </Box>
              }
              secondary={
                <React.Fragment>
                  <Typography component="span" variant="body2" color="textSecondary">
                    {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
                  </Typography>
                  <Typography
                    component="span"
                    variant="body2"
                    color={transaction.amount > 0 ? 'success.main' : 'error.main'}
                    sx={{ display: 'block', fontWeight: 'bold', mt: 0.5 }}
                  >
                    {formatCurrency(Math.abs(transaction.amount), 'DP')}
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