import React from 'react';
import Layout from '../src/components/Layout/[UI]Layout';
import TournamentList from '../src/components/tournament/TournamentList';

const TournamentsPage: React.FC = () => {
  return (
    <Layout>
      <TournamentList />
    </Layout>
  );
};

export default TournamentsPage;
