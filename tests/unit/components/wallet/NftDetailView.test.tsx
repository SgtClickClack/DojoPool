import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NftDetailView from '../../../../src/components/wallet/NftDetailView';

// Mock NftItem data
const mockNft = {
  id: '1',
  name: 'Test NFT',
  description: 'This is a test NFT',
  imageUrl: 'http://example.com/nft.png',
  contractAddress: '0x123...',
  tokenId: '456',
  collection: {
    id: 'collection-1',
    name: 'Test Collection',
  },
  owner: 'user123',
};

const mockNftMinimal = {
  id: '2',
  name: 'Minimal NFT',
  description: 'This NFT has only required fields.',
  imageUrl: 'http://example.com/minimal.png',
};

const mockNftMissingProps = {
  id: '3',
  name: 'Missing Props NFT',
  description: 'This NFT is missing several optional props.',
  // imageUrl is missing
  // contractAddress is missing
  // tokenId is missing
  // collection is missing
  // owner is missing
};

const mockNftMissingImageUrl = {
  ...mockNft,
  imageUrl: undefined,
};

const mockNftMissingContractAddress = {
  ...mockNft,
  contractAddress: undefined,
};

const mockNftMissingTokenId = {
  ...mockNft,
  tokenId: undefined,
};

const mockNftMissingCollection = {
  ...mockNft,
  collection: undefined,
};

const mockNftMissingOwner = {
  ...mockNft,
  owner: undefined,
};

describe('NftDetailView', () => {
  test('renders correctly with NFT details', () => {
    render(<NftDetailView nft={mockNft} onClose={() => {}} />);

    expect(screen.getByText(/NFT Details/i)).toBeInTheDocument();
    expect(screen.getByAltText(/Test NFT/i)).toBeInTheDocument();
    expect(screen.getByText(/Test NFT/i)).toBeInTheDocument();
    expect(screen.getByText(/This is a test NFT/i)).toBeInTheDocument();
    expect(screen.getByText(/Contract Address:/i)).toBeInTheDocument();
    expect(screen.getByText(/0x123.../)).toBeInTheDocument();
    expect(screen.getByText(/Token ID:/i)).toBeInTheDocument();
    expect(screen.getByText(/456/)).toBeInTheDocument();
    expect(screen.getByText(/Collection:/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Collection/)).toBeInTheDocument();
    expect(screen.getByText(/Owner:/i)).toBeInTheDocument();
    expect(screen.getByText(/user123/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Back to Rewards/i })).toBeInTheDocument();
  });

  test('calls onClose when the Back to Rewards button is clicked', () => {
    const handleClose = jest.fn();
    render(<NftDetailView nft={mockNft} onClose={handleClose} />);
    
    const backButton = screen.getByRole('button', { name: /Back to Rewards/i });
    fireEvent.click(backButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('renders correctly with minimal NFT data', () => {
    render(<NftDetailView nft={mockNftMinimal} onClose={() => {}} />);

    expect(screen.getByText(/NFT Details/i)).toBeInTheDocument();
    expect(screen.getByAltText(/Minimal NFT/i)).toBeInTheDocument();
    expect(screen.getByText(/Minimal NFT/i)).toBeInTheDocument();
    expect(screen.getByText(/This NFT has only required fields./i)).toBeInTheDocument();
    
    // Ensure optional fields are NOT rendered
    expect(screen.queryByText(/Contract Address:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Token ID:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Collection:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Owner:/i)).not.toBeInTheDocument();
    
    expect(screen.getByRole('button', { name: /Back to Rewards/i })).toBeInTheDocument();
  });

  test('renders correctly when all optional props are missing', () => {
    render(<NftDetailView nft={mockNftMissingProps} onClose={() => {}} />);

    expect(screen.getByText(/NFT Details/i)).toBeInTheDocument();
    expect(screen.queryByAltText(/Missing Props NFT/i)).not.toBeInTheDocument(); // imageUrl is missing
    expect(screen.getByText(/Missing Props NFT/i)).toBeInTheDocument();
    expect(screen.getByText(/This NFT is missing several optional props./i)).toBeInTheDocument();
    
    // Ensure optional fields are NOT rendered
    expect(screen.queryByText(/Contract Address:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Token ID:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Collection:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Owner:/i)).not.toBeInTheDocument();
    
    expect(screen.getByRole('button', { name: /Back to Rewards/i })).toBeInTheDocument();
  });

  test('renders correctly when imageUrl is missing', () => {
    render(<NftDetailView nft={mockNftMissingImageUrl} onClose={() => {}} />);
    expect(screen.queryByAltText(/Test NFT/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Test NFT/i)).toBeInTheDocument();
    // ... check other expected elements are present
  });

  test('renders correctly when contractAddress is missing', () => {
    render(<NftDetailView nft={mockNftMissingContractAddress} onClose={() => {}} />);
    expect(screen.queryByText(/Contract Address:/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Test NFT/i)).toBeInTheDocument();
    // ... check other expected elements are present
  });

   test('renders correctly when tokenId is missing', () => {
    render(<NftDetailView nft={mockNftMissingTokenId} onClose={() => {}} />);
    expect(screen.queryByText(/Token ID:/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Test NFT/i)).toBeInTheDocument();
    // ... check other expected elements are present
  });

  test('renders correctly when collection is missing', () => {
    render(<NftDetailView nft={mockNftMissingCollection} onClose={() => {}} />);
    expect(screen.queryByText(/Collection:/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Test NFT/i)).toBeInTheDocument();
    // ... check other expected elements are present
  });

  test('renders correctly when owner is missing', () => {
    render(<NftDetailView nft={mockNftMissingOwner} onClose={() => {}} />);
    expect(screen.queryByText(/Owner:/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Test NFT/i)).toBeInTheDocument();
    // ... check other expected elements are present
  });
}); 