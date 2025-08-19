import React from 'react';

interface PrivateRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  adminOnly = false,
}) => {
  // Temporarily disabled authentication
  console.log('PrivateRoute temporarily disabled', { adminOnly });

  return <>{children}</>;
};
