import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import WorldHub from '../components/world/WorldHub';
import ClanTestPage from '../pages/clan-test';
import ClansPage from '../pages/clans';
import ClanProfilePage from '../pages/clans/[clanId]';
import CreateClanPage from '../pages/clans/create';
import FeedPage from '../dojopool/frontend/pages/feed';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<WorldHub />} />
      <Route path="/clans" element={<ClansPage />} />
      <Route path="/clans/create" element={<CreateClanPage />} />
      <Route path="/clans/:clanId" element={<ClanProfilePage />} />
      <Route path="/clan-test" element={<ClanTestPage />} />
      <Route path="/feed" element={<FeedPage />} />
      <Route path="*" element={<Navigate to="/clan-test" replace />} />
    </Routes>
  );
};

export default App;
