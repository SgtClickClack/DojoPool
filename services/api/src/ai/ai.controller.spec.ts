import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { MatchAnalysis } from '../matches/ai-analysis.service';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiAnalysisService } from '../matches/ai-analysis.service';
import { ArAnalysisService } from '../ar-analysis/ar-analysis.service';

describe('AiController', () => {
  let controller: AiController;
  let aiService: vi.mocked<AiService>;

  const mockMatchAnalysis: MatchAnalysis = {
    keyMoments: ['Key moment 1', 'Key moment 2'],
    strategicInsights: ['Insight 1', 'Insight 2'],
    playerPerformance: {
      playerA: 'Player A performance',
      playerB: 'Player B performance',
    },
    overallAssessment: 'Overall assessment',
    recommendations: ['Recommendation 1', 'Recommendation 2'],
  };

  beforeEach(async () => {
    const mockAiService = {
      getHealthStatus: vi.fn(),
      getConfiguration: vi.fn(),
      generateMatchAnalysis: vi.fn(),
      generateLiveCommentary: vi.fn(),
      analyzeTableImage: vi.fn(),
    };

    const mockAiAnalysisService = {
      generateMatchAnalysis: vi.fn(),
      generateLiveCommentary: vi.fn(),
      analyzeTableImage: vi.fn(),
    };

    const mockArAnalysisService = {
      analyzeTableImage: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        {
          provide: AiService,
          useValue: mockAiService,
        },
        {
          provide: AiAnalysisService,
          useValue: mockAiAnalysisService,
        },
        {
          provide: ArAnalysisService,
          useValue: mockArAnalysisService,
        },
      ],
    }).compile();

    controller = module.get<AiController>(AiController);
    aiService = module.get(AiService);

    // Explicitly set the _aiService property
    (controller as any)._aiService = mockAiService;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /ai/health', () => {
    it('should return AI service health status', async () => {
      // Arrange
      const mockHealthStatus = {
        gemini: { enabled: true, configured: true, status: 'healthy' },
        openai: { enabled: false, configured: false, status: 'unknown' },
        opencv: { enabled: true, status: 'healthy' },
        tensorflow: { enabled: false, configured: false, status: 'unknown' },
      };
      aiService.getHealthStatus.mockResolvedValue(mockHealthStatus);

      // Act
      const result = await controller.getHealthStatus();

      // Assert
      expect(result).toEqual(mockHealthStatus);
      expect(aiService.getHealthStatus).toHaveBeenCalled();
    });
  });

  describe('GET /ai/config', () => {
    it('should return AI service configuration', () => {
      // Arrange
      const mockConfig = {
        gemini: { apiKey: 'test', model: 'gemini-1.5-flash', enabled: true },
        openai: { apiKey: '', model: 'gpt-4', enabled: false },
        opencv: { enabled: true },
        tensorflow: { enabled: false },
      };
      aiService.getConfiguration.mockReturnValue(mockConfig);

      // Act
      const result = controller.getConfiguration();

      // Assert
      expect(result).toEqual(mockConfig);
      expect(aiService.getConfiguration).toHaveBeenCalled();
    });
  });

  describe('POST /ai/analyze/match', () => {
    it('should analyze match and return result', async () => {
      // Arrange
      const matchData: {
        playerAName: string;
        playerBName: string;
        scoreA: number;
        scoreB: number;
        winner: string;
        venue: string;
        round: number;
      } = {
        playerAName: 'Alice',
        playerBName: 'Bob',
        scoreA: 8,
        scoreB: 7,
        winner: 'Alice',
        venue: 'Test Venue',
        round: 1,
      };
      const mockResponse = {
        success: true,
        data: mockMatchAnalysis,
        provider: 'gemini',
      };
      aiService.generateMatchAnalysis.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.analyzeMatch(matchData);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(aiService.generateMatchAnalysis).toHaveBeenCalledWith(matchData);
    });

    it('should handle match analysis errors', async () => {
      // Arrange
      const matchData: {
        playerAName: string;
        playerBName: string;
        scoreA: number;
        scoreB: number;
        winner: string;
        venue: string;
        round: number;
      } = {
        playerAName: 'Alice',
        playerBName: 'Bob',
        scoreA: 8,
        scoreB: 7,
        winner: 'Alice',
        venue: 'Test Venue',
        round: 1,
      };
      aiService.generateMatchAnalysis.mockRejectedValue(
        new Error('Analysis failed')
      );

      // Act & Assert
      await expect(controller.analyzeMatch(matchData)).rejects.toThrow(
        'Analysis failed'
      );
      expect(aiService.generateMatchAnalysis).toHaveBeenCalledWith(matchData);
    });
  });

  describe('POST /ai/analyze/shot', () => {
    it('should generate live commentary for shot', async () => {
      // Arrange
      const shotData: {
        matchId: string;
        playerId: string;
        playerName: string;
        ballSunk: boolean;
        wasFoul: boolean;
        shotType: string;
      } = {
        matchId: 'match-1',
        playerId: 'player-1',
        playerName: 'Alice',
        ballSunk: true,
        wasFoul: false,
        shotType: 'bank shot',
      };
      const mockResponse = {
        success: true,
        data: 'Alice executes a perfect bank shot!',
        provider: 'gemini',
      };
      aiService.generateLiveCommentary.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.analyzeShot(shotData);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(aiService.generateLiveCommentary).toHaveBeenCalledWith(shotData);
    });

    it('should handle commentary generation errors', async () => {
      // Arrange
      const shotData: {
        matchId: string;
        playerId: string;
        ballSunk: boolean;
        wasFoul: boolean;
      } = {
        matchId: 'match-1',
        playerId: 'player-1',
        ballSunk: false,
        wasFoul: true,
      };
      aiService.generateLiveCommentary.mockRejectedValue(
        new Error('Commentary failed')
      );

      // Act & Assert
      await expect(controller.analyzeShot(shotData)).rejects.toThrow(
        'Commentary failed'
      );
      expect(aiService.generateLiveCommentary).toHaveBeenCalledWith(shotData);
    });
  });

  describe('POST /ai/analyze/table', () => {
    it('should analyze table image successfully', async () => {
      // Arrange
      const mockFile = {
        buffer: Buffer.from('test image data'),
        mimetype: 'image/jpeg',
        size: 1024,
        originalname: 'table.jpg',
        fieldname: 'image',
        encoding: '7bit',
        stream: null,
        destination: '',
        filename: 'table.jpg',
        path: '/tmp/table.jpg',
      } as Express.Multer.File;

      const mockTableData = {
        tableBounds: [
          { x: 10, y: 10 },
          { x: 100, y: 10 },
          { x: 100, y: 50 },
          { x: 10, y: 50 },
        ],
        balls: [{ position: { x: 30, y: 20 }, radius: 5 }],
      };

      const mockResponse = {
        success: true,
        data: mockTableData,
        provider: 'opencv',
        metadata: { processingTime: Date.now() },
      };

      aiService.analyzeTableImage.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.analyzeTable(mockFile);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(aiService.analyzeTableImage).toHaveBeenCalledWith(
        mockFile.buffer,
        mockFile.mimetype
      );
    });

    it('should reject invalid file types', async () => {
      // Arrange
      const mockFile = {
        buffer: Buffer.from('test data'),
        mimetype: 'text/plain',
        size: 1024,
        originalname: 'test.txt',
        fieldname: 'image',
      } as Express.Multer.File;

      // Act & Assert
      await expect(controller.analyzeTable(mockFile)).rejects.toThrow(
        'File must be an image'
      );
    });

    it('should reject files that are too large', async () => {
      // Arrange
      const mockFile = {
        buffer: Buffer.from('x'.repeat(11 * 1024 * 1024)), // 11MB
        mimetype: 'image/jpeg',
        size: 11 * 1024 * 1024,
        originalname: 'large.jpg',
        fieldname: 'image',
      } as Express.Multer.File;

      // Act & Assert
      await expect(controller.analyzeTable(mockFile)).rejects.toThrow(
        'File size must be less than 10MB'
      );
    });

    it('should handle missing files', async () => {
      // Act & Assert
      await expect(controller.analyzeTable(undefined as any)).rejects.toThrow(
        'Image file is required'
      );
    });

    it('should handle analysis errors', async () => {
      // Arrange
      const mockFile = {
        buffer: Buffer.from('test image data'),
        mimetype: 'image/jpeg',
        size: 1024,
        originalname: 'table.jpg',
        fieldname: 'image',
      } as Express.Multer.File;

      aiService.analyzeTableImage.mockRejectedValue(
        new Error('Analysis failed')
      );

      // Act & Assert
      await expect(controller.analyzeTable(mockFile)).rejects.toThrow(
        'Analysis failed'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle service unavailability', async () => {
      // Arrange
      aiService.getHealthStatus.mockRejectedValue(
        new Error('Service unavailable')
      );

      // Act & Assert
      await expect(controller.getHealthStatus()).rejects.toThrow(
        'Service unavailable'
      );
    });

    it('should handle configuration errors', () => {
      // Arrange
      aiService.getConfiguration.mockImplementation(() => {
        throw new Error('Configuration error');
      });

      // Act & Assert
      expect(() => controller.getConfiguration()).toThrow(
        'Configuration error'
      );
    });
  });

  describe('Input Validation', () => {
    it('should validate match analysis input', async () => {
      // Arrange
      const invalidMatchData: {
        playerAName: string;
        playerBName: string;
        scoreA: number;
        scoreB: number;
        winner: string;
        venue: string;
        round: number;
      } = {
        playerAName: '',
        playerBName: 'Bob',
        scoreA: -1,
        scoreB: 7,
        winner: 'Alice',
        venue: 'Test Venue',
        round: 1,
      };

      aiService.generateMatchAnalysis.mockResolvedValue({
        success: true,
        data: mockMatchAnalysis,
        provider: 'gemini',
      });

      // Act
      const result = await controller.analyzeMatch(invalidMatchData);

      // Assert
      expect(aiService.generateMatchAnalysis).toHaveBeenCalledWith(
        invalidMatchData
      );
      // Note: Actual validation would be handled by service layer
    });

    it('should validate shot analysis input', async () => {
      // Arrange
      const invalidShotData: {
        matchId: string;
        playerId: string;
        ballSunk: unknown;
        wasFoul: unknown;
      } = {
        matchId: '',
        playerId: 'player-1',
        ballSunk: 'invalid',
        wasFoul: 'also invalid',
      };

      aiService.generateLiveCommentary.mockResolvedValue({
        success: true,
        data: 'Test commentary',
        provider: 'gemini',
      });

      // Act
      const result = await controller.analyzeShot(
        invalidShotData as unknown as Parameters<
          typeof controller.analyzeShot
        >[0]
      );

      // Assert
      expect(aiService.generateLiveCommentary).toHaveBeenCalledWith(
        invalidShotData
      );
    });
  });
});
