import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import EarnedNftsDisplay from '../../../../src/components/wallet/EarnedNftsDisplay';
import { NftItem } from '../../../../src/types/nft';

// Mock NftItem data
const mockNfts: NftItem[] = [
  {
    id: '1',
    name: 'Test NFT 1',
    description: 'This is test NFT 1',
    imageUrl: 'http://example.com/nft1.png',
    contractAddress: '0x123',
    tokenId: '101',
    collection: { id: 'c1', name: 'Collection One' },
    owner: 'user1',
  },
  {
    id: '2',
    name: 'Test NFT 2',
    description: 'This is test NFT 2',
    imageUrl: 'http://example.com/nft2.png',
    contractAddress: '0x456',
    tokenId: '102',
    collection: { id: 'c2', name: 'Collection Two' },
    owner: 'user2',
  },
];

describe('EarnedNftsDisplay', () => {
  test('renders correctly with no NFTs', () => {
    render(<EarnedNftsDisplay nfts={[]} onNftClick={() => {}} onActionClick={() => {}} />);
    expect(screen.getByText(/No NFTs earned yet./i)).toBeInTheDocument();
    expect(screen.queryByText(/Earned NFTs \\(Trophy Cabinet\\)/i)).toBeInTheDocument();
  });

  test('renders correctly with a list of NFTs', () => {
    render(<EarnedNftsDisplay nfts={mockNfts} onNftClick={() => {}} onActionClick={() => {}} />);
    expect(screen.getByText(/Earned NFTs \\(Trophy Cabinet\\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Test NFT 1/i)).toBeInTheDocument();
    expect(screen.getByText(/This is test NFT 1/i)).toBeInTheDocument();
    expect(screen.getByAltText(/Test NFT 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Test NFT 2/i)).toBeInTheDocument();
    expect(screen.getByText(/This is test NFT 2/i)).toBeInTheDocument();
    expect(screen.getByAltText(/Test NFT 2/i)).toBeInTheDocument();
    // Check for action buttons presence
    expect(screen.getAllByLabelText(/list/i).length).toBe(2);
    expect(screen.getAllByLabelText(/transfer/i).length).toBe(2);
  });

  test('calls onNftClick when an NFT item is clicked', async () => {
    const handleNftClick = jest.fn();
    render(<EarnedNftsDisplay nfts={mockNfts} onNftClick={handleNftClick} onActionClick={() => {}} />);
    
    const nftItem = screen.getByText(/Test NFT 1/i).closest('li');
    if (nftItem) {
        await userEvent.click(nftItem);
        expect(handleNftClick).toHaveBeenCalledTimes(1);
        expect(handleNftClick).toHaveBeenCalledWith(mockNfts[0]);
    } else {
        fail('NFT list item not found');
    }
  });

  test('calls onActionClick with correct action when List button is clicked', () => {
    const handleActionClick = jest.fn();
    render(<EarnedNftsDisplay nfts={mockNfts} onNftClick={() => {}} onActionClick={handleActionClick} />);
    
    const listButtons = screen.getAllByLabelText(/list/i);
    fireEvent.click(listButtons[0]); // Click the first list button

    expect(handleActionClick).toHaveBeenCalledTimes(1);
    expect(handleActionClick).toHaveBeenCalledWith(mockNfts[0], 'list');
  });

  test('calls onActionClick with correct action when Transfer button is clicked', () => {
    const handleActionClick = jest.fn();
    render(<EarnedNftsDisplay nfts={mockNfts} onNftClick={() => {}} onActionClick={handleActionClick} />);
    
    const transferButtons = screen.getAllByLabelText(/transfer/i);
    fireEvent.click(transferButtons[1]); // Click the second transfer button

    expect(handleActionClick).toHaveBeenCalledTimes(1);
    expect(handleActionClick).toHaveBeenCalledWith(mockNfts[1], 'transfer');
  });

  test('onNftClick is not called when action button is clicked', () => {
    const handleNftClick = jest.fn();
    const handleActionClick = jest.fn();
    render(<EarnedNftsDisplay nfts={mockNfts} onNftClick={handleNftClick} onActionClick={handleActionClick} />);
    
    const listButtons = screen.getAllByLabelText(/list/i);
    fireEvent.click(listButtons[0]); // Click the first list button

    expect(handleNftClick).not.toHaveBeenCalled();
    expect(handleActionClick).toHaveBeenCalledTimes(1);
  });
}); 