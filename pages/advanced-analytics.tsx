import Head from 'next/head';
import React from 'react';
import { AdvancedAnalyticsDashboard } from '../src/frontend/components/analytics/AdvancedAnalyticsDashboard';
import { AdvancedVenueAnalyticsComponent } from '../src/frontend/components/analytics/AdvancedVenueAnalyticsComponent';
import { AdvancedVenueManagementDashboard } from '../src/frontend/components/analytics/AdvancedVenueManagementDashboard';

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
            <AdvancedAnalyticsDashboard />
          </div>

          {/* Venue Management Analytics */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              🏢 Venue Management Analytics
            </h2>
            <AdvancedVenueManagementDashboard />
          </div>

          {/* Venue Analytics Component */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              📈 Detailed Venue Analytics
            </h2>
            <AdvancedVenueAnalyticsComponent venueId="venue-1" />
          </div>
        </div>
      </main>
    </>
  );
};

export default AdvancedAnalyticsPage;
