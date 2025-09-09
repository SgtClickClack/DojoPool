import { Test, TestingModule } from '@nestjs/testing';
import { TradeStatus } from '@prisma/client';
import { TradingController } from './trading.controller';
import { TradingService } from './trading.service';

const mockTradingService = {
  proposeTrade: jest.fn(),
  respondToTrade: jest.fn(),
  getPendingTrades: jest.fn(),
  getTradeHistory: jest.fn(),
  cancelTrade: jest.fn(),
};

describe('TradingController', () => {
  let controller: TradingController;
  let service: typeof mockTradingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TradingController],
      providers: [
        {
          provide: TradingService,
          useValue: mockTradingService,
        },
      ],
    }).compile();

    controller = module.get<TradingController>(TradingController);
    service = module.get(TradingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('proposeTrade', () => {
    it('should create trade proposal and return result', async () => {
      const proposal = {
        proposerId: 'user1',
        recipientId: 'user2',
        proposerCoins: 100,
        recipientCoins: 50,
        message: 'Great trade!',
      };
      const mockTrade = {
        id: 'trade1',
        ...proposal,
        status: TradeStatus.PENDING,
      };

      mockTradingService.proposeTrade.mockResolvedValue(mockTrade);

      const result = await controller.proposeTrade(proposal);

      expect(result).toEqual(mockTrade);
      expect(mockTradingService.proposeTrade).toHaveBeenCalledWith(proposal);
    });
  });

  describe('respondToTrade', () => {
    it('should accept trade and return updated trade', async () => {
      const response = {
        tradeId: 'trade1',
        userId: 'user2',
        accept: true,
      };
      const mockTrade = { id: 'trade1', status: TradeStatus.ACCEPTED };

      mockTradingService.respondToTrade.mockResolvedValue(mockTrade);

      const result = await controller.respondToTrade(response);

      expect(result).toEqual(mockTrade);
      expect(mockTradingService.respondToTrade).toHaveBeenCalledWith(response);
    });

    it('should reject trade and return updated trade', async () => {
      const response = {
        tradeId: 'trade1',
        userId: 'user2',
        accept: false,
      };
      const mockTrade = { id: 'trade1', status: TradeStatus.REJECTED };

      mockTradingService.respondToTrade.mockResolvedValue(mockTrade);

      const result = await controller.respondToTrade(response);

      expect(result).toEqual(mockTrade);
      expect(mockTradingService.respondToTrade).toHaveBeenCalledWith(response);
    });
  });

  describe('getPendingTrades', () => {
    it('should return pending trades for user', async () => {
      const mockTrades = [
        {
          id: 'trade1',
          proposerId: 'user1',
          recipientId: 'user2',
          status: TradeStatus.PENDING,
        },
      ];

      mockTradingService.getPendingTrades.mockResolvedValue(mockTrades);

      const result = await controller.getPendingTrades('user1');

      expect(result).toEqual(mockTrades);
      expect(mockTradingService.getPendingTrades).toHaveBeenCalledWith('user1');
    });
  });

  describe('getTradeHistory', () => {
    it('should return trade history for user', async () => {
      const mockTrades = [
        {
          id: 'trade1',
          proposerId: 'user1',
          recipientId: 'user2',
          status: TradeStatus.ACCEPTED,
        },
      ];

      mockTradingService.getTradeHistory.mockResolvedValue(mockTrades);

      const result = await controller.getTradeHistory('user1');

      expect(result).toEqual(mockTrades);
      expect(mockTradingService.getTradeHistory).toHaveBeenCalledWith('user1');
    });
  });

  describe('cancelTrade', () => {
    it('should cancel trade and return updated trade', async () => {
      const mockTrade = { id: 'trade1', status: TradeStatus.CANCELLED };

      mockTradingService.cancelTrade.mockResolvedValue(mockTrade);

      const result = await controller.cancelTrade('trade1', 'user1');

      expect(result).toEqual(mockTrade);
      expect(mockTradingService.cancelTrade).toHaveBeenCalledWith(
        'trade1',
        'user1'
      );
    });
  });
});
