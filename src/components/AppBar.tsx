import { AppBarProps, AppBar as MuiAppBar } from '@mui/material';
import React from 'react';

/**
 * DojoPoolAppBar - The main application bar for the DojoPool frontend.
 * Handles navigation and branding for the app.
 *
 * @component
 * @returns {JSX.Element}
 */
const DojoPoolAppBar: React.FC<AppBarProps> = (props) => {
  return <MuiAppBar {...props} />;
};

export default DojoPoolAppBar;
