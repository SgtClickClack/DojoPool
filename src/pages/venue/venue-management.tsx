import React from 'react';
import VenueManagement from '../../components/venue/VenueManagement';
import PageBackground from '../../components/common/PageBackground';

const VenueManagementPage: React.FC = () => {
  return (
    <PageBackground backgroundType="venue">
      <VenueManagement />
    </PageBackground>
  );
};

export default VenueManagementPage; 