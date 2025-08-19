import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Google as GoogleIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, rgba(10, 10, 10, 0.8) 0%, rgba(26, 26, 26, 0.7) 50%, rgba(10, 10, 10, 0.8) 100%), url('/images/spacetable.webp')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'radial-gradient(circle at 20% 80%, #00ff9d20 0%, transparent 50%), radial-gradient(circle at 80% 20%, #00a8ff20 0%, transparent 50%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h1"
            component="h1"
            gutterBottom
            sx={{
              fontFamily: 'Orbitron, monospace',
              fontWeight: 700,
              color: '#00ff9d',
              textShadow:
                '0 0 20px #00ff9d, 0 0 40px #00a8ff, 0 0 60px #00ff9d',
              mb: 2,
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              animation: 'glow 2s ease-in-out infinite alternate',
              '@keyframes glow': {
                '0%': { textShadow: '0 0 20px #00ff9d, 0 0 40px #00a8ff' },
                '100%': {
                  textShadow:
                    '0 0 30px #00ff9d, 0 0 50px #00a8ff, 0 0 70px #00ff9d',
                },
              },
            }}
          >
            DojoPool
          </Typography>

          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            sx={{
              fontFamily: 'Orbitron, monospace',
              color: '#00a8ff',
              textShadow: '0 0 10px #00a8ff',
              mb: 4,
              fontSize: { xs: '1.2rem', md: '1.8rem' },
            }}
          >
            Enter the Dojo
          </Typography>
        </Box>

        <Box
          sx={{
            p: 4,
            background: 'rgba(30, 30, 30, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '2px solid #00ff9d',
            borderRadius: 3,
            boxShadow: '0 0 30px #00ff9d, 0 0 50px #00a8ff',
            maxWidth: '400px',
            mx: 'auto',
          }}
        >
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                backgroundColor: 'rgba(211, 47, 47, 0.1)',
                border: '1px solid rgba(211, 47, 47, 0.3)',
                color: '#ff6b6b',
              }}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
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
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(0, 255, 157, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(0, 255, 157, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#00ff9d',
                  },
                  '& input': {
                    color: '#fff',
                  },
                  '& label': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& label.Mui-focused': {
                    color: '#00ff9d',
                  },
                },
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="password"
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(0, 255, 157, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(0, 255, 157, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#00ff9d',
                  },
                  '& input': {
                    color: '#fff',
                  },
                  '& label': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& label.Mui-focused': {
                    color: '#00ff9d',
                  },
                },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: '#00ff9d' }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mb: 2,
                py: 1.5,
                background: 'linear-gradient(45deg, #00ff9d 0%, #00a8ff 100%)',
                color: '#000',
                fontFamily: 'Orbitron, monospace',
                fontWeight: 600,
                fontSize: '1.1rem',
                borderRadius: 2,
                boxShadow: '0 0 20px #00ff9d',
                '&:hover': {
                  background:
                    'linear-gradient(45deg, #00a8ff 0%, #00ff9d 100%)',
                  boxShadow: '0 0 30px #00a8ff, 0 0 50px #00ff9d',
                  transform: 'translateY(-2px)',
                },
                '&:disabled': {
                  background: 'rgba(0, 255, 157, 0.3)',
                  color: 'rgba(255, 255, 255, 0.5)',
                },
              }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 2,
                '&::before, &::after': {
                  content: '""',
                  flex: 1,
                  height: '1px',
                  background: 'rgba(0, 255, 157, 0.3)',
                },
              }}
            >
              <Typography
                sx={{
                  px: 2,
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontFamily: 'Orbitron, monospace',
                }}
              >
                OR
              </Typography>
            </Box>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleSignIn}
              disabled={loading}
              sx={{
                mb: 3,
                py: 1.5,
                borderColor: 'rgba(0, 255, 157, 0.3)',
                color: '#00ff9d',
                fontFamily: 'Orbitron, monospace',
                fontWeight: 600,
                fontSize: '1.1rem',
                borderRadius: 2,
                '&:hover': {
                  borderColor: '#00ff9d',
                  backgroundColor: 'rgba(0, 255, 157, 0.1)',
                  boxShadow: '0 0 20px rgba(0, 255, 157, 0.3)',
                },
                '&:disabled': {
                  borderColor: 'rgba(0, 255, 157, 0.2)',
                  color: 'rgba(0, 255, 157, 0.5)',
                },
              }}
            >
              Sign in with Google
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontFamily: 'Orbitron, monospace',
                }}
              >
                Don't have an account?{' '}
                <RouterLink
                  to="/register"
                  style={{
                    color: '#00ff9d',
                    textDecoration: 'none',
                    fontWeight: 600,
                    textShadow: '0 0 5px #00ff9d',
                  }}
                >
                  Sign up
                </RouterLink>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;
