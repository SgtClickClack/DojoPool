import React from 'react';
import Head from 'next/head';
import AdvancedSocialCommunityDashboard from '../src/components/social/AdvancedSocialCommunityDashboard';

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
        <AdvancedSocialCommunityDashboard />
      </main>
    </>
  );
};

export default AdvancedSocialCommunityPage;
