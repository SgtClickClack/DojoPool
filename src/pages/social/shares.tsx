import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Pagination,
  CircularProgress,
  Alert
} from '@mui/material';
import { ShareCard } from '../../components/social/ShareCard';
import { Share, ShareType } from '../../types/share';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`share-tabpanel-${index}`}
      aria-labelledby={`share-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function SharesPage() {
  const router = useRouter();
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tabValue, setTabValue] = useState(0);

  const fetchShares = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/social/share?page=${page}&per_page=10`);
      if (!response.ok) {
        throw new Error('Failed to fetch shares');
      }
      const data = await response.json();
      setShares(data.shares);
      setTotalPages(data.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShares();
  }, [page]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(1);
  };

  const handleDeleteShare = async (shareId: number) => {
    try {
      const response = await fetch(`/api/social/share?share_id=${shareId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete share');
      }
      setShares(shares.filter(share => share.id !== shareId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete share');
    }
  };

  const contentTypes: ShareType[] = ['game', 'tournament', 'achievement', 'profile', 'shot', 'venue'];

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Shared Content
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="All" />
            {contentTypes.map((type, index) => (
              <Tab key={type} label={type.charAt(0).toUpperCase() + type.slice(1)} value={index + 1} />
            ))}
          </Tabs>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {contentTypes.map((type, index) => (
              <TabPanel key={type} value={tabValue} index={index + 1}>
                {shares
                  .filter(share => share.content_type === type)
                  .map(share => (
                    <ShareCard
                      key={share.id}
                      share={share}
                      onDelete={handleDeleteShare}
                    />
                  ))}
              </TabPanel>
            ))}

            <TabPanel value={tabValue} index={0}>
              {shares.map(share => (
                <ShareCard
                  key={share.id}
                  share={share}
                  onDelete={handleDeleteShare}
                />
              ))}
            </TabPanel>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          </>
        )}
      </Box>
    </Container>
  );
} 