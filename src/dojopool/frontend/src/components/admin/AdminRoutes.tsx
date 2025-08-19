import React from 'react';
import { Route, Routes } from 'react-router-dom';
import WebSocketMonitor from './WebSocketMonitor';

const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Existing admin routes */}
      <Route path="/websockets" element={<WebSocketMonitor />} />
    </Routes>
  );
};

export default AdminRoutes;
