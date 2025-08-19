import { type NextPage } from 'next';
import Head from 'next/head';
// import { AdvancedVenueManagementDashboard } from '../../../../../apps/web/src/components/analytics/AdvancedVenueManagementDashboard';

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
          {/* <AdvancedVenueManagementDashboard /> */}
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              🏢 Advanced Venue Management
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Comprehensive venue management and analytics system for DojoPool
              venues
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Venue Management Dashboard
              </h2>
              <p className="text-gray-600">
                Advanced venue management dashboard temporarily unavailable.
                This component will be implemented in a future update.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdvancedVenueManagementPage;
