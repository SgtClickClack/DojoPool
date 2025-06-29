import React from 'react';
import { Box } from '@mui/material';
import Layout from '../../components/layout/Layout';
import EquipmentManagement from '../../components/venue/EquipmentManagement';

const EquipmentManagementPage: React.FC = () => {
  return (
    <Layout>
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}>
        <EquipmentManagement />
      </Box>
    </Layout>
  );
};

export default EquipmentManagementPage; 