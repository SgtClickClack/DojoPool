import { useRouter } from 'next/router';
import React from 'react';
import Layout from '../../src/components/Layout/[UI]Layout';
import TournamentDetails from '../../src/components/tournament/TournamentDetails';

const TournamentDetailsPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  const handleBack = () => {
    router.push('/tournaments');
  };

  if (!id || typeof id !== 'string') {
    return (
      <Layout>
        <div className="tournament-details-error">
          <h3>Invalid Tournament</h3>
          <p>Tournament ID is required.</p>
          <button onClick={handleBack} className="back-btn">
            Back to Tournaments
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <TournamentDetails tournamentId={id} onBack={handleBack} />
    </Layout>
  );
};

export default TournamentDetailsPage;
