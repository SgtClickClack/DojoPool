import { type NextPage } from 'next';
import Head from 'next/head';
// import { AdvancedPlayerAnalyticsDashboard } from '../../../../../apps/web/src/components/analytics/AdvancedPlayerAnalyticsDashboard';

const AdvancedPlayerAnalyticsPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Advanced Player Analytics - DojoPool</title>
        <meta
          name="description"
          content="Comprehensive player analytics and performance tracking for DojoPool"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              👤 Advanced Player Analytics
            </h1>
            <p className="text-lg text-gray-600">
              Comprehensive player performance tracking, skill analysis, and
              progression insights
            </p>
          </div>

          {/* <AdvancedPlayerAnalyticsDashboard /> */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Player Analytics Dashboard
            </h2>
            <p className="text-gray-600">
              Advanced player analytics dashboard temporarily unavailable. This component will be implemented in a future update.
            </p>
          </div>
        </div>
      </main>
    </>
  );
};

export default AdvancedPlayerAnalyticsPage;
