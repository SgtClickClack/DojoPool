import React from "react";

interface MarketplaceLayoutProps {
  children: React.ReactNode;
}

const MarketplaceLayout: React.FC<MarketplaceLayoutProps> = ({ children }) => {
  return <div className="marketplace-layout">{children}</div>;
};

export default MarketplaceLayout;
