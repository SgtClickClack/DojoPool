import React from 'react';
import TournamentList from '../components/TournamentList'; // Adjust path if needed
// import Layout from '../components/Layout'; // Assuming a Layout component exists

const TournamentsPage: React.FC = () => {
  return (
    // <Layout>
      <div>
        <h1>Tournaments</h1>
        <p>Browse upcoming and active tournaments.</p>
        <TournamentList />
      </div>
    // </Layout>
  );
};

export default TournamentsPage; 