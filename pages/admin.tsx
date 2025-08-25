import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import { ProtectedAdminRoute } from '../src/frontend/components/admin/ProtectedAdminRoute';
import { AdminDashboard } from '../src/frontend/components/admin/AdminDashboard';
import { UserManagementTable } from '../src/frontend/components/admin/UserManagementTable';

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
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <ProtectedAdminRoute>
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
        <Box sx={{ maxWidth: '7xl', mx: 'auto', py: 6, px: { sm: 6, lg: 8 } }}>
          {/* Header */}
          <Box sx={{ px: { xs: 4, sm: 0 }, py: 6 }}>
            <Typography
              variant="h3"
              component="h1"
              fontWeight="bold"
              sx={{ mb: 2 }}
            >
              Admin Panel
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage platform statistics and user accounts
            </Typography>
          </Box>

          {/* Navigation Tabs */}
          <Box sx={{ px: { xs: 4, sm: 0 } }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                aria-label="Admin panel tabs"
              >
                <Tab label="Dashboard" />
                <Tab label="User Management" />
              </Tabs>
            </Box>
          </Box>

          {/* Content */}
          <Box sx={{ px: { xs: 4, sm: 0 } }}>
            <TabPanel value={activeTab} index={0}>
              <AdminDashboard />
            </TabPanel>
            <TabPanel value={activeTab} index={1}>
              <UserManagementTable />
            </TabPanel>
          </Box>
        </Box>
      </Box>
    </ProtectedAdminRoute>
  );
};

export default AdminPage;
