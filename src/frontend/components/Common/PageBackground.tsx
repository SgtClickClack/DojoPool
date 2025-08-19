import React from 'react';

interface PageBackgroundProps {
  children: React.ReactNode;
  variant?: string;
  style?: React.CSSProperties;
}

const PageBackground: React.FC<PageBackgroundProps> = ({ children, variant, style }) => {
  const backgroundColor = '#f5f5f5';
  return (
    <div style={{ minHeight: '100vh', background: backgroundColor, ...style }}>
      {children}
    </div>
  );
};

export default PageBackground;
