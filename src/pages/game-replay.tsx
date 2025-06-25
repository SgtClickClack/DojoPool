import React from 'react';
import Layout from '../components/layout/Layout';
import AdvancedGameReplay from '../components/game/AdvancedGameReplay';

const GameReplayPage: React.FC = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Game Replay System
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Advanced game replay system with AI-powered analysis, highlight detection, and comprehensive playback controls.
            </p>
          </div>
          
          <AdvancedGameReplay />
        </div>
      </div>
    </Layout>
  );
};

export default GameReplayPage; 