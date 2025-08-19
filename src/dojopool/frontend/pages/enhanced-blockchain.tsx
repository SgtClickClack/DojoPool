import React from 'react';
import { EnhancedBlockchainPanel } from '../src/components/blockchain/EnhancedBlockchainPanel';
import { Layout } from '../src/components/layout/Layout';

const EnhancedBlockchainPage: React.FC = () => {
  return (
    <Layout>
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

        <EnhancedBlockchainPanel />
      </div>
    </Layout>
  );
};

export default EnhancedBlockchainPage;
