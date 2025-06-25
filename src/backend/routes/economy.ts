import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';

const router = Router();

// Mock data for economy
const userBalances = new Map<string, number>([
  ['user-1', 1250.75],
  ['user-2', 850.25],
  ['user-3', 2100.50],
]);

const transactions = new Map<string, any[]>([
  ['user-1', [
    {
      id: 'tx-001',
      type: 'transfer',
      amount: 100,
      from: 'user-1',
      to: 'user-2',
      description: 'Test transfer',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      status: 'completed'
    }
  ]],
  ['user-2', [
    {
      id: 'tx-002',
      type: 'received',
      amount: 100,
      from: 'user-1',
      to: 'user-2',
      description: 'Test transfer',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      status: 'completed'
    }
  ]],
  ['user-3', []]
]);

// Validation middleware
const validateRequest = (req: Request, res: Response, next: Function) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

// GET /economy/balance/:userId - Get user balance
router.get('/economy/balance/:userId', 
  param('userId').isString().notEmpty().withMessage('User ID is required'),
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const balance = userBalances.get(userId) || 0;

      res.json({
        success: true,
        userId,
        balance,
        currency: 'Dojo Coin',
        lastTransactionDate: new Date(Date.now() - 86400000).toISOString(),
      });
    } catch (error) {
      console.error('Error fetching user balance:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch user balance',
      });
    }
  }
);

// GET /economy/transactions/:userId - Get user transactions
router.get('/economy/transactions/:userId',
  param('userId').isString().notEmpty().withMessage('User ID is required'),
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const userTransactions = transactions.get(userId) || [];

      res.json(userTransactions);
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch user transactions',
      });
    }
  }
);

// POST /economy/transfer - Transfer coins between users
router.post('/economy/transfer',
  [
    body('fromUserId').isString().notEmpty().withMessage('From user ID is required'),
    body('toUserId').isString().notEmpty().withMessage('To user ID is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('description').optional().isString(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { fromUserId, toUserId, amount, description } = req.body;

      // Check if users exist
      const fromBalance = userBalances.get(fromUserId);
      const toBalance = userBalances.get(toUserId);

      if (fromBalance === undefined) {
        return res.status(404).json({
          success: false,
          error: 'From user not found',
        });
      }

      if (toBalance === undefined) {
        return res.status(404).json({
          success: false,
          error: 'To user not found',
        });
      }

      // Check if user has sufficient balance
      if (fromBalance < amount) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient balance',
          currentBalance: fromBalance,
          requiredAmount: amount,
        });
      }

      // Perform transfer
      const newFromBalance = fromBalance - amount;
      const newToBalance = toBalance + amount;

      userBalances.set(fromUserId, newFromBalance);
      userBalances.set(toUserId, newToBalance);

      // Create transaction records
      const transactionId = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();

      const fromTransaction = {
        id: transactionId,
        type: 'transfer',
        amount: -amount,
        from: fromUserId,
        to: toUserId,
        description: description || 'Transfer',
        timestamp,
        status: 'completed'
      };

      const toTransaction = {
        id: transactionId,
        type: 'received',
        amount: amount,
        from: fromUserId,
        to: toUserId,
        description: description || 'Transfer',
        timestamp,
        status: 'completed'
      };

      // Add transactions to user histories
      const fromTransactions = transactions.get(fromUserId) || [];
      const toTransactions = transactions.get(toUserId) || [];

      fromTransactions.push(fromTransaction);
      toTransactions.push(toTransaction);

      transactions.set(fromUserId, fromTransactions);
      transactions.set(toUserId, toTransactions);

      res.json({
        success: true,
        transactionHash: transactionId,
        fromUserId,
        toUserId,
        amount,
        newFromBalance,
        newToBalance,
        timestamp,
      });
    } catch (error) {
      console.error('Error processing transfer:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to process transfer',
      });
    }
  }
);

// GET /economy/leaderboard - Get leaderboard
router.get('/economy/leaderboard', async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = Math.min(parseInt(limit as string) || 10, 100);

    // Convert balances to array and sort by balance
    const leaderboard = Array.from(userBalances.entries())
      .map(([userId, balance]) => ({
        userId,
        balance,
        rank: 0, // Will be set below
      }))
      .sort((a, b) => b.balance - a.balance)
      .slice(0, limitNum)
      .map((user, index) => ({
        ...user,
        rank: index + 1,
      }));

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch leaderboard',
    });
  }
});

export default router; 