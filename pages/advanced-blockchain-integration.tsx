/**
 * Advanced Blockchain Integration & NFT Management Page
 * 
 * Next.js page for the comprehensive blockchain integration system
 */

import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import AdvancedBlockchainIntegrationDashboard from '../src/components/blockchain/AdvancedBlockchainIntegrationDashboard';

const AdvancedBlockchainIntegrationPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Advanced Blockchain Integration & NFT Management - DojoPool</title>
        <meta name="description" content="Comprehensive blockchain integration, NFT management, smart contract interactions, and cross-chain operations for DojoPool platform" />
        <meta name="keywords" content="blockchain, NFT, smart contracts, cross-chain, cryptocurrency, digital assets, DojoPool" />
      </Head>
      
      <AdvancedBlockchainIntegrationDashboard />
    </>
  );
};

export default AdvancedBlockchainIntegrationPage; 