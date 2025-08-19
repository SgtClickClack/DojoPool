import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import TournamentDetail from '@/components/Dashboard/TournamentDetail';
import TournamentList from '@/components/Dashboard/TournamentList';

const TournamentsPage: React.FC = () => (
  <Router>
    <Routes>
      <Route path="/tournaments" element={<TournamentList />} />
      <Route path="/tournaments/:id" element={<TournamentDetail />} />
    </Routes>
  </Router>
);

export default TournamentsPage;
