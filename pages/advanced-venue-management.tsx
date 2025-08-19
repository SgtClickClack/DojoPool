import { NextPage } from 'next';
import Head from 'next/head';
import { AdvancedVenueManagementDashboard } from '../src/components/analytics/AdvancedVenueManagementDashboard';

const AdvancedVenueManagementPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Advanced Venue Management & Analytics - DojoPool</title>
        <meta
          name="description"
          content="Comprehensive venue management and analytics system for DojoPool venues"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <AdvancedVenueManagementDashboard />
        </div>
      </div>
    </>
  );
};

export default AdvancedVenueManagementPage;
