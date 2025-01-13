import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import { Box, Button, Container, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const NotFound = () => {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
          py: 8,
        }}
      >
        <SportsEsportsIcon
          sx={{ fontSize: 80, mb: 4, color: 'primary.main' }}
          className="neon-text"
        />
        <Typography
          variant="h1"
          gutterBottom
          className="neon-text"
          sx={{
            fontSize: { xs: '4rem', md: '6rem' },
            fontWeight: 900,
            letterSpacing: '-0.05em',
            lineHeight: 1,
            mb: 2,
          }}
        >
          404
        </Typography>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            mb: 3,
            fontWeight: 600,
          }}
        >
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4, maxWidth: 'sm' }}>
          Oops! The page you&apos;re looking for seems to have taken a break from the game.
          Let&apos;s get you back to the action.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          component={RouterLink}
          to="/"
          startIcon={<SportsEsportsIcon />}
        >
          Back to Home
        </Button>
      </Box>
    </Container>
  );
};

export default NotFound;
