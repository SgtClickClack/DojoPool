import { useAuth } from '@/frontend/contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to login page but save the attempted url
      router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="auth-loading">Loading...</div>;
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
};

export default PrivateRoute;
