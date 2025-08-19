import Head from 'next/head';
import React from 'react';
// import AdvancedSocialCommunityDashboard from '../../../../../apps/web/src/components/social/AdvancedSocialCommunityDashboard';

const AdvancedSocialCommunityPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Advanced Social Community & Engagement - DojoPool</title>
        <meta
          name="description"
          content="Advanced social networking, community management, and engagement tracking for DojoPool"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* <AdvancedSocialCommunityDashboard /> */}
        <div className="max-w-7xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              👥 Advanced Social Community
            </h1>
            <p className="text-lg text-gray-600">
              Advanced social networking, community management, and engagement
              tracking
            </p>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Social Community Dashboard
            </h2>
            <p className="text-gray-600">
              Advanced social community dashboard temporarily unavailable. This
              component will be implemented in a future update.
            </p>
          </div>
        </div>
      </main>
    </>
  );
};

export default AdvancedSocialCommunityPage;
