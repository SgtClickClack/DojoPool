import { useRouter } from 'next/router';
import React from 'react';
import DojoPoolAppBar from './AppBar';
import MobileNavigation from './MobileNavigation';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();

  // Check if we're on a mobile-first page or using mobile layout
  const isMobileFirstPage =
    router.pathname.startsWith('/dashboard') ||
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
