import React from 'react';

export type PageBackgroundProps = {
  children?: React.ReactNode;
  variant?: 'tournaments' | 'default' | string;
  style?: React.CSSProperties;
};

const PageBackground: React.FC<PageBackgroundProps> = ({
  children,
  variant = 'default',
  style,
}) => {
  const background =
    variant === 'tournaments'
      ? 'linear-gradient(135deg, #001a1a 0%, #0a001a 100%)'
      : 'linear-gradient(180deg, #0b0b0b 0%, #111111 100%)';

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background,
        position: 'relative',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default PageBackground;
