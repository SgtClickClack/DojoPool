export interface NftItem {
  id: string;
  name: string;
  description: string;
  imageUrl?: string; // Made imageUrl optional
  contractAddress?: string; // Optional: NFT contract address
  tokenId?: string; // Optional: Unique token ID within the contract
  collection?: { // Optional: NFT collection details
    id: string;
    name: string;
    // Add other collection properties as needed
  };
  owner?: string; // Optional: Owner's address or user ID
  // Add other relevant NFT properties here, e.g., attributes, external link, etc.
} 