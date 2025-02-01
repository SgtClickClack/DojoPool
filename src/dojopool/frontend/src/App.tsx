import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Home from './components/Pages/Home.tsx';
import GlobalRankings from './components/rankings/GlobalRankings';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/rankings" element={<GlobalRankings />} />
    </Routes>
  );
};

export default App;
