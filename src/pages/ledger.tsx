import {
  AccountBalanceWallet,
  SwapHoriz,
  TrendingDown,
  TrendingUp,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import React from 'react';
import { Layout } from '../components/Layout/[UI]Layout';

const LedgerPage: React.FC = () => {
  const transactions = [
    {
      id: 1,
      type: 'credit',
      amount: 150.0,
      description: 'Tournament winnings - Summer Championship',
      date: '2024-01-15',
      status: 'completed',
      color: '#00ff9d',
    },
    {
      id: 2,
      type: 'debit',
      amount: -25.0,
      description: 'Tournament entry fee',
      date: '2024-01-14',
      status: 'completed',
      color: '#ff6b6b',
    },
    {
      id: 3,
      type: 'credit',
      amount: 75.5,
      description: 'Daily rewards bonus',
      date: '2024-01-13',
      status: 'completed',
      color: '#00ff9d',
    },
    {
      id: 4,
      type: 'transfer',
      amount: 0.0,
      description: 'Wallet transfer to main account',
      date: '2024-01-12',
      status: 'completed',
      color: '#00a8ff',
    },
    {
      id: 5,
      type: 'debit',
      amount: -10.0,
      description: 'Avatar customization',
      date: '2024-01-11',
      status: 'completed',
      color: '#ff6b6b',
    },
  ];

  const stats = [
    {
      label: 'Total Balance',
      value: '$1,250.75',
      icon: AccountBalanceWallet,
      color: '#00ff9d',
    },
    {
      label: 'This Month',
      value: '+$425.50',
      icon: TrendingUp,
      color: '#00a8ff',
    },
    {
      label: 'Total Winnings',
      value: '$2,150.00',
      icon: TrendingUp,
      color: '#ffd700',
    },
    {
      label: 'Total Spent',
      value: '-$899.25',
      icon: TrendingDown,
      color: '#ff6b6b',
    },
  ];

  return (
    <Layout>
      <Box
        sx={{
          minHeight: '100vh',
          background:
            'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
          position: 'relative',
        }}
      >
        <Container
          maxWidth="lg"
          sx={{ py: 4, position: 'relative', zIndex: 1 }}
        >
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontFamily: 'Orbitron, monospace',
              fontWeight: 700,
              color: '#00ff9d',
              textShadow: '0 0 20px #00ff9d',
              mb: 2,
              textAlign: 'center',
            }}
          >
            Transaction Ledger
          </Typography>

          <Typography
            variant="h6"
            sx={{
              color: '#00a8ff',
              textAlign: 'center',
              mb: 4,
              fontFamily: 'Orbitron, monospace',
              textShadow: '0 0 10px rgba(0, 168, 255, 0.5)',
            }}
          >
            Track your DojoPool financial activity
          </Typography>

          {/* Stats Cards */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' },
              gap: 3,
              mb: 4,
            }}
          >
            {stats.map((stat, index) => (
              <Card
                key={index}
                sx={{
                  background: 'rgba(26, 26, 26, 0.9)',
                  border: `2px solid ${stat.color}`,
                  borderRadius: 3,
                  boxShadow: `0 0 20px ${stat.color}40`,
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: `0 0 30px ${stat.color}80`,
                  },
                }}
              >
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <stat.icon sx={{ fontSize: 40, color: stat.color, mb: 2 }} />
                  <Typography
                    variant="h4"
                    sx={{
                      color: stat.color,
                      fontFamily: 'Orbitron, monospace',
                      fontWeight: 700,
                      textShadow: `0 0 10px ${stat.color}40`,
                      mb: 1,
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#fff',
                      fontFamily: 'Orbitron, monospace',
                      fontWeight: 600,
                    }}
                  >
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Transaction History */}
          <Card
            sx={{
              background: 'rgba(26, 26, 26, 0.9)',
              border: '2px solid #00a8ff',
              borderRadius: 3,
              boxShadow: '0 0 30px rgba(0, 168, 255, 0.3)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h5"
                sx={{
                  color: '#00a8ff',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 600,
                  mb: 3,
                  textShadow: '0 0 10px rgba(0, 168, 255, 0.5)',
                }}
              >
                Recent Transactions
              </Typography>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#00ff9d', fontWeight: 600 }}>
                        Type
                      </TableCell>
                      <TableCell sx={{ color: '#00ff9d', fontWeight: 600 }}>
                        Description
                      </TableCell>
                      <TableCell sx={{ color: '#00ff9d', fontWeight: 600 }}>
                        Amount
                      </TableCell>
                      <TableCell sx={{ color: '#00ff9d', fontWeight: 600 }}>
                        Date
                      </TableCell>
                      <TableCell sx={{ color: '#00ff9d', fontWeight: 600 }}>
                        Status
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow
                        key={transaction.id}
                        sx={{
                          '&:hover': {
                            backgroundColor: 'rgba(0, 168, 255, 0.1)',
                          },
                        }}
                      >
                        <TableCell>
                          <Chip
                            icon={
                              transaction.type === 'credit' ? (
                                <TrendingUp />
                              ) : transaction.type === 'debit' ? (
                                <TrendingDown />
                              ) : (
                                <SwapHoriz />
                              )
                            }
                            label={transaction.type.toUpperCase()}
                            sx={{
                              backgroundColor: transaction.color,
                              color: '#000',
                              fontWeight: 600,
                              '& .MuiChip-icon': {
                                color: '#000',
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#fff' }}>
                          {transaction.description}
                        </TableCell>
                        <TableCell>
                          <Typography
                            sx={{
                              color:
                                transaction.type === 'credit'
                                  ? '#00ff9d'
                                  : transaction.type === 'debit'
                                  ? '#ff6b6b'
                                  : '#00a8ff',
                              fontWeight: 600,
                              fontFamily: 'Orbitron, monospace',
                            }}
                          >
                            {transaction.type === 'credit' ? '+' : ''}$
                            {transaction.amount.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ color: '#ccc' }}>
                          {transaction.date}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={transaction.status}
                            sx={{
                              backgroundColor: '#00ff9d',
                              color: '#000',
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </Layout>
  );
};

export default LedgerPage;
