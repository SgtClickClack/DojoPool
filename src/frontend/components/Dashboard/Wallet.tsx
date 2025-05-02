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

interface WalletData {
  balance: number;
  transactions: Transaction[];
}

const Wallet: React.FC = () => {
  const { user } = useAuth();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/api/wallet");
        setWalletData(response.data);
        setError(null);
      } catch (err) {
        setError("Failed to load wallet data. Please try again later.");
        console.error("Error fetching wallet data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchWalletData();
    }
  }, [user]);

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
      <Box sx={{ mb: 3, textAlign: "center" }}>
        <Typography variant="h4" color="primary">
          {walletData?.balance.toLocaleString() || 0}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Dojo Coins
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Transaction History */}
      <Typography variant="subtitle1" gutterBottom>
        Recent Transactions
      </Typography>
      <List>
        {walletData?.transactions.map((transaction) => (
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