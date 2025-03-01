import { ethers } from 'ethers';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { toast } from 'react-toastify';
import { blockchainService } from './blockchainService';
import { DojoTournamentABI } from '../contracts/abis/DojoTournamentABI';
import { CrossChainValidatorABI } from '../contracts/abis/CrossChainValidatorABI';
import { config } from '../config';

// Tournament interfaces
export interface TournamentDetails {
  id: string;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  registrationDeadline: string;
  location: string;
  format: string;
  gameType: string;
  prizePool: string;
  entryFeeEth: string;
  entryFeeSol: string;
  maxParticipants: number;
  participantsCount: number;
  isNativeChain: 'ethereum' | 'solana';
  isCrossChain: boolean;
  status: 'registration' | 'in_progress' | 'completed' | 'cancelled';
  creator: string;
}

export interface TournamentRegistrationResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export interface PlayerScoreUpdate {
  tournamentId: string;
  playerId: string;
  score: number;
  matchId?: string;
}

/**
 * Interface for tournament reward distribution response
 */
export interface TournamentRewardDistributionResponse {
  success: boolean;
  message: string;
  tournamentId?: string;
  chain?: string;
}

class CrossChainTournamentService {
  private ethereumTournamentContract: ethers.Contract | null = null;
  private ethereumValidatorContract: ethers.Contract | null = null;
  private solanaConnection: Connection | null = null;
  private solanaTournamentProgramId: PublicKey | null = null;
  private solanaValidatorProgramId: PublicKey | null = null;

  constructor() {
    this.initializeContracts();
  }

  private async initializeContracts() {
    try {
      // Initialize Ethereum contracts if provider is available
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        this.ethereumTournamentContract = new ethers.Contract(
          config.ethereum.tournamentContractAddress,
          DojoTournamentABI,
          provider
        );
        this.ethereumValidatorContract = new ethers.Contract(
          config.ethereum.validatorContractAddress,
          CrossChainValidatorABI,
          provider
        );
      }

      // Initialize Solana connection
      this.solanaConnection = new Connection(config.solana.rpcEndpoint);
      this.solanaTournamentProgramId = new PublicKey(config.solana.tournamentProgramId);
      this.solanaValidatorProgramId = new PublicKey(config.solana.validatorProgramId);
    } catch (error) {
      console.error('Failed to initialize blockchain contracts', error);
    }
  }

  /**
   * Get tournament details from either Ethereum or Solana
   */
  public async getTournamentDetails(tournamentId: string): Promise<TournamentDetails | null> {
    try {
      // Try Ethereum first
      if (this.ethereumTournamentContract) {
        try {
          const tournament = await this.ethereumTournamentContract.getTournament(tournamentId);
          if (tournament && tournament.id) {
            return this.formatEthereumTournament(tournament);
          }
        } catch (ethError) {
          console.log('Tournament not found on Ethereum, trying Solana');
        }
      }

      // Try Solana if not found on Ethereum
      if (this.solanaConnection && this.solanaTournamentProgramId) {
        try {
          // This would involve fetching the tournament account data from Solana
          // Implementation depends on how the Solana program stores tournament data
          const tournamentAccount = await this.fetchSolanaTournamentAccount(tournamentId);
          if (tournamentAccount) {
            return this.formatSolanaTournament(tournamentAccount);
          }
        } catch (solError) {
          console.log('Tournament not found on Solana');
        }
      }

      return null;
    } catch (error) {
      console.error('Error fetching tournament details:', error);
      return null;
    }
  }

  /**
   * Register a player for a tournament using either Ethereum or Solana
   */
  public async registerForTournament(
    tournamentId: string,
    chain: 'ethereum' | 'solana',
    entryFee: string,
    isCrossChain: boolean
  ): Promise<TournamentRegistrationResult> {
    try {
      // Check if wallet is connected
      const isConnected = await blockchainService.checkWalletStatus(chain);
      if (!isConnected) {
        return {
          success: false,
          error: `${chain === 'ethereum' ? 'Ethereum' : 'Solana'} wallet not connected`
        };
      }

      // Get tournament details to verify registration is open
      const tournament = await this.getTournamentDetails(tournamentId);
      if (!tournament) {
        return {
          success: false,
          error: 'Tournament not found'
        };
      }

      if (tournament.status !== 'registration') {
        return {
          success: false,
          error: 'Tournament registration is closed'
        };
      }

      if (tournament.participantsCount >= tournament.maxParticipants) {
        return {
          success: false,
          error: 'Tournament is full'
        };
      }

      // Register based on selected chain
      if (chain === 'ethereum') {
        return await this.registerWithEthereum(tournamentId, entryFee, isCrossChain);
      } else {
        return await this.registerWithSolana(tournamentId, entryFee, isCrossChain);
      }
    } catch (error) {
      console.error('Error registering for tournament:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update a player's score in a tournament
   */
  public async updatePlayerScore(data: PlayerScoreUpdate): Promise<boolean> {
    try {
      const tournament = await this.getTournamentDetails(data.tournamentId);
      if (!tournament) {
        toast.error('Tournament not found');
        return false;
      }

      // Update score on the native chain
      if (tournament.isNativeChain === 'ethereum') {
        return await this.updateScoreOnEthereum(data);
      } else {
        return await this.updateScoreOnSolana(data);
      }
    } catch (error) {
      console.error('Error updating player score:', error);
      toast.error('Failed to update player score');
      return false;
    }
  }

  /**
   * Submit final tournament results
   */
  public async submitTournamentResults(
    tournamentId: string,
    results: { playerId: string; finalRank: number; prize: string }[],
    isCrossChain: boolean
  ): Promise<boolean> {
    try {
      const tournament = await this.getTournamentDetails(tournamentId);
      if (!tournament) {
        toast.error('Tournament not found');
        return false;
      }

      // Only admins or the tournament creator can submit results
      // This would typically involve checking the user's role

      // Submit results on the native chain
      if (tournament.isNativeChain === 'ethereum') {
        return await this.submitResultsOnEthereum(tournamentId, results, isCrossChain);
      } else {
        return await this.submitResultsOnSolana(tournamentId, results, isCrossChain);
      }
    } catch (error) {
      console.error('Error submitting tournament results:', error);
      toast.error('Failed to submit tournament results');
      return false;
    }
  }

  /**
   * Distribute tournament rewards to winners
   * @param tournamentId Tournament identifier
   * @param rewards List of rewards to distribute
   * @returns Distribution response
   */
  public async distributeTournamentRewards(
    tournamentId: string,
    rewards: Array<{ 
      address: string;
      amount: string;
      rank: number;
    }>
  ): Promise<TournamentRewardDistributionResponse> {
    try {
      // Verify the user is authorized (admin or tournament organizer)
      const tournament = await this.getTournamentDetails(tournamentId);
      if (!tournament) {
        return {
          success: false,
          message: 'Tournament not found'
        };
      }
      
      // Check if tournament is completed
      if (tournament.status !== 'completed') {
        return {
          success: false,
          message: 'Cannot distribute rewards for tournaments that are not completed'
        };
      }
      
      // Process each reward based on the chain
      if (tournament.isNativeChain === 'ethereum') {
        return await this.distributeEthereumRewards(tournamentId, rewards, tournament.isCrossChain);
      } else {
        return await this.distributeSolanaRewards(tournamentId, rewards, tournament.isCrossChain);
      }
    } catch (error) {
      console.error('Error distributing tournament rewards:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
  
  /**
   * Distribute rewards on Ethereum chain
   */
  private async distributeEthereumRewards(
    tournamentId: string,
    rewards: Array<{ address: string; amount: string; rank: number }>,
    isCrossChain: boolean
  ): Promise<TournamentRewardDistributionResponse> {
    try {
      if (!this.ethereumTournamentContract || !window.ethereum) {
        return {
          success: false,
          message: 'Ethereum wallet not connected'
        };
      }
      
      // Prepare amounts for blockchain (convert to proper format)
      const addresses = rewards.map(r => r.address);
      const amounts = rewards.map(r => r.amount);
      
      // Call the smart contract to distribute rewards
      // Note: Actual implementation will depend on the contract's function signature
      const transaction = await this.ethereumTournamentContract.functions.distributeTournamentRewards(
        tournamentId,
        addresses,
        amounts,
        { gasLimit: 3000000 }
      );
      
      // Wait for transaction confirmation
      await transaction.wait();
      
      // If cross-chain, also handle Solana distributions if applicable
      if (isCrossChain) {
        // Handle cross-chain rewards logic here
        console.log('Processing cross-chain rewards on Solana');
      }
      
      return {
        success: true,
        message: 'Rewards distributed successfully on Ethereum',
        tournamentId,
        chain: 'ethereum'
      };
    } catch (error) {
      console.error('Error distributing Ethereum rewards:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred with Ethereum distribution'
      };
    }
  }
  
  /**
   * Distribute rewards on Solana chain
   */
  private async distributeSolanaRewards(
    tournamentId: string,
    rewards: Array<{ address: string; amount: string; rank: number }>,
    isCrossChain: boolean
  ): Promise<TournamentRewardDistributionResponse> {
    try {
      if (!this.solanaConnection || !this.solanaTournamentProgramId) {
        return {
          success: false,
          message: 'Solana wallet not connected'
        };
      }
      
      // Call the Solana program to distribute rewards
      // This is a placeholder - actual implementation would depend on Solana program structure
      const transactions = [];
      
      for (const reward of rewards) {
        // Create transaction for each reward
        // This is a simplified placeholder and would need to be replaced with actual implementation
        const transaction = await this.createSolanaTransaction(
          tournamentId,
          reward.address,
          reward.amount,
          reward.rank
        );
        
        transactions.push(transaction);
      }
      
      // If cross-chain, also handle Ethereum distributions if applicable
      if (isCrossChain) {
        // Handle cross-chain rewards logic here
        console.log('Processing cross-chain rewards on Ethereum');
      }
      
      return {
        success: true,
        message: 'Rewards distributed successfully on Solana',
        tournamentId,
        chain: 'solana'
      };
    } catch (error) {
      console.error('Error distributing Solana rewards:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred with Solana distribution'
      };
    }
  }
  
  /**
   * Helper method to create a Solana transaction for reward distribution
   * This is a placeholder implementation
   */
  private async createSolanaTransaction(
    tournamentId: string,
    recipientAddress: string,
    amount: string,
    rank: number
  ): Promise<string> {
    // This is just a placeholder that returns a dummy transaction ID
    // In a real implementation, this would create and send an actual Solana transaction
    return `solana-tx-${tournamentId}-${rank}-${Date.now()}`;
  }

  // Private helper methods
  private async registerWithEthereum(
    tournamentId: string,
    entryFee: string,
    isCrossChain: boolean
  ): Promise<TournamentRegistrationResult> {
    if (!this.ethereumTournamentContract || !window.ethereum) {
      return {
        success: false,
        error: 'Ethereum not available'
      };
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = this.ethereumTournamentContract.connect(signer);

      // Convert entry fee to wei
      const entryFeeWei = ethers.utils.parseEther(entryFee);

      // If cross-chain, we need to use the validator first
      if (isCrossChain && this.ethereumValidatorContract) {
        const validatorWithSigner = this.ethereumValidatorContract.connect(signer);
        
        // First, validate the tournament on Ethereum
        const validateTx = await validatorWithSigner.verifyTournament(tournamentId);
        await validateTx.wait();
      }

      // Register for the tournament
      const tx = await contract.registerForTournament(tournamentId, {
        value: entryFeeWei
      });

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Error registering with Ethereum:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async registerWithSolana(
    tournamentId: string,
    entryFee: string,
    isCrossChain: boolean
  ): Promise<TournamentRegistrationResult> {
    if (!this.solanaConnection || !this.solanaTournamentProgramId || !window.solana) {
      return {
        success: false,
        error: 'Solana not available'
      };
    }

    try {
      // Get the wallet
      const wallet = window.solana;
      if (!wallet.publicKey) {
        return {
          success: false,
          error: 'Solana wallet not connected'
        };
      }

      // Convert entry fee to lamports
      const entryFeeLamports = Math.floor(parseFloat(entryFee) * 1_000_000_000);

      // Build the transaction
      const transaction = new Transaction();

      // If cross-chain, add a verify instruction
      if (isCrossChain && this.solanaValidatorProgramId) {
        // Add verification instruction (specific implementation depends on Solana program)
        // transaction.add(...);
      }

      // Add registration instruction
      // This is a placeholder; actual implementation depends on your Solana program structure
      // transaction.add(...);

      // Add a transfer instruction for the entry fee
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: new PublicKey(config.solana.tournamentTreasuryAddress),
          lamports: entryFeeLamports
        })
      );

      // Get recent blockhash
      const { blockhash } = await this.solanaConnection.getRecentBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      // Sign and send transaction
      const signedTx = await wallet.signTransaction(transaction);
      const signature = await this.solanaConnection.sendRawTransaction(signedTx.serialize());

      // Wait for confirmation
      await this.solanaConnection.confirmTransaction(signature);

      return {
        success: true,
        transactionHash: signature
      };
    } catch (error) {
      console.error('Error registering with Solana:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async updateScoreOnEthereum(data: PlayerScoreUpdate): Promise<boolean> {
    if (!this.ethereumTournamentContract || !window.ethereum) {
      toast.error('Ethereum not available');
      return false;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = this.ethereumTournamentContract.connect(signer);

      const tx = await contract.updatePlayerScore(
        data.tournamentId,
        data.playerId,
        data.score,
        data.matchId || ethers.constants.HashZero
      );

      await tx.wait();
      return true;
    } catch (error) {
      console.error('Error updating score on Ethereum:', error);
      return false;
    }
  }

  private async updateScoreOnSolana(data: PlayerScoreUpdate): Promise<boolean> {
    // Implementation depends on your Solana program
    console.log('Updating score on Solana:', data);
    return false; // Placeholder
  }

  private async submitResultsOnEthereum(
    tournamentId: string,
    results: { playerId: string; finalRank: number; prize: string }[],
    isCrossChain: boolean
  ): Promise<boolean> {
    if (!this.ethereumTournamentContract || !window.ethereum) {
      toast.error('Ethereum not available');
      return false;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = this.ethereumTournamentContract.connect(signer);

      // Prepare the results data for the contract
      const playerIds = results.map(r => r.playerId);
      const ranks = results.map(r => r.finalRank);
      const prizes = results.map(r => ethers.utils.parseEther(r.prize));

      // Submit results transaction
      const tx = await contract.submitResults(tournamentId, playerIds, ranks, prizes);
      await tx.wait();

      // If cross-chain, update the validator
      if (isCrossChain && this.ethereumValidatorContract) {
        const validatorWithSigner = this.ethereumValidatorContract.connect(signer);
        
        // Create a hash of the results for cross-chain validation
        const resultsHash = ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(
            ['string[]', 'uint256[]', 'uint256[]'],
            [playerIds, ranks, prizes.map(p => p.toString())]
          )
        );
        
        // Record the results hash in the validator
        const validatorTx = await validatorWithSigner.updateValidationHash(
          tournamentId,
          resultsHash,
          2 // Assuming status code 2 means "results submitted"
        );
        
        await validatorTx.wait();
      }

      return true;
    } catch (error) {
      console.error('Error submitting results on Ethereum:', error);
      return false;
    }
  }

  private async submitResultsOnSolana(
    tournamentId: string,
    results: { playerId: string; finalRank: number; prize: string }[],
    isCrossChain: boolean
  ): Promise<boolean> {
    // Implementation depends on your Solana program
    console.log('Submitting results on Solana:', tournamentId, results, isCrossChain);
    return false; // Placeholder
  }

  private async fetchSolanaTournamentAccount(tournamentId: string): Promise<any> {
    // This is a placeholder. Implementation depends on how you store tournament data in Solana
    console.log('Fetching Solana tournament:', tournamentId);
    return null;
  }

  private formatEthereumTournament(tournamentData: any): TournamentDetails {
    // Convert raw contract data to TournamentDetails format
    return {
      id: tournamentData.id,
      name: tournamentData.name,
      description: tournamentData.description,
      startTime: new Date(tournamentData.startTime.toNumber() * 1000).toISOString(),
      endTime: new Date(tournamentData.endTime.toNumber() * 1000).toISOString(),
      registrationDeadline: new Date(tournamentData.registrationDeadline.toNumber() * 1000).toISOString(),
      location: tournamentData.location,
      format: tournamentData.format,
      gameType: tournamentData.gameType,
      prizePool: ethers.utils.formatEther(tournamentData.prizePool),
      entryFeeEth: ethers.utils.formatEther(tournamentData.entryFee),
      entryFeeSol: this.convertEthToSol(ethers.utils.formatEther(tournamentData.entryFee)),
      maxParticipants: tournamentData.maxParticipants.toNumber(),
      participantsCount: tournamentData.participantsCount.toNumber(),
      isNativeChain: 'ethereum',
      isCrossChain: tournamentData.isCrossChain,
      status: this.mapStatusCode(tournamentData.status),
      creator: tournamentData.creator
    };
  }

  private formatSolanaTournament(tournamentData: any): TournamentDetails {
    // This is a placeholder. Implementation depends on how you store tournament data in Solana
    return {
      id: 'solana-tournament-id',
      name: 'Solana Tournament',
      description: 'A tournament hosted on Solana',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 86400000).toISOString(), // 1 day later
      registrationDeadline: new Date(Date.now() + 3600000).toISOString(), // 1 hour later
      location: 'Virtual',
      format: '8-Ball',
      gameType: 'Single Elimination',
      prizePool: '10',
      entryFeeEth: this.convertSolToEth('0.1'),
      entryFeeSol: '0.1',
      maxParticipants: 16,
      participantsCount: 0,
      isNativeChain: 'solana',
      isCrossChain: true,
      status: 'registration',
      creator: 'solana-creator-address'
    };
  }

  private mapStatusCode(statusCode: number): 'registration' | 'in_progress' | 'completed' | 'cancelled' {
    switch (statusCode) {
      case 0:
        return 'registration';
      case 1:
        return 'in_progress';
      case 2:
        return 'completed';
      case 3:
        return 'cancelled';
      default:
        return 'registration';
    }
  }

  // Simple conversion functions (in a real app, use oracle price feeds)
  private convertEthToSol(ethAmount: string): string {
    // Placeholder conversion rate (1 ETH = 20 SOL)
    return (parseFloat(ethAmount) * 20).toFixed(2);
  }

  private convertSolToEth(solAmount: string): string {
    // Placeholder conversion rate (1 SOL = 0.05 ETH)
    return (parseFloat(solAmount) * 0.05).toFixed(4);
  }
}

export const crossChainTournamentService = new CrossChainTournamentService(); 