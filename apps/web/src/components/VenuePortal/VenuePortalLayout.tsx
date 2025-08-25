import { Box, Container, Tab, Tabs, Typography } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';

interface VenuePortalLayoutProps {
  children: React.ReactNode;
}

const tabs = [
  { label: 'Profile', href: '/venue/portal/profile' },
  { label: 'Specials', href: '/venue/portal/specials' },
  { label: 'Tournaments', href: '/venue/portal/tournaments' },
];

const VenuePortalLayout: React.FC<VenuePortalLayoutProps> = ({ children }) => {
  const router = useRouter();
  const currentIndex = Math.max(
    0,
    tabs.findIndex((t) => router.pathname.startsWith(t.href))
  );

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h4" component="h1">
          Venue Portal
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}>
        <Tabs value={currentIndex} aria-label="venue portal tabs">
          {tabs.map((tab) => (
            <Tab
              key={tab.href}
              label={tab.label}
              component={Link}
              href={tab.href}
            />
          ))}
        </Tabs>
      </Box>

      <Box sx={{ mt: 3 }}>{children}</Box>
    </Container>
  );
};

export default VenuePortalLayout;
