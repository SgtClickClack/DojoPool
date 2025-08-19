import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import { Box, Button, Container, Typography } from '@mui/material';
import Link from 'next/link';

export default function NotFound() {
  return (
    <Box
      className="cyber-gradient"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'radial-gradient(circle at center, rgba(0, 255, 255, 0.1) 0%, rgba(255, 0, 255, 0.1) 100%)',
          zIndex: 0,
        },
      }}
    >
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            textAlign: 'center',
            p: 4,
            borderRadius: 2,
            background: 'rgba(30, 30, 30, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 255, 255, 0.1)',
            boxShadow: '0 0 20px rgba(0, 255, 255, 0.2)',
          }}
        >
          <Typography
            variant="h1"
            className="neon-text"
            sx={{
              fontSize: { xs: '6rem', sm: '8rem' },
              fontWeight: 700,
              mb: 2,
              background: 'linear-gradient(45deg, #00ffff, #ff00ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            404
          </Typography>
          <Typography
            variant="h4"
            className="neon-text"
            sx={{
              mb: 2,
              color: 'primary.main',
            }}
          >
            Page Not Found
          </Typography>
          <Typography
            color="text.secondary"
            sx={{
              mb: 4,
              fontSize: '1.1rem',
            }}
          >
            The page you're looking for has glitched out of existence.
          </Typography>
          <Link href="/" passHref style={{ textDecoration: 'none' }}>
            <Button
              variant="contained"
              size="large"
              className="hover-glow"
              startIcon={<SportsEsportsIcon />}
              sx={{
                fontSize: '1.1rem',
                py: 1.5,
                px: 4,
                background: 'linear-gradient(45deg, #00ffff 30%, #00ccff 90%)',
                '&:hover': {
                  background:
                    'linear-gradient(45deg, #00ccff 30%, #00ffff 90%)',
                },
              }}
            >
              Return to Base
            </Button>
          </Link>
        </Box>
      </Container>
    </Box>
  );
}
