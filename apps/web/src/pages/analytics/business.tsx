import { BusinessAnalyticsDashboard } from '@/components/Analytics/BusinessAnalyticsDashboard';
import { OnboardingGuard } from '@/components/Common/OnboardingGuard';
import { useAuth } from '@/hooks/useAuth';
import React from 'react';

const BusinessAnalyticsPage: React.FC = () => {
  const { isAdmin } = useAuth();

  // Only allow admin users to access business analytics
  if (!isAdmin) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          fontSize: '18px',
        }}
      >
        <h2>Access Denied</h2>
        <p>You need administrator privileges to view this page.</p>
      </div>
    );
  }

  return (
    <OnboardingGuard>
      <BusinessAnalyticsDashboard />
    </OnboardingGuard>
  );
};

export default BusinessAnalyticsPage;
