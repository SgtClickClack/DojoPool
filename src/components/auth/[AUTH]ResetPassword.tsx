import {
  Alert,
  Box,
  Button,
  Container,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { sendPasswordResetEmail } from "firebase/auth";
import React, { useState } from "react";
import Link from "next/link";
import { auth } from "../../config/firebase";
import { analyticsService } from "../../services/analytics";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setMessage("");
      setError("");
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      setMessage("Check your inbox for further instructions");
      analyticsService.trackEvent("password_reset_requested", { email });
    } catch (error: any) {
      setError(error.message || "Failed to reset password");
      analyticsService.trackEvent("password_reset_error", {
        error: error.message,
      });
    }

    setLoading(false);
  }

  return (
    <Box
      className="cyber-gradient"
      minHeight="100vh"
      display="flex"
      alignItems="center"
    >
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            p: 4,
            borderRadius: 2,
            background: "rgba(30, 30, 30, 0.8)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(0, 255, 255, 0.1)",
            boxShadow: "0 0 20px rgba(0, 255, 255, 0.2)",
          }}
        >
          <Typography
            component="h1"
            variant="h4"
            className="neon-text"
            sx={{
              mb: 4,
              fontWeight: 700,
              background: "linear-gradient(45deg, #00ffff, #ff00ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Reset Password
          </Typography>
          {error && (
            <Alert
              severity="error"
              sx={{
                mt: 2,
                width: "100%",
                backgroundColor: "rgba(211, 47, 47, 0.1)",
                border: "1px solid rgba(211, 47, 47, 0.3)",
              }}
            >
              {error}
            </Alert>
          )}
          {message && (
            <Alert
              severity="success"
              sx={{
                mt: 2,
                width: "100%",
                backgroundColor: "rgba(46, 125, 50, 0.1)",
                border: "1px solid rgba(46, 125, 50, 0.3)",
              }}
            >
              {message}
            </Alert>
          )}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ mt: 1, width: "100%" }}
          >
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "rgba(0, 255, 255, 0.3)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(0, 255, 255, 0.5)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "primary.main",
                  },
                },
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              className="hover-glow"
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                fontSize: "1.1rem",
                background: "linear-gradient(45deg, #00ffff 30%, #00ccff 90%)",
                "&:hover": {
                  background:
                    "linear-gradient(45deg, #00ccff 30%, #00ffff 90%)",
                },
              }}
            >
              Reset Password
            </Button>
            <Box sx={{ mt: 2, textAlign: "center", color: "text.secondary" }}>
              Remember your password?{" "}
              <Link
                href="/login"
                style={{
                  textDecoration: "none",
                  color: theme.palette.primary.main,
                }}
              >
                Sign In
              </Link>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
