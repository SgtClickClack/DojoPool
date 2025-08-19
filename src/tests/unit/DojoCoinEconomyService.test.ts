import {
  DojoCoinEconomyService,
  DojoCoinTransaction,
  UserEconomyProfile,
} from '../../services/economy/DojoCoinEconomyService';

describe('DojoCoinEconomyService', () => {
  let service: DojoCoinEconomyService;

  beforeEach(() => {
    // Reset the singleton instance for each test
    (DojoCoinEconomyService as any).instance = undefined;
    service = DojoCoinEconomyService.getInstance();
  });

  describe('initialization', () => {
    it('should initialize as singleton', () => {
      const instance1 = DojoCoinEconomyService.getInstance();
      const instance2 = DojoCoinEconomyService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should initialize with default categories', () => {
      const categories = service.getTransactionCategories();
      expect(categories).toHaveLength(10);
      expect(categories.find((c) => c.id === 'match_win')).toBeDefined();
      expect(categories.find((c) => c.id === 'tournament_win')).toBeDefined();
    });
  });

  describe('user profile management', () => {
    it('should create user profile on first access', () => {
      const balance = service.getUserBalance('user-1');
      expect(balance).toBe(100); // Starting balance
    });

    it('should return consistent user balance', () => {
      const balance1 = service.getUserBalance('user-1');
      const balance2 = service.getUserBalance('user-1');
      expect(balance1).toBe(balance2);
    });
  });

  describe('balance management', () => {
    it('should get user balance', () => {
      const balance = service.getUserBalance('user-1');
      expect(balance).toBe(100); // Starting balance
    });

    it('should update balance after earning', async () => {
      await service.earnCoins('user-1', 50, 'match_win', 'Test match win');
      const balance = service.getUserBalance('user-1');
      expect(balance).toBe(150);
    });

    it('should update balance after spending', async () => {
      await service.spendCoins('user-1', 30, 'avatar_upgrade', 'Test upgrade');
      const balance = service.getUserBalance('user-1');
      expect(balance).toBe(70);
    });
  });

  describe('earning mechanics', () => {
    it('should earn coins from match win', async () => {
      const transaction = await service.earnCoins(
        'user-1',
        100,
        'match_win',
        'Match victory'
      );

      expect(transaction.type).toBe('earn');
      expect(transaction.amount).toBe(100); // No multiplier for match_win
      expect(transaction.category.id).toBe('match_win');
      expect(transaction.status).toBe('completed');
    });

    it('should apply category multipliers', async () => {
      const transaction = await service.earnCoins(
        'user-1',
        100,
        'tournament_win',
        'Tournament victory'
      );

      expect(transaction.amount).toBe(200); // 2.0 multiplier for tournament_win
    });

    it('should track earnings in profile', async () => {
      await service.earnCoins('user-1', 100, 'match_win', 'Test');
      const stats = service.getTransactionStats('user-1');

      expect(stats.totalEarned).toBe(100);
    });
  });

  describe('spending mechanics', () => {
    it('should spend coins', async () => {
      const transaction = await service.spendCoins(
        'user-1',
        50,
        'avatar_upgrade',
        'Avatar upgrade'
      );

      expect(transaction.type).toBe('spend');
      expect(transaction.amount).toBe(50);
      expect(transaction.category.id).toBe('avatar_upgrade');
      expect(transaction.status).toBe('completed');
    });

    it('should fail spending with insufficient balance', async () => {
      await expect(
        service.spendCoins('user-1', 200, 'avatar_upgrade', 'Expensive upgrade')
      ).rejects.toThrow('Insufficient balance');
    });

    it('should track spending in profile', async () => {
      await service.spendCoins('user-1', 30, 'avatar_upgrade', 'Test');
      const stats = service.getTransactionStats('user-1');

      expect(stats.totalSpent).toBe(30);
    });
  });

  describe('transfer system', () => {
    beforeEach(async () => {
      // Give user-1 more coins for transfer testing
      await service.earnCoins('user-1', 200, 'match_win', 'Setup');
    });

    it('should transfer coins between users', async () => {
      const result = await service.transferCoins(
        'user-1',
        'user-2',
        50,
        'Gift'
      );

      expect(result.fromTransaction.type).toBe('spend');
      expect(result.toTransaction.type).toBe('earn');
      expect(result.fromTransaction.amount).toBe(50);
      expect(result.toTransaction.amount).toBe(50);

      expect(service.getUserBalance('user-1')).toBe(250); // 100 + 200 - 50
      expect(service.getUserBalance('user-2')).toBe(150); // 100 + 50
    });

    it('should fail transfer with insufficient balance', async () => {
      await expect(
        service.transferCoins('user-1', 'user-2', 500, 'Large gift')
      ).rejects.toThrow('Insufficient balance');
    });

    it('should fail transfer to same user', async () => {
      await expect(
        service.transferCoins('user-1', 'user-1', 50, 'Self transfer')
      ).rejects.toThrow('Cannot transfer to same user');
    });
  });

  describe('transaction management', () => {
    beforeEach(async () => {
      await service.earnCoins('user-1', 100, 'match_win', 'Test transaction');
      await service.spendCoins('user-1', 30, 'avatar_upgrade', 'Test spending');
    });

    it('should get user transactions', () => {
      const transactions = service.getUserTransactions('user-1');
      expect(transactions).toHaveLength(2);
      expect(transactions[0].userId).toBe('user-1');
    });

    it('should get transaction statistics', () => {
      const stats = service.getTransactionStats('user-1');

      expect(stats.totalTransactions).toBe(2);
      expect(stats.totalEarned).toBe(100);
      expect(stats.totalSpent).toBe(30);
      expect(stats.averageTransaction).toBe(65);
      expect(stats.mostUsedCategory).toBeDefined();
    });
  });

  describe('rank progression', () => {
    it('should start with bronze rank', () => {
      const balance = service.getUserBalance('user-1');
      expect(balance).toBe(100); // Starting balance
    });

    it('should upgrade rank with sufficient earnings', async () => {
      // Earn enough to upgrade to silver (typically 1000 coins)
      await service.earnCoins('user-1', 1000, 'match_win', 'Rank upgrade');

      const stats = service.getTransactionStats('user-1');
      expect(stats.totalEarned).toBe(1000);
    });
  });

  describe('daily and weekly limits', () => {
    it('should enforce daily limits', async () => {
      // Try to earn more than daily limit for match_win (1000)
      for (let i = 0; i < 10; i++) {
        await service.earnCoins('user-1', 100, 'match_win', `Earning ${i}`);
      }

      // Next transaction should fail
      await expect(
        service.earnCoins('user-1', 100, 'match_win', 'Exceed limit')
      ).rejects.toThrow('Transaction limit exceeded');
    });

    it('should enforce weekly limits', async () => {
      // Try to earn more than weekly limit for tournament_win (5000)
      for (let i = 0; i < 50; i++) {
        await service.earnCoins(
          'user-1',
          100,
          'tournament_win',
          `Tournament ${i}`
        );
      }

      // Next transaction should fail
      await expect(
        service.earnCoins(
          'user-1',
          100,
          'tournament_win',
          'Exceed weekly limit'
        )
      ).rejects.toThrow('Transaction limit exceeded');
    });
  });

  describe('leaderboards', () => {
    beforeEach(async () => {
      await service.earnCoins('user-1', 500, 'match_win', 'User 1 earnings');
      await service.earnCoins('user-2', 1000, 'match_win', 'User 2 earnings');
      await service.earnCoins('user-3', 300, 'match_win', 'User 3 earnings');
    });

    it('should get balance leaderboard', () => {
      const leaderboard = service.getLeaderboard(3);
      expect(leaderboard).toHaveLength(3);
      expect(leaderboard[0].balance).toBeGreaterThanOrEqual(
        leaderboard[1].balance
      );
      expect(leaderboard[1].balance).toBeGreaterThanOrEqual(
        leaderboard[2].balance
      );
    });

    it('should get earnings leaderboard', () => {
      const leaderboard = service.getEarningsLeaderboard(3);
      expect(leaderboard).toHaveLength(3);
      expect(leaderboard[0].totalEarned).toBeGreaterThanOrEqual(
        leaderboard[1].totalEarned
      );
    });
  });

  describe('error handling', () => {
    it('should handle invalid category', async () => {
      await expect(
        service.earnCoins('user-1', 100, 'invalid_category', 'Test')
      ).rejects.toThrow('Invalid transaction category');
    });

    it('should handle invalid user ID', () => {
      expect(() => service.getUserBalance('')).toThrow();
    });

    it('should handle negative amounts', async () => {
      await expect(
        service.earnCoins('user-1', -100, 'match_win', 'Negative amount')
      ).rejects.toThrow();
    });
  });

  describe('event emission', () => {
    it('should emit events for transactions', async () => {
      return new Promise<void>((resolve) => {
        service.on('transaction', (event) => {
          expect(event.type).toBe('earn');
          expect(event.userId).toBe('user-1');
          resolve();
        });

        service.earnCoins('user-1', 100, 'match_win', 'Test event');
      });
    });

    it('should emit events for balance updates', async () => {
      return new Promise<void>((resolve) => {
        service.on('transaction', (event) => {
          expect(event.type).toBe('earn');
          expect(event.userId).toBe('user-1');
          resolve();
        });

        service.earnCoins('user-1', 100, 'match_win', 'Test balance update');
      });
    });
  });

  describe('branch coverage', () => {
    it('should return zeroed stats and mostUsedCategory "none" when no transactions', () => {
      const stats = service.getTransactionStats('fresh-user');
      expect(stats.totalTransactions).toBe(0);
      expect(stats.totalEarned).toBe(0);
      expect(stats.totalSpent).toBe(0);
      expect(stats.averageTransaction).toBe(0);
      expect(stats.mostUsedCategory).toBe('none');
    });

    it('should upgrade to diamond and set rankProgress to 100', async () => {
      await service.earnCoins(
        'user-diamond',
        35000,
        'achievement',
        'Big achieve'
      );
      const earningsLeaderboard = service.getEarningsLeaderboard(5);
      const profile = earningsLeaderboard.find(
        (p) => p.userId === 'user-diamond'
      );
      expect(profile).toBeDefined();
      expect(profile!.rank).toBe('diamond');
      expect(profile!.rankProgress).toBe(100);
    });

    it('should respect getUserTransactions limit parameter', async () => {
      await service.earnCoins('user-limit', 100, 'match_win', 't1');
      await service.spendCoins('user-limit', 10, 'avatar_upgrade', 't2');
      await service.earnCoins('user-limit', 50, 'match_win', 't3');
      const tx = service.getUserTransactions('user-limit', 1);
      expect(tx).toHaveLength(1);
    });
  });
});
