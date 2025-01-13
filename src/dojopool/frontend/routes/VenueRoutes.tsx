import React from 'react';
import { Routes, Route } from 'react-router-dom';

import VenueList from '../components/venues/VenueList';
import VenueDetail from '../components/venues/VenueDetail';
import PrivateRoute from './PrivateRoute';

const VenueRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<VenueList />} />
      <Route path="/:id" element={<VenueDetail />} />
    </Routes>
  );
};

export default VenueRoutes;
