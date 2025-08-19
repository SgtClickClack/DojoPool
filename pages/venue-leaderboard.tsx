import { NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import { Layout } from '../src/frontend/components/common/Layout';
import { VenueLeaderboardDashboard } from '../src/frontend/components/venue/VenueLeaderboardDashboard';

const VenueLeaderboardPage: NextPage = () => {
  const [selectedVenueId, setSelectedVenueId] = useState<string | undefined>();

  return (
    <>
      <Head>
        <title>Venue Leaderboard - DojoPool</title>
        <meta
          name="description"
          content="Track venue performance and Dojo Masters across the DojoPool network"
        />
      </Head>

      <Layout>
        <div className="container mx-auto px-4 py-8">
          <VenueLeaderboardDashboard
            selectedVenueId={selectedVenueId}
            onVenueSelect={setSelectedVenueId}
          />
        </div>
      </Layout>
    </>
  );
};

export default VenueLeaderboardPage;
