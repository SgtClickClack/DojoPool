import React from 'react';
import { Routes, Route } from 'react-router-dom';

import TournamentList from '../components/tournaments/TournamentList';
import TournamentDetail from '../components/tournaments/TournamentDetail';
import TournamentForm from '../components/tournaments/TournamentForm';
import { PrivateRoute } from './PrivateRoute';

const TournamentRoutes: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<TournamentList />} />
            <Route path="/:id" element={<TournamentDetail />} />
            <Route
                path="/create"
                element={
                    <PrivateRoute adminOnly>
                        <TournamentForm />
                    </PrivateRoute>
                }
            />
            <Route
                path="/:id/edit"
                element={
                    <PrivateRoute adminOnly>
                        <TournamentForm />
                    </PrivateRoute>
                }
            />
        </Routes>
    );
};

export default TournamentRoutes; 