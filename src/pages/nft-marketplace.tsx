import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { NFTMarketplaceComponent } from '../components/blockchain/NFTMarketplaceComponent';
import NFTMarketplaceService, { NFTMetadata, NFTTransaction } from '../services/blockchain/NFTMarketplaceService';

const NFTMarketplacePage: React.FC = () => {
  const [userAddress, setUserAddress] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<NFTTransaction[]>([]);
  const [marketplaceStats, setMarketplaceStats] = useState<any>(null);

  const marketplaceService = NFTMarketplaceService.getInstance();

  useEffect(() => {
    // Simulate wallet connection
    const mockAddress = '0x1234567890123456789012345678901234567890';
    setUserAddress(mockAddress);
    setIsConnected(true);

    // Load marketplace stats
    const stats = marketplaceService.getMarketplaceStats();
    setMarketplaceStats(stats);

    // Load recent transactions
    const transactions = Array.from(marketplaceService['transactions'].values())
      .filter(tx => tx.status === 'confirmed')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);
    setRecentTransactions(transactions);
  }, []);

  const handleNFTMinted = (nft: NFTMetadata) => {
    console.log('NFT minted:', nft);
    // Could trigger notifications, update UI, etc.
  };

  const handleNFTPurchased = (transaction: NFTTransaction) => {
    console.log('NFT purchased:', transaction);
    // Could trigger notifications, update UI, etc.
  };

  const connectWallet = () => {
    // Simulate wallet connection
    const mockAddress = '0x' + Math.random().toString(16).substr(2, 40);
    setUserAddress(mockAddress);
    setIsConnected(true);
  };

  const disconnectWallet = () => {
    setUserAddress('');
    setIsConnected(false);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                DojoPool NFT Marketplace
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100">
                Trade, collect, and earn unique NFTs from your pool gaming achievements
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                {!isConnected ? (
                  <button
                    onClick={connectWallet}
                    className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                  >
                    Connect Wallet
                  </button>
                ) : (
                  <div className="flex items-center gap-4">
                    <span className="text-sm bg-white bg-opacity-20 px-3 py-1 rounded">
                      {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                    </span>
                    <button
                      onClick={disconnectWallet}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
              Why Choose DojoPool NFTs?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏆</span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">Tournament Rewards</h3>
                <p className="text-gray-600">
                  Earn exclusive NFTs by winning tournaments and achieving milestones in your pool gaming journey.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">Skill-Based Achievements</h3>
                <p className="text-gray-600">
                  Unlock rare NFTs through exceptional gameplay, shot accuracy, and strategic victories.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💎</span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">Cross-Chain Trading</h3>
                <p className="text-gray-600">
                  Trade your NFTs across multiple blockchains with seamless cross-chain functionality.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Marketplace Stats */}
        {marketplaceStats && (
          <div className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
                Marketplace Statistics
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {marketplaceStats.totalVolume} ETH
                  </div>
                  <div className="text-gray-600">Total Volume</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {marketplaceStats.totalSales}
                  </div>
                  <div className="text-gray-600">Total Sales</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {marketplaceStats.totalListings}
                  </div>
                  <div className="text-gray-600">Active Listings</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {marketplaceStats.uniqueOwners}
                  </div>
                  <div className="text-gray-600">Unique Owners</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Marketplace */}
        <div className="py-16">
          <div className="container mx-auto px-4">
            <NFTMarketplaceComponent
              userAddress={userAddress}
              onNFTMinted={handleNFTMinted}
              onNFTPurchased={handleNFTPurchased}
            />
          </div>
        </div>

        {/* Recent Activity */}
        {recentTransactions.length > 0 && (
          <div className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
                Recent Activity
              </h2>
              <div className="max-w-4xl mx-auto">
                <div className="space-y-4">
                  {recentTransactions.map((tx) => (
                    <div key={tx.id} className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {tx.type === 'mint' ? '🎨' : tx.type === 'sale' ? '💰' : '🔄'}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">
                            {tx.type === 'mint' ? 'NFT Minted' : 
                             tx.type === 'sale' ? 'NFT Sold' : 'NFT Transferred'}
                          </div>
                          <div className="text-sm text-gray-600">
                            Token #{tx.tokenId} • {tx.timestamp.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {tx.price && (
                          <div className="font-semibold text-green-600">
                            {tx.price} {tx.currency}
                          </div>
                        )}
                        <div className="text-sm text-gray-500">
                          {tx.from.slice(0, 6)}...{tx.from.slice(-4)} → {tx.to.slice(0, 6)}...{tx.to.slice(-4)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  1
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Play Pool</h3>
                <p className="text-gray-600">
                  Play pool games and participate in tournaments to earn achievements.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  2
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Earn NFTs</h3>
                <p className="text-gray-600">
                  Unlock unique NFTs based on your performance and achievements.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  3
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Trade</h3>
                <p className="text-gray-600">
                  List your NFTs for sale or bid on others in the marketplace.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  4
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Collect</h3>
                <p className="text-gray-600">
                  Build your collection and showcase your pool gaming legacy.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Start Your NFT Journey?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Join the DojoPool community and start earning unique digital collectibles today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Browse Marketplace
              </button>
              <button
                onClick={() => window.location.href = '/tournaments'}
                className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                Join Tournament
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NFTMarketplacePage; 