import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TournamentList from '@/components/tournaments/TournamentList';
import TournamentDetail from '@/components/tournaments/TournamentDetail';

const TournamentsPage: React.FC = () => (
  <Router>
    <Routes>
      <Route path="/tournaments" element={<TournamentList />} />
      <Route path="/tournaments/:id" element={<TournamentDetail />} />
    </Routes>
  </Router>
);

export default TournamentsPage;