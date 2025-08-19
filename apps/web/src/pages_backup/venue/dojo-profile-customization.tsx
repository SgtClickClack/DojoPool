import React from 'react';
import DojoProfileCustomization from '../../components/venue/DojoProfileCustomization';
import PageBackground from '../../components/common/PageBackground';

const DojoProfileCustomizationPage: React.FC = () => {
  return (
    <PageBackground variant="venue">
      <DojoProfileCustomization />
    </PageBackground>
  );
};

export default DojoProfileCustomizationPage;
