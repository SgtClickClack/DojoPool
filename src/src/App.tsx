import { Route, Routes } from 'react-router-dom';
import Home from './components/Pages/Home';
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
