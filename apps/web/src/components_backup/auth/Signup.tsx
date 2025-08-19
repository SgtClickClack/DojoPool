import {
  Google as GoogleIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
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
} from '@mui/material';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');
  const { signInWithGoogle, error: authError } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError('');

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }
    if (!displayName.trim()) {
      setValidationError('Display name is required');
      return;
    }

    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Signup error:', error);
      setValidationError(
        error.message || 'Failed to create account. Please try again.'
      );
    }
  }

  async function handleGoogleSignup() {
    try {
      setValidationError('');
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Google signup error:', error);
      setValidationError(
        error.message || 'Failed to sign up with Google. Please try again.'
      );
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
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            p: 4,
            borderRadius: 2,
            background: 'rgba(30, 30, 30, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 255, 255, 0.1)',
            boxShadow: '0 0 20px rgba(0, 255, 255, 0.2)',
          }}
        >
          <Typography
            component="h1"
            variant="h4"
            className="neon-text"
            sx={{
              mb: 4,
              fontWeight: 700,
              background: 'linear-gradient(45deg, #00ffff, #ff00ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Create DojoPool Account
          </Typography>
          {(validationError || authError) && (
            <Alert
              severity="error"
              sx={{
                mt: 2,
                width: '100%',
                backgroundColor: 'rgba(211, 47, 47, 0.1)',
                border: '1px solid rgba(211, 47, 47, 0.3)',
              }}
            >
              {validationError || authError}
            </Alert>
          )}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ mt: 1, width: '100%' }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="displayName"
              label="Display Name"
              name="displayName"
              autoComplete="name"
              autoFocus
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(0, 255, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(0, 255, 255, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(0, 255, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(0, 255, 255, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
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
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: 'primary.main' }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(0, 255, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(0, 255, 255, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(0, 255, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(0, 255, 255, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
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
                fontSize: '1.1rem',
                background: 'linear-gradient(45deg, #00ffff 30%, #00ccff 90%)',
                '&:hover': {
                  background:
                    'linear-gradient(45deg, #00ccff 30%, #00ffff 90%)',
                },
              }}
            >
              Sign Up
            </Button>
            <Divider
              sx={{
                my: 2,
                '&::before, &::after': {
                  borderColor: 'rgba(0, 255, 255, 0.3)',
                },
                color: 'text.secondary',
              }}
            >
              OR
            </Divider>
            <Button
              fullWidth
              variant="outlined"
              className="hover-glow"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleSignup}
              sx={{
                py: 1.5,
                fontSize: '1.1rem',
                borderColor: 'rgba(0, 255, 255, 0.3)',
                color: 'white',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'rgba(0, 255, 255, 0.1)',
                },
              }}
            >
              Sign up with Google
            </Button>
            <Box sx={{ mt: 3, textAlign: 'center', color: 'text.secondary' }}>
              Already have an account?{' '}
              <Link
                to="/login"
                style={{
                  textDecoration: 'none',
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
};

export default Signup;
