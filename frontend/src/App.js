import React, { Suspense, lazy } from 'react';
const Leaderboard = lazy(() => import('./components/Leaderboard'));

function App() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Leaderboard />
        </Suspense>
    );
}

export default App; 