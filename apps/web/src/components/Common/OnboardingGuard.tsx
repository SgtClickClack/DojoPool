import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

/**
 * Route guard that ensures users complete onboarding before accessing the main app
 */
export const OnboardingGuard: React.FC<OnboardingGuardProps> = ({
  children,
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Redirect to login if not authenticated
        router.push('/login');
      } else {
        // Check if user has completed onboarding
        const onboardingCompleted = localStorage.getItem(
          'onboarding_completed'
        );
        if (onboardingCompleted !== 'true') {
          // Redirect to onboarding if not completed
          router.push('/onboarding');
        }
      }
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication and onboarding status
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '18px',
        }}
      >
        Loading...
      </div>
    );
  }

  // Don't render children if user needs to complete onboarding
  if (!user) {
    return null;
  }

  const onboardingCompleted = localStorage.getItem('onboarding_completed');
  if (onboardingCompleted !== 'true') {
    return null;
  }

  return <>{children}</>;
};
