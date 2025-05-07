import React from 'react';
import WalletView from '../components/WalletView';

const WalletPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Wallet</h1>
      <WalletView />
    </div>
  );
};

export default WalletPage; 