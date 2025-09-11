import { OnboardingFlow } from '@/components/Onboarding/OnboardingFlow';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

const OnboardingPage: React.FC = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if not authenticated
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    // Redirect if already onboarded
    if (!loading && user) {
      const onboardingCompleted = localStorage.getItem('onboarding_completed');
      if (onboardingCompleted === 'true') {
        router.push('/dashboard');
        return;
      }
    }
  }, [user, loading, router]);

  // Show loading state
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

  // Don't render anything if user is not authenticated or already onboarded
  if (!user) {
    return null;
  }

  return <OnboardingFlow />;
};

export default OnboardingPage;
