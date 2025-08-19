import React from 'react';

export interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: 16 }}>
      {children}
    </div>
  );
};

export default Layout;
