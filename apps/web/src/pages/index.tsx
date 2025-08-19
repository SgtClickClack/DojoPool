import {
  AppBar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Grid,
  Toolbar,
  Typography,
} from '@mui/material';
import Link from 'next/link';

const HomePage = () => {
  return (
    <Box>
      <AppBar position="static" sx={{ mb: 3 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            DojoPool
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Link href="/world-map" style={{ textDecoration: 'none' }}>
              <Button color="inherit">World Map</Button>
            </Link>
            <Link href="/tournaments" style={{ textDecoration: 'none' }}>
              <Button color="inherit">Tournaments</Button>
            </Link>
            <Link href="/clan-wars" style={{ textDecoration: 'none' }}>
              <Button color="inherit">Clan Wars</Button>
            </Link>
            <Link href="/profile" style={{ textDecoration: 'none' }}>
              <Button color="inherit">Profile</Button>
            </Link>
            <Link href="/test-components" style={{ textDecoration: 'none' }}>
              <Button color="inherit">Test</Button>
            </Link>
          </Box>
        </Toolbar>
      </AppBar>

      <Typography variant="h2" component="h1" gutterBottom align="center">
        Welcome to DojoPool
      </Typography>
      <Typography
        variant="h5"
        component="h2"
        gutterBottom
        align="center"
        color="text.secondary"
      >
        Where Pool Meets Digital Adventure
      </Typography>

      <Grid container spacing={3} sx={{ mt: 4 }}>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                World Map
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Explore nearby Dojos and challenge rivals in your area
              </Typography>
            </CardContent>
            <CardActions>
              <Link href="/world-map" style={{ textDecoration: 'none' }}>
                <Button size="small" color="primary">
                  Explore
                </Button>
              </Link>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Tournaments
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Join competitive tournaments and climb the leaderboard
              </Typography>
            </CardContent>
            <CardActions>
              <Link href="/tournaments" style={{ textDecoration: 'none' }}>
                <Button size="small" color="primary">
                  Compete
                </Button>
              </Link>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Clan Wars
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Form alliances and battle for territory control
              </Typography>
            </CardContent>
            <CardActions>
              <Link href="/clan-wars" style={{ textDecoration: 'none' }}>
                <Button size="small" color="primary">
                  Battle
                </Button>
              </Link>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Profile
              </Typography>
              <Typography variant="body2" color="text.secondary">
                View your stats, achievements, and avatar progression
              </Typography>
            </CardContent>
            <CardActions>
              <Link href="/profile" style={{ textDecoration: 'none' }}>
                <Button size="small" color="primary">
                  View
                </Button>
              </Link>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HomePage;
