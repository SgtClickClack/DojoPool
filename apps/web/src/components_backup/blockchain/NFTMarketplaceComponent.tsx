import React, { useState, useEffect } from 'react';
import NFTMarketplaceService, {
  type NFTMetadata,
  type NFTListing,
  NFTBid,
  NFTRarity,
  BlockchainNetwork,
  type NFTMarketplaceStats,
} from '../../services/blockchain/NFTMarketplaceService';

interface NFTMarketplaceComponentProps {
  userAddress?: string;
  onNFTMinted?: (nft: NFTMetadata) => void;
  onNFTPurchased?: (transaction: any) => void;
}

export const NFTMarketplaceComponent: React.FC<
  NFTMarketplaceComponentProps
> = ({ userAddress, onNFTMinted, onNFTPurchased }) => {
  const [activeTab, setActiveTab] = useState<
    'browse' | 'my-nfts' | 'achievements' | 'collections'
  >('browse');
  const [nfts, setNfts] = useState<NFTMetadata[]>([]);
  const [listings, setListings] = useState<NFTListing[]>([]);
  const [myNFTs, setMyNFTs] = useState<NFTMetadata[]>([]);
  const [stats, setStats] = useState<NFTMarketplaceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNFT, setSelectedNFT] = useState<NFTMetadata | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidCurrency, setBidCurrency] = useState<'ETH' | 'DOJO' | 'USDC'>(
    'ETH'
  );
  const [showBidDialog, setShowBidDialog] = useState(false);
  const [showMintDialog, setShowMintDialog] = useState(false);
  const [mintForm, setMintForm] = useState({
    name: '',
    description: '',
    image: '',
    rarity: NFTRarity.COMMON,
    network: BlockchainNetwork.ETHEREUM,
  });

  const marketplaceService = NFTMarketplaceService.getInstance();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load marketplace data
      const activeListings = marketplaceService.getActiveListings();
      const marketplaceStats = marketplaceService.getMarketplaceStats();

      // Get all NFTs from listings
      const listedNFTs = activeListings
        .map((listing) =>
          marketplaceService.getNFT(
            listing.tokenId,
            listing.contractAddress,
            listing.network
          )
        )
        .filter(Boolean) as NFTMetadata[];

      setListings(activeListings);
      setNfts(listedNFTs);
      setStats(marketplaceStats);

      // Load user's NFTs if address provided
      if (userAddress) {
        const userNFTs = marketplaceService.getNFTsByOwner(userAddress);
        setMyNFTs(userNFTs);
      }
    } catch (error) {
      console.error('Error loading marketplace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMintNFT = async () => {
    try {
      if (!mintForm.name || !mintForm.description) {
        alert('Please fill in all required fields');
        return;
      }

      const nft = await marketplaceService.mintNFT({
        name: mintForm.name,
        description: mintForm.description,
        image: mintForm.image || '/images/default-nft.png',
        attributes: [
          { trait_type: 'Rarity', value: mintForm.rarity },
          { trait_type: 'Network', value: mintForm.network },
          { trait_type: 'Creator', value: userAddress || 'Unknown' },
        ],
        rarity: mintForm.rarity,
        creator: userAddress || '0x0000000000000000000000000000000000000000',
        network: mintForm.network,
        contractAddress: '0x1234567890123456789012345678901234567890',
        tokenStandard: 'ERC721',
      });

      setMintForm({
        name: '',
        description: '',
        image: '',
        rarity: NFTRarity.COMMON,
        network: BlockchainNetwork.ETHEREUM,
      });
      setShowMintDialog(false);
      onNFTMinted?.(nft);
      loadData();
    } catch (error) {
      console.error('Error minting NFT:', error);
      alert('Failed to mint NFT');
    }
  };

  const handleBuyNFT = async (listing: NFTListing) => {
    try {
      if (!userAddress) {
        alert('Please connect your wallet to buy NFTs');
        return;
      }

      const transaction = await marketplaceService.buyNFT(
        listing.id,
        userAddress,
        listing.price
      );

      onNFTPurchased?.(transaction);
      loadData();
      alert('NFT purchased successfully!');
    } catch (error) {
      console.error('Error buying NFT:', error);
      alert('Failed to buy NFT');
    }
  };

  const handlePlaceBid = async () => {
    try {
      if (!selectedNFT || !userAddress) {
        alert('Please select an NFT and connect your wallet');
        return;
      }

      const bid = await marketplaceService.placeBid(
        selectedNFT.tokenId,
        selectedNFT.contractAddress,
        selectedNFT.network,
        userAddress,
        bidAmount,
        bidCurrency
      );

      setBidAmount('');
      setShowBidDialog(false);
      setSelectedNFT(null);
      alert('Bid placed successfully!');
      loadData();
    } catch (error) {
      console.error('Error placing bid:', error);
      alert('Failed to place bid');
    }
  };

  const handleListNFT = async (
    nft: NFTMetadata,
    price: string,
    currency: 'ETH' | 'DOJO' | 'USDC'
  ) => {
    try {
      if (!userAddress) {
        alert('Please connect your wallet to list NFTs');
        return;
      }

      const listing = await marketplaceService.listNFT(
        nft.tokenId,
        nft.contractAddress,
        nft.network,
        price,
        currency,
        userAddress
      );

      alert('NFT listed successfully!');
      loadData();
    } catch (error) {
      console.error('Error listing NFT:', error);
      alert('Failed to list NFT');
    }
  };

  const getRarityColor = (rarity: NFTRarity): string => {
    const colors: Record<NFTRarity, string> = {
      [NFTRarity.COMMON]: 'text-gray-600',
      [NFTRarity.UNCOMMON]: 'text-green-600',
      [NFTRarity.RARE]: 'text-blue-600',
      [NFTRarity.EPIC]: 'text-purple-600',
      [NFTRarity.LEGENDARY]: 'text-orange-600',
      [NFTRarity.MYTHIC]: 'text-red-600',
    };
    return colors[rarity] || 'text-gray-600';
  };

  const getNetworkIcon = (network: BlockchainNetwork): string => {
    const icons: Record<BlockchainNetwork, string> = {
      [BlockchainNetwork.ETHEREUM]: '🔷',
      [BlockchainNetwork.POLYGON]: '🟣',
      [BlockchainNetwork.SOLANA]: '🟢',
      [BlockchainNetwork.ARBITRUM]: '🔵',
      [BlockchainNetwork.OPTIMISM]: '🔴',
      [BlockchainNetwork.BSC]: '🟡',
    };
    return icons[network] || '🔷';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading NFT Marketplace...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">NFT Marketplace</h2>
        <button
          onClick={() => setShowMintDialog(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Mint NFT
        </button>
      </div>

      {/* Marketplace Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalVolume} ETH
            </div>
            <div className="text-sm text-gray-600">Total Volume</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.totalSales}
            </div>
            <div className="text-sm text-gray-600">Total Sales</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">
              {stats.totalListings}
            </div>
            <div className="text-sm text-gray-600">Active Listings</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-600">
              {stats.floorPrice} ETH
            </div>
            <div className="text-sm text-gray-600">Floor Price</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('browse')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'browse'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Browse
        </button>
        <button
          onClick={() => setActiveTab('my-nfts')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'my-nfts'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          My NFTs
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'achievements'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Achievements
        </button>
        <button
          onClick={() => setActiveTab('collections')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'collections'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Collections
        </button>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'browse' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Available NFTs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nfts.map((nft) => {
                const listing = listings.find(
                  (l) =>
                    l.tokenId === nft.tokenId &&
                    l.contractAddress === nft.contractAddress
                );

                return (
                  <div
                    key={nft.tokenId}
                    className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <img
                      src={nft.image}
                      alt={nft.name}
                      className="w-full h-48 object-cover rounded-lg mb-3"
                    />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-800">
                          {nft.name}
                        </h4>
                        <span
                          className={`text-sm font-medium ${getRarityColor(nft.rarity)}`}
                        >
                          {nft.rarity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {nft.description}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>
                          {getNetworkIcon(nft.network)} {nft.network}
                        </span>
                        <span>#{nft.tokenId}</span>
                      </div>
                      {listing && (
                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">
                              Price:
                            </span>
                            <span className="font-semibold text-green-600">
                              {listing.price} {listing.currency}
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleBuyNFT(listing)}
                              className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                            >
                              Buy Now
                            </button>
                            <button
                              onClick={() => {
                                setSelectedNFT(nft);
                                setShowBidDialog(true);
                              }}
                              className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                            >
                              Bid
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'my-nfts' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              My NFTs
            </h3>
            {myNFTs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>You don't own any NFTs yet.</p>
                <button
                  onClick={() => setShowMintDialog(true)}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Mint Your First NFT
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myNFTs.map((nft) => (
                  <div key={nft.tokenId} className="bg-gray-50 rounded-lg p-4">
                    <img
                      src={nft.image}
                      alt={nft.name}
                      className="w-full h-48 object-cover rounded-lg mb-3"
                    />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-800">
                          {nft.name}
                        </h4>
                        <span
                          className={`text-sm font-medium ${getRarityColor(nft.rarity)}`}
                        >
                          {nft.rarity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{nft.description}</p>
                      {!nft.isListed && (
                        <button
                          onClick={() => handleListNFT(nft, '0.1', 'ETH')}
                          className="w-full py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors text-sm"
                        >
                          List for Sale
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'achievements' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Achievements
            </h3>
            <div className="text-center py-8 text-gray-500">
              <p>Achievement system coming soon!</p>
              <p className="text-sm mt-2">
                Complete challenges to earn unique NFTs
              </p>
            </div>
          </div>
        )}

        {activeTab === 'collections' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Collections
            </h3>
            <div className="text-center py-8 text-gray-500">
              <p>NFT collections coming soon!</p>
              <p className="text-sm mt-2">
                Browse curated collections of related NFTs
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Mint Dialog */}
      {showMintDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Mint New NFT</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="NFT Name"
                value={mintForm.name}
                onChange={(e) =>
                  setMintForm({ ...mintForm, name: e.target.value })
                }
                className="w-full p-2 border rounded"
              />
              <textarea
                placeholder="Description"
                value={mintForm.description}
                onChange={(e) =>
                  setMintForm({ ...mintForm, description: e.target.value })
                }
                className="w-full p-2 border rounded"
                rows={3}
              />
              <input
                type="text"
                placeholder="Image URL"
                value={mintForm.image}
                onChange={(e) =>
                  setMintForm({ ...mintForm, image: e.target.value })
                }
                className="w-full p-2 border rounded"
              />
              <select
                value={mintForm.rarity}
                onChange={(e) =>
                  setMintForm({
                    ...mintForm,
                    rarity: e.target.value as NFTRarity,
                  })
                }
                className="w-full p-2 border rounded"
              >
                <option value={NFTRarity.COMMON}>Common</option>
                <option value={NFTRarity.UNCOMMON}>Uncommon</option>
                <option value={NFTRarity.RARE}>Rare</option>
                <option value={NFTRarity.EPIC}>Epic</option>
                <option value={NFTRarity.LEGENDARY}>Legendary</option>
                <option value={NFTRarity.MYTHIC}>Mythic</option>
              </select>
              <select
                value={mintForm.network}
                onChange={(e) =>
                  setMintForm({
                    ...mintForm,
                    network: e.target.value as BlockchainNetwork,
                  })
                }
                className="w-full p-2 border rounded"
              >
                <option value={BlockchainNetwork.ETHEREUM}>Ethereum</option>
                <option value={BlockchainNetwork.POLYGON}>Polygon</option>
                <option value={BlockchainNetwork.SOLANA}>Solana</option>
                <option value={BlockchainNetwork.ARBITRUM}>Arbitrum</option>
                <option value={BlockchainNetwork.OPTIMISM}>Optimism</option>
                <option value={BlockchainNetwork.BSC}>BSC</option>
              </select>
            </div>
            <div className="flex space-x-2 mt-6">
              <button
                onClick={handleMintNFT}
                className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Mint NFT
              </button>
              <button
                onClick={() => setShowMintDialog(false)}
                className="flex-1 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bid Dialog */}
      {showBidDialog && selectedNFT && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Place Bid on {selectedNFT.name}
            </h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <img
                  src={selectedNFT.image}
                  alt={selectedNFT.name}
                  className="w-16 h-16 object-cover rounded"
                />
                <div>
                  <p className="font-medium">{selectedNFT.name}</p>
                  <p className="text-sm text-gray-600">
                    {selectedNFT.description}
                  </p>
                </div>
              </div>
              <input
                type="number"
                placeholder="Bid Amount"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="w-full p-2 border rounded"
                step="0.01"
                min="0"
              />
              <select
                value={bidCurrency}
                onChange={(e) =>
                  setBidCurrency(e.target.value as 'ETH' | 'DOJO' | 'USDC')
                }
                className="w-full p-2 border rounded"
              >
                <option value="ETH">ETH</option>
                <option value="DOJO">DOJO</option>
                <option value="USDC">USDC</option>
              </select>
            </div>
            <div className="flex space-x-2 mt-6">
              <button
                onClick={handlePlaceBid}
                className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Place Bid
              </button>
              <button
                onClick={() => {
                  setShowBidDialog(false);
                  setSelectedNFT(null);
                }}
                className="flex-1 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
