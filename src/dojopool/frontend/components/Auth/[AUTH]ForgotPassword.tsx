import React, { useState } from "react";
import { Box, TextField, Button, Typography, Paper, Link } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // TODO: Implement password reset API call
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Failed to send reset email");
      }

      setSubmitted(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      <Paper sx={{ p: 4, maxWidth: 400, width: "100%" }}>
        <Typography variant="h5" gutterBottom align="center">
          Reset Password
        </Typography>
        {!submitted ? (
          <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="body2" sx={{ mb: 3 }}>
              Enter your email address and we'll send you instructions to reset
              your password.
            </Typography>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
            />
            {error && (
              <Typography color="error" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}
            <Button fullWidth type="submit" variant="contained" sx={{ mt: 3 }}>
              Send Reset Link
            </Button>
          </Box>
        ) : (
          <Box>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Check your email for instructions to reset your password.
            </Typography>
          </Box>
        )}
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Link component={RouterLink} to="/login">
            Back to Sign In
          </Link>
        </Box>
      </Paper>
    </Box>
  );
};
