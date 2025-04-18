import {
  Google as GoogleIcon,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "./AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signInWithGoogle, error: authError } = useAuth();
  const router = useRouter();
  const theme = useTheme();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      await signIn(email, password);
      router.push("/dashboard");
    } catch (error) {
      // Error is handled by AuthContext
      console.error("Login error:", error);
    }
  }

  async function handleGoogleLogin() {
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (error) {
      // Error is handled by AuthContext
      console.error("Google login error:", error);
    }
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
            Sign in to DojoPool
          </Typography>
          {authError && (
            <Alert
              severity="error"
              sx={{
                mt: 2,
                width: "100%",
                backgroundColor: "rgba(211, 47, 47, 0.1)",
                border: "1px solid rgba(211, 47, 47, 0.3)",
              }}
            >
              {authError}
            </Alert>
          )}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ mt: 1, width: "100%" }}
          >
            <TextField
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
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: "primary.main" }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
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
              Sign In
            </Button>
            <Divider
              sx={{
                my: 2,
                "&::before, &::after": {
                  borderColor: "rgba(0, 255, 255, 0.3)",
                },
                color: "text.secondary",
              }}
            >
              OR
            </Divider>
            <Button
              fullWidth
              variant="outlined"
              className="hover-glow"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleLogin}
              sx={{
                py: 1.5,
                fontSize: "1.1rem",
                borderColor: "rgba(0, 255, 255, 0.3)",
                "&:hover": {
                  borderColor: "primary.main",
                },
              }}
            >
              Sign in with Google
            </Button>
            <Box sx={{ mt: 3, textAlign: "center" }}>
              <Link
                href="/forgot-password"
                style={{
                  textDecoration: "none",
                  color: theme.palette.primary.main,
                }}
              >
                Forgot password?
              </Link>
            </Box>
            <Box sx={{ mt: 2, textAlign: "center", color: "text.secondary" }}>
              Don't have an account?{" "}
              <Link
                href="/signup"
                style={{
                  textDecoration: "none",
                  color: theme.palette.primary.main,
                }}
              >
                Sign Up
              </Link>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
