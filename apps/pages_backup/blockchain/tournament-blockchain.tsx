import React from 'react';
import TournamentBlockchain from '../../components/blockchain/TournamentBlockchain';
import PageBackground from '../../components/common/PageBackground';

const TournamentBlockchainPage: React.FC = () => {
  return (
    <PageBackground backgroundType="blockchain">
      <TournamentBlockchain />
    </PageBackground>
  );
};

export default TournamentBlockchainPage;
