import { AppBarProps, AppBar as MuiAppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import React from 'react';
import Link from 'next/link';

/**
 * DojoPoolAppBar - The main application bar for the DojoPool frontend.
 * Handles navigation and branding for the app.
 *
 * @component
 * @returns {JSX.Element}
 */
const DojoPoolAppBar: React.FC<AppBarProps> = (props) => {
  return (
    <MuiAppBar {...props}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            DojoPool
          </Link>
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
        </Box>
      </Toolbar>
    </MuiAppBar>
  );
};

export default DojoPoolAppBar;
