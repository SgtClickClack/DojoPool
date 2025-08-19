import React from 'react';
import TournamentSecurity from '../../components/security/TournamentSecurity';
import PageBackground from '../../components/common/PageBackground';

const TournamentSecurityPage: React.FC = () => {
  return (
    <PageBackground backgroundType="security">
      <TournamentSecurity />
    </PageBackground>
  );
};

export default TournamentSecurityPage;
