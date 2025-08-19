import Head from 'next/head';
import React from 'react';
// import { AdvancedAnalyticsDashboard } from '../../../../../apps/web/src/components/analytics/AdvancedAnalyticsDashboard';
// import { AdvancedVenueAnalyticsComponent } from '../../../../../apps/web/src/components/analytics/AdvancedVenueAnalyticsComponent';
// import { AdvancedVenueManagementDashboard } from '../../../../../apps/web/src/components/analytics/AdvancedVenueManagementDashboard';

const AdvancedAnalyticsPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Advanced Analytics Dashboard - DojoPool</title>
        <meta
          name="description"
          content="Comprehensive analytics and insights for DojoPool platform"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              📊 Advanced Analytics Dashboard
            </h1>
            <p className="text-lg text-gray-600">
              Comprehensive analytics, insights, and performance optimization
              for the DojoPool platform
            </p>
          </div>

          {/* Main Analytics Dashboard */}
          <div className="mb-8">
            {/* <AdvancedAnalyticsDashboard /> */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Analytics Dashboard
              </h2>
              <p className="text-gray-600">
                Advanced analytics dashboard temporarily unavailable. This component will be implemented in a future update.
              </p>
            </div>
          </div>

          {/* Venue Management Analytics */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              🏢 Venue Management Analytics
            </h2>
            {/* <AdvancedVenueManagementDashboard /> */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Venue Management Analytics
              </h3>
              <p className="text-gray-600">
                Venue management analytics temporarily unavailable. This component will be implemented in a future update.
              </p>
            </div>
          </div>

          {/* Venue Analytics Component */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              📈 Detailed Venue Analytics
            </h2>
            {/* <AdvancedVenueAnalyticsComponent venueId="venue-1" /> */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Detailed Venue Analytics
              </h3>
              <p className="text-gray-600">
                Detailed venue analytics temporarily unavailable. This component will be implemented in a future update.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default AdvancedAnalyticsPage;
