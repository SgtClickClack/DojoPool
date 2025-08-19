import React from 'react';
import { Route, Routes } from 'react-router-dom';

import VenueDetail from '../components/venues/[VENUE]VenueDetail';
import VenueList from '../components/venues/[VENUE]VenueList';

const VenueRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<VenueList />} />
      <Route path="/:id" element={<VenueDetail />} />
    </Routes>
  );
};

export default VenueRoutes;
