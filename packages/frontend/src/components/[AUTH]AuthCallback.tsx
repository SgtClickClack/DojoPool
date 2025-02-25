import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';

export const AuthCallback: React.FC = () => {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Check for auth result
        const checkAuthResult = async () => {
            try {
                // Wait for a short time to ensure Firebase has processed the redirect
                await new Promise(resolve => setTimeout(resolve, 1000));

                // If we're still on the callback page, redirect to home
                // The auth service will handle the redirect result automatically
                if (authService.isAuthenticated()) {
                    navigate('/dashboard');
                } else {
                    navigate('/login');
                }
            } catch (err) {
                setError('Authentication failed. Please try again.');
                setTimeout(() => navigate('/login'), 3000);
            }
        };

        checkAuthResult();
    }, [navigate]);

    if (error) {
        return (
            <div className="auth-callback-error">
                <p>{error}</p>
                <p>Redirecting to login...</p>
            </div>
        );
    }

    return (
        <div className="auth-callback-loading">
            <p>Completing sign in...</p>
            {/* Add your loading spinner component here */}
        </div>
    );
}; 