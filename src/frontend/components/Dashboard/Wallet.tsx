import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import axiosInstance from "../../api/axiosInstance";

interface Transaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  timestamp: string;
}

interface WalletStats {
  balance: number;
  totalTransactions: number;
  totalVolume: number;
  totalIncoming: number;
  totalOutgoing: number;
  rewards: number;
  transactions: Transaction[];
}

const Wallet: React.FC = () => {
  const { user } = useAuth();
  const [walletStats, setWalletStats] = useState<WalletStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    const fetchWalletStats = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/wallet/stats");
        setWalletStats(response.data);
        setError(null);
      } catch (err: any) {
        if (err?.response?.data?.error === "Wallet not found") {
          setError("No wallet found for this user. Please create a wallet.");
        } else {
          setError("Failed to load wallet stats. Please try again later.");
        }
        console.error("Error fetching wallet stats:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchWalletStats();
    }
  }, [user]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferLoading(true);
    setTransferError(null);
    setTransferSuccess(null);
    try {
      await axiosInstance.post("/wallet/transfer", {
        recipient,
        amount: Number(amount),
      });
      setTransferSuccess("Transfer successful.");
      setRecipient("");
      setAmount("");
      // Refresh stats
      const response = await axiosInstance.get("/wallet/stats");
      setWalletStats(response.data);
    } catch (err: any) {
      setTransferError(err?.response?.data?.error || "Transfer failed.");
    } finally {
      setTransferLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Dojo Coins Wallet
      </Typography>
      
      {/* Balance Display */}
      <Box sx={{ mb: 2, textAlign: "center" }}>
        <Typography variant="h4" color="primary">
          {walletStats?.balance.toLocaleString() || 0}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Dojo Coins
        </Typography>
      </Box>

      {/* Stats */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2">Total Transactions: {walletStats?.totalTransactions}</Typography>
        <Typography variant="body2">Total Volume: {walletStats?.totalVolume}</Typography>
        <Typography variant="body2">Total Incoming: {walletStats?.totalIncoming}</Typography>
        <Typography variant="body2">Total Outgoing: {walletStats?.totalOutgoing}</Typography>
        <Typography variant="body2">Rewards: {walletStats?.rewards}</Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Transfer Form */}
      <Box component="form" onSubmit={handleTransfer} sx={{ mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>Send Coins</Typography>
        <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
          <input
            type="text"
            placeholder="Recipient Username or Email"
            value={recipient}
            onChange={e => setRecipient(e.target.value)}
            required
            style={{ flex: 2, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
          />
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
            min={1}
            style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
          />
          <Button type="submit" variant="contained" color="primary" disabled={transferLoading}>
            Send
          </Button>
        </Box>
        {transferError && <Alert severity="error">{transferError}</Alert>}
        {transferSuccess && <Alert severity="success">{transferSuccess}</Alert>}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Transaction History */}
      <Typography variant="subtitle1" gutterBottom>
        Recent Transactions
      </Typography>
      <List>
        {walletStats?.transactions.map((transaction) => (
          <React.Fragment key={transaction.id}>
            <ListItem>
              <ListItemText
                primary={transaction.description}
                secondary={new Date(transaction.timestamp).toLocaleString()}
              />
              <Typography
                variant="body1"
                color={transaction.type === "credit" ? "success.main" : "error.main"}
              >
                {transaction.type === "credit" ? "+" : "-"}
                {transaction.amount.toLocaleString()}
              </Typography>
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>

      {/* Action Buttons */}
      <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
        <Button variant="contained" color="primary" fullWidth>
          Add Coins
        </Button>
        <Button variant="outlined" color="primary" fullWidth>
          Transaction History
        </Button>
      </Box>
    </Paper>
  );
};

export default Wallet; 