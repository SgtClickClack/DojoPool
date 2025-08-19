import React from 'react';

export interface ContainerProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const Container: React.FC<ContainerProps> = ({ children, style }) => {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 16, ...style }}>
      {children}
    </div>
  );
};

export default Container;
