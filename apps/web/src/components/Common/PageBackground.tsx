import type { BoxProps } from '@mui/material';
import { Box } from '@mui/material';
import React from 'react';

interface PageBackgroundProps extends Omit<BoxProps, 'children'> {
  children: React.ReactNode;
  variant?:
    | 'ai'
    | 'ledger'
    | 'map'
    | 'tournaments'
    | 'referee'
    | 'profile'
    | 'analytics'
    | 'avatar'
    | 'social'
    | 'venue'
    | 'streaming'
    | string;
}

const backgroundByVariant: Record<string, string> = {
  ai: '#0f172a',
  ledger: '#0a0a0a',
  map: '#0b1020',
  tournaments: '#0d1326',
  referee: '#0b1224',
  profile: '#101828',
  analytics: '#0b1020',
  avatar: '#111827',
  social: '#0e1726',
  venue: '#0e1424',
  streaming: '#0b0f1f',
};

const PageBackground: React.FC<PageBackgroundProps> = ({
  children,
  variant,
  sx,
  ...rest
}) => {
  const bg = (variant && backgroundByVariant[variant]) || '#f5f5f5';
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: bg, ...sx }} {...rest}>
      {children}
    </Box>
  );
};

export default PageBackground;
