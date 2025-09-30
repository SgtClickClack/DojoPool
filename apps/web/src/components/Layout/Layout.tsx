import { useRouter } from 'next/router';
import React, { useEffect } from 'react';
import DojoPoolAppBar from './AppBar';
import MobileNavigation from './MobileNavigation';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();

  // Global postMessage handler for match results
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'MATCH_RESULT') {
        const { challengeId, winnerId, score } = event.data;

        try {
          // Process match result via API
          const response = await fetch(
            `/api/challenges/${challengeId}/result`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                winnerId,
                score,
              }),
            }
          );

          if (response.ok) {
            // Refresh territories to show updated ownership
            const territoriesResponse = await fetch('/api/territories');
            if (territoriesResponse.ok) {
              const territoriesData = await territoriesResponse.json();
              // Trigger a custom event to notify components of territory updates
              window.dispatchEvent(
                new CustomEvent('territoriesUpdated', {
                  detail: territoriesData,
                })
              );
            }
          }
        } catch (error) {
          console.error('Failed to process match result:', error);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Check if we're on a mobile-first page or using mobile layout
  const isMobileFirstPage =
    router.pathname.startsWith('/tournaments') ||
    router.pathname.startsWith('/world') ||
    router.pathname.startsWith('/profile');

  // For mobile-first pages, use the mobile navigation
  if (isMobileFirstPage) {
    return (
      <div className="mobile-first">
        <main className="min-h-screen pb-20">{children}</main>
        <MobileNavigation
          currentPath={router.pathname}
          notifications={3}
          messages={2}
        />
      </div>
    );
  }

  // For other pages, use the existing desktop layout
  return (
    <>
      <DojoPoolAppBar position="static" />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">{children}</div>
      </main>
    </>
  );
};

export default Layout;
