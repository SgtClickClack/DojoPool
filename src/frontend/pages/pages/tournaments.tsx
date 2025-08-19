import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import TournamentList from '@/components/Dashboard/TournamentList';
import TournamentDetail from '@/components/Dashboard/TournamentDetail';

const TournamentsPage: React.FC = () => (
  <Router>
    <Routes>
      <Route path="/tournaments" element={<TournamentList />} />
      <Route path="/tournaments/:id" element={<TournamentDetail />} />
    </Routes>
  </Router>
);

export default TournamentsPage;
