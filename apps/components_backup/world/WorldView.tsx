import React, { useState } from 'react';
import DojoInterior from '../dojo/DojoInterior';
import WorldHubMap from './WorldHubMap';

type ViewMode = 'map' | 'dojo';

const WorldView: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewMode>('map');
  const [selectedDojoId, setSelectedDojoId] = useState<string | null>(null);

  const handleEnterDojo = (dojoId: string) => {
    setSelectedDojoId(dojoId);
    setActiveView('dojo');
  };

  const handleExitDojo = () => {
    setSelectedDojoId(null);
    setActiveView('map');
  };

  return (
    <div className="world-view">
      {activeView === 'map' ? (
        <WorldHubMap onEnterDojo={handleEnterDojo} />
      ) : (
        <DojoInterior dojoId={selectedDojoId!} onExit={handleExitDojo} />
      )}
    </div>
  );
};

export default WorldView;
