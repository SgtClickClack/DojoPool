import React, { useState } from 'react';
import { useAdvancedBlockchainIntegration, BlockchainNetwork, NFTRarity } from '../../hooks/useAdvancedBlockchainIntegration';

const AdvancedBlockchainDashboard: React.FC = () => {
  const {
    loading,
    error,
    analytics,
    mintNFT,
    transferNFT,
    evolveNFT,
    executeSmartContract,
    initiateCrossChainOperation,
    createCollection,
    addNFTToCollection,
    getAnalytics,
    clearError
  } = useAdvancedBlockchainIntegration();

  // Minimal state for demo forms
  const [mintForm, setMintForm] = useState({
    name: '',
    description: '',
    image: '',
    creator: '',
    contractAddress: '',
    network: BlockchainNetwork.ETHEREUM,
    rarity: NFTRarity.COMMON,
    attributes: [],
    metadata: {}
  });

  const [transferForm, setTransferForm] = useState({
    tokenId: '',
    contractAddress: '',
    network: BlockchainNetwork.ETHEREUM,
    fromAddress: '',
    toAddress: '',
    price: '',
    currency: ''
  });

  const [evolveForm, setEvolveForm] = useState({
    tokenId: '',
    contractAddress: '',
    network: BlockchainNetwork.ETHEREUM,
    newStage: 1,
    newAbilities: '',
    powerIncrease: 0
  });

  // Handlers
  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    await mintNFT(mintForm as any);
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    await transferNFT(transferForm as any);
  };

  const handleEvolve = async (e: React.FormEvent) => {
    e.preventDefault();
    await evolveNFT({
      tokenId: evolveForm.tokenId,
      contractAddress: evolveForm.contractAddress,
      network: evolveForm.network,
      evolutionData: {
        newStage: evolveForm.newStage,
        newAbilities: evolveForm.newAbilities.split(',').map(s => s.trim()),
        powerIncrease: evolveForm.powerIncrease
      }
    });
  };

  return (
    <div style={{ padding: 32 }}>
      <h1>Advanced Blockchain Integration & NFT Management</h1>
      {error && <div style={{ color: 'red' }}>{error} <button onClick={clearError}>Clear</button></div>}
      {loading && <div>Loading...</div>}

      <section style={{ marginBottom: 32 }}>
        <h2>Mint NFT</h2>
        <form onSubmit={handleMint}>
          <input placeholder="Name" value={mintForm.name} onChange={e => setMintForm(f => ({ ...f, name: e.target.value }))} />
          <input placeholder="Description" value={mintForm.description} onChange={e => setMintForm(f => ({ ...f, description: e.target.value }))} />
          <input placeholder="Image URL" value={mintForm.image} onChange={e => setMintForm(f => ({ ...f, image: e.target.value }))} />
          <input placeholder="Creator Address" value={mintForm.creator} onChange={e => setMintForm(f => ({ ...f, creator: e.target.value }))} />
          <input placeholder="Contract Address" value={mintForm.contractAddress} onChange={e => setMintForm(f => ({ ...f, contractAddress: e.target.value }))} />
          <select value={mintForm.network} onChange={e => setMintForm(f => ({ ...f, network: e.target.value as BlockchainNetwork }))}>
            {Object.values(BlockchainNetwork).map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <select value={mintForm.rarity} onChange={e => setMintForm(f => ({ ...f, rarity: e.target.value as NFTRarity }))}>
            {Object.values(NFTRarity).map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button type="submit">Mint</button>
        </form>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2>Transfer NFT</h2>
        <form onSubmit={handleTransfer}>
          <input placeholder="Token ID" value={transferForm.tokenId} onChange={e => setTransferForm(f => ({ ...f, tokenId: e.target.value }))} />
          <input placeholder="Contract Address" value={transferForm.contractAddress} onChange={e => setTransferForm(f => ({ ...f, contractAddress: e.target.value }))} />
          <input placeholder="From Address" value={transferForm.fromAddress} onChange={e => setTransferForm(f => ({ ...f, fromAddress: e.target.value }))} />
          <input placeholder="To Address" value={transferForm.toAddress} onChange={e => setTransferForm(f => ({ ...f, toAddress: e.target.value }))} />
          <select value={transferForm.network} onChange={e => setTransferForm(f => ({ ...f, network: e.target.value as BlockchainNetwork }))}>
            {Object.values(BlockchainNetwork).map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <input placeholder="Price (optional)" value={transferForm.price} onChange={e => setTransferForm(f => ({ ...f, price: e.target.value }))} />
          <input placeholder="Currency (optional)" value={transferForm.currency} onChange={e => setTransferForm(f => ({ ...f, currency: e.target.value }))} />
          <button type="submit">Transfer</button>
        </form>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2>Evolve NFT</h2>
        <form onSubmit={handleEvolve}>
          <input placeholder="Token ID" value={evolveForm.tokenId} onChange={e => setEvolveForm(f => ({ ...f, tokenId: e.target.value }))} />
          <input placeholder="Contract Address" value={evolveForm.contractAddress} onChange={e => setEvolveForm(f => ({ ...f, contractAddress: e.target.value }))} />
          <select value={evolveForm.network} onChange={e => setEvolveForm(f => ({ ...f, network: e.target.value as BlockchainNetwork }))}>
            {Object.values(BlockchainNetwork).map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <input placeholder="New Stage" type="number" value={evolveForm.newStage} onChange={e => setEvolveForm(f => ({ ...f, newStage: Number(e.target.value) }))} />
          <input placeholder="New Abilities (comma separated)" value={evolveForm.newAbilities} onChange={e => setEvolveForm(f => ({ ...f, newAbilities: e.target.value }))} />
          <input placeholder="Power Increase" type="number" value={evolveForm.powerIncrease} onChange={e => setEvolveForm(f => ({ ...f, powerIncrease: Number(e.target.value) }))} />
          <button type="submit">Evolve</button>
        </form>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2>Analytics</h2>
        <button onClick={getAnalytics}>Refresh Analytics</button>
        <pre style={{ background: '#f4f4f4', padding: 16 }}>{analytics ? JSON.stringify(analytics, null, 2) : 'No analytics loaded.'}</pre>
      </section>
    </div>
  );
};

export default AdvancedBlockchainDashboard; 