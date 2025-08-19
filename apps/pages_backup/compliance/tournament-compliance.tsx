import React from 'react';
import PageBackground from '../../components/common/PageBackground';
import TournamentCompliance from '../../components/compliance/TournamentCompliance';

const TournamentCompliancePage: React.FC = () => (
  <PageBackground variant="compliance">
    <TournamentCompliance />
  </PageBackground>
);

export default TournamentCompliancePage;
