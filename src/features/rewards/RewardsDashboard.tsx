import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, CircularProgress, Alert, List, ListItem, Button, Divider } from "@mui/material";

interface Reward {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  tier?: { id: string; name: string };
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  date: string;
  description?: string;
}

interface RewardsDashboardProps {}

const RewardsDashboard: React.FC<RewardsDashboardProps> = () => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch("/api/rewards/available").then((res) => res.json()),
      fetch("/api/wallet/balance").then((res) => res.json()),
      fetch("/api/wallet/transactions").then((res) => res.json()),
    ])
      .then(([rewardsData, balanceData, transactionsData]) => {
        setRewards(rewardsData);
        setBalance(balanceData.balance);
        setTransactions(transactionsData);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load rewards or wallet data");
        setLoading(false);
      });
  }, []);

  const handleClaim = (rewardId: string) => {
    setClaiming(rewardId);
    setClaimError(null);
    fetch(`/api/rewards/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rewardId }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to claim reward");
        return res.json();
      })
      .then(() => {
        // Refresh rewards and wallet after claim
        return Promise.all([
          fetch("/api/rewards/available").then((res) => res.json()),
          fetch("/api/wallet/balance").then((res) => res.json()),
          fetch("/api/wallet/transactions").then((res) => res.json()),
        ]);
      })
      .then(([rewardsData, balanceData, transactionsData]) => {
        setRewards(rewardsData);
        setBalance(balanceData.balance);
        setTransactions(transactionsData);
        setClaiming(null);
      })
      .catch((err) => {
        setClaimError(err.message);
        setClaiming(null);
      });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <Typography variant="h5" gutterBottom>Rewards Dashboard</Typography>
      <Typography variant="h6">Wallet Balance</Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>{balance !== null ? `${balance} Dojo Coins` : "-"}</Typography>
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6">Available Rewards</Typography>
      {claimError && <Alert severity="error" sx={{ mb: 2 }}>{claimError}</Alert>}
      <List dense>
        {rewards.length === 0 && <ListItem>No rewards available.</ListItem>}
        {rewards.map((reward) => (
          <ListItem key={reward.id} sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <Typography variant="subtitle2">{reward.name}</Typography>
            <Typography variant="body2">{reward.description}</Typography>
            <Typography variant="body2">Cost: {reward.points_cost} points</Typography>
            {reward.tier && <Typography variant="body2">Tier: {reward.tier.name}</Typography>}
            <Button
              variant="contained"
              color="primary"
              size="small"
              sx={{ mt: 1 }}
              disabled={claiming === reward.id}
              onClick={() => handleClaim(reward.id)}
            >
              {claiming === reward.id ? "Claiming..." : "Claim"}
            </Button>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6">Transaction History</Typography>
      <List dense>
        {transactions.length === 0 && <ListItem>No transactions.</ListItem>}
        {transactions.map((tx) => (
          <ListItem key={tx.id}>
            <Typography variant="body2">
              [{new Date(tx.date).toLocaleString()}] {tx.type}: {tx.amount} Dojo Coins {tx.description ? `- ${tx.description}` : ""}
            </Typography>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default RewardsDashboard; 