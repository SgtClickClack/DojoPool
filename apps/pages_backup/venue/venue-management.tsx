import React from 'react';
import Layout from '../../components/layout/Layout';
import PageBackground from '../../components/common/PageBackground';
import { EnhancedVenueManagementPanel } from '../../components/venue/EnhancedVenueManagementPanel';

const VenueManagementPage: React.FC = () => (
  <Layout>
    <PageBackground variant="venue">
      <EnhancedVenueManagementPanel />
    </PageBackground>
  </Layout>
);

export default VenueManagementPage;
