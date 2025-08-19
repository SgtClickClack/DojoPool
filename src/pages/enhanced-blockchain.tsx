import React from 'react';
// import { EnhancedBlockchainPanel } from '../../../../../apps/web/src/components/blockchain/EnhancedBlockchainPanel';
// import { Layout } from '../../../../../apps/web/src/components/layout/Layout';

const EnhancedBlockchainPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">
            Enhanced Blockchain Integration
          </h1>
          <p className="text-lg text-muted-foreground">
            Advanced blockchain functionality including ERC-20 Dojo Coin,
            cross-chain transfers, and NFT marketplace operations across
            multiple networks.
          </p>
        </div>

        {/* <EnhancedBlockchainPanel /> */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Enhanced Blockchain Panel
          </h2>
          <p className="text-gray-600">
            Enhanced blockchain panel temporarily unavailable. This component
            will be implemented in a future update.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnhancedBlockchainPage;
