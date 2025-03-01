/**
 * Global configuration for the DojoPool application
 */
export const config = {
  // Ethereum blockchain configuration
  ethereum: {
    // Contract addresses
    tournamentContractAddress: process.env.REACT_APP_ETH_TOURNAMENT_CONTRACT_ADDRESS || '0x1234567890123456789012345678901234567890',
    validatorContractAddress: process.env.REACT_APP_ETH_VALIDATOR_CONTRACT_ADDRESS || '0x2345678901234567890123456789012345678901',
    dojoTokenAddress: process.env.REACT_APP_ETH_DOJO_TOKEN_ADDRESS || '0x3456789012345678901234567890123456789012',
    dojoNFTAddress: process.env.REACT_APP_ETH_DOJO_NFT_ADDRESS || '0x4567890123456789012345678901234567890123',
    
    // Network settings
    chainId: process.env.REACT_APP_ETH_CHAIN_ID || '1',
    networkName: process.env.REACT_APP_ETH_NETWORK_NAME || 'Ethereum Mainnet',
    rpcUrl: process.env.REACT_APP_ETH_RPC_URL || 'https://mainnet.infura.io/v3/your-infura-key',
    
    // Explorer URLs
    blockExplorerUrl: process.env.REACT_APP_ETH_BLOCK_EXPLORER_URL || 'https://etherscan.io',
  },
  
  // Solana blockchain configuration
  solana: {
    // Program IDs
    tournamentProgramId: process.env.REACT_APP_SOLANA_TOURNAMENT_PROGRAM_ID || 'Tournament1111111111111111111111111111111111',
    validatorProgramId: process.env.REACT_APP_SOLANA_VALIDATOR_PROGRAM_ID || 'Validator1111111111111111111111111111111111',
    dojoTokenMint: process.env.REACT_APP_SOLANA_DOJO_TOKEN_MINT || 'TokenMint1111111111111111111111111111111111',
    dojoNFTCollection: process.env.REACT_APP_SOLANA_DOJO_NFT_COLLECTION || 'Collection111111111111111111111111111111111',
    
    // Treasury/Fee accounts
    tournamentTreasuryAddress: process.env.REACT_APP_SOLANA_TOURNAMENT_TREASURY || 'Treasury1111111111111111111111111111111111',
    
    // Network settings
    network: process.env.REACT_APP_SOLANA_NETWORK || 'mainnet-beta',
    rpcEndpoint: process.env.REACT_APP_SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com',
    
    // Explorer URLs
    blockExplorerUrl: process.env.REACT_APP_SOLANA_BLOCK_EXPLORER_URL || 'https://explorer.solana.com',
  },
  
  // Cross-chain settings
  crossChain: {
    // Fee configurations (in percentage)
    ethToSolFeePercent: parseFloat(process.env.REACT_APP_ETH_TO_SOL_FEE_PERCENT || '2.5'),
    solToEthFeePercent: parseFloat(process.env.REACT_APP_SOL_TO_ETH_FEE_PERCENT || '2.5'),
    
    // Oracle settings for price feeds
    priceOracleUrl: process.env.REACT_APP_PRICE_ORACLE_URL || 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,solana&vs_currencies=usd',
    
    // Validation timeouts (in milliseconds)
    validationTimeout: parseInt(process.env.REACT_APP_VALIDATION_TIMEOUT || '60000'),
  },
  
  // API endpoints
  api: {
    baseUrl: process.env.REACT_APP_API_BASE_URL || 'https://api.dojopool.com',
    tournamentEndpoint: '/tournaments',
    profileEndpoint: '/profiles',
    venueEndpoint: '/venues',
    statsEndpoint: '/stats',
  },
  
  // Feature flags
  features: {
    enableCrossChainRegistration: process.env.REACT_APP_ENABLE_CROSS_CHAIN === 'true',
    enableNFTRewards: process.env.REACT_APP_ENABLE_NFT_REWARDS === 'true',
    enableVenueCheckIn: process.env.REACT_APP_ENABLE_VENUE_CHECK_IN === 'true',
    enableProfileCustomization: process.env.REACT_APP_ENABLE_PROFILE_CUSTOMIZATION === 'true',
    enableTournamentCreation: process.env.REACT_APP_ENABLE_TOURNAMENT_CREATION === 'true',
  },
  
  // UI configuration
  ui: {
    theme: process.env.REACT_APP_THEME || 'dark',
    maxItemsPerPage: parseInt(process.env.REACT_APP_MAX_ITEMS_PER_PAGE || '10'),
    defaultAvatar: '/assets/images/default-avatar.png',
    defaultTournamentImage: '/assets/images/default-tournament.png',
  }
}; 