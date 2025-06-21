import React from 'react';
import TournamentStreaming from '../../components/streaming/TournamentStreaming';
import PageBackground from '../../components/common/PageBackground';

const TournamentStreamingPage: React.FC = () => {
  return (
    <PageBackground backgroundType="streaming">
      <TournamentStreaming />
    </PageBackground>
  );
};

export default TournamentStreamingPage; 