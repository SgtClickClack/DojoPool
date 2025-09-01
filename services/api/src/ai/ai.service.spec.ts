import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ArAnalysisService } from '../ar-analysis/ar-analysis.service';
import {
  AiAnalysisService,
  MatchAnalysis,
} from '../matches/ai-analysis.service';
import { AiService } from './ai.service';

describe('AiService', () => {
  let service: AiService;
  let aiAnalysisService: jest.Mocked<AiAnalysisService>;
  let arAnalysisService: jest.Mocked<ArAnalysisService>;
  let configService: jest.Mocked<ConfigService>;

  const mockMatchData = {
    playerAName: 'Alice',
    playerBName: 'Bob',
    scoreA: 8,
    scoreB: 7,
    winner: 'Alice',
    venue: 'Test Pool Hall',
    round: 1,
  };

  const mockMatchAnalysis: MatchAnalysis = {
    keyMoments: ['Alice won the break', 'Bob made a great safety'],
    strategicInsights: ['Positioning was crucial', 'Safety play was effective'],
    playerPerformance: {
      playerA: 'Excellent break and positioning',
      playerB: 'Strong safety game but missed opportunities',
    },
    overallAssessment: 'A competitive match with strategic depth',
    recommendations: [
      'Work on break consistency',
      'Practice safety techniques',
    ],
  };

  const mockShotData = {
    matchId: 'match-1',
    playerId: 'player-1',
    playerName: 'Alice',
    ballSunk: true,
    wasFoul: false,
    shotType: 'bank shot',
  };

  beforeEach(async () => {
    const mockAiAnalysisService = {
      generateMatchAnalysis: jest.fn(),
      getLiveCommentary: jest.fn(),
    };

    const mockArAnalysisService = {
      analyzeTableImage: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: AiAnalysisService,
          useValue: mockAiAnalysisService,
        },
        {
          provide: ArAnalysisService,
          useValue: mockArAnalysisService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    aiAnalysisService = module.get(AiAnalysisService);
    arAnalysisService = module.get(ArAnalysisService);
    configService = module.get(ConfigService);
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should load configuration correctly', () => {
      // Mock environment variables
      configService.get
        .mockReturnValueOnce('test-gemini-key')
        .mockReturnValueOnce('gemini-1.5-flash')
        .mockReturnValueOnce('test-openai-key')
        .mockReturnValueOnce('gpt-4')
        .mockReturnValueOnce(true) // opencv enabled
        .mockReturnValueOnce(false); // tensorflow disabled

      const config = (service as any).loadConfiguration();

      expect(config.gemini.apiKey).toBe('test-gemini-key');
      expect(config.gemini.model).toBe('gemini-1.5-flash');
      expect(config.gemini.enabled).toBe(true);
      expect(config.openai.apiKey).toBe('test-openai-key');
      expect(config.openai.enabled).toBe(true);
      expect(config.opencv.enabled).toBe(true);
      expect(config.tensorflow.enabled).toBe(false);
    });
  });

  describe('generateMatchAnalysis', () => {
    beforeEach(() => {
      // Setup default config mocks
      configService.get
        .mockReturnValueOnce('test-gemini-key') // gemini api key
        .mockReturnValueOnce('gemini-1.5-flash') // gemini model
        .mockReturnValueOnce('') // openai api key (disabled)
        .mockReturnValueOnce('gpt-4') // openai model
        .mockReturnValueOnce(true) // opencv enabled
        .mockReturnValueOnce(false); // tensorflow disabled
    });

    it('should generate match analysis successfully with Gemini', async () => {
      // Arrange
      aiAnalysisService.generateMatchAnalysis.mockResolvedValue(
        mockMatchAnalysis
      );

      // Act
      const result = await service.generateMatchAnalysis(mockMatchData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMatchAnalysis);
      expect(result.provider).toBe('gemini');
      expect(aiAnalysisService.generateMatchAnalysis).toHaveBeenCalledWith(
        mockMatchData
      );
    });

    it('should fallback when Gemini fails', async () => {
      // Arrange
      configService.get
        .mockReturnValueOnce('') // no gemini key
        .mockReturnValueOnce('gemini-1.5-flash')
        .mockReturnValueOnce('') // no openai key
        .mockReturnValueOnce('gpt-4')
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      aiAnalysisService.generateMatchAnalysis.mockRejectedValue(
        new Error('Gemini failed')
      );

      // Act
      const result = await service.generateMatchAnalysis(mockMatchData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.fallback).toBe(true);
      expect(result.provider).toBe('fallback');
      expect(result.data).toBeDefined();
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      configService.get
        .mockReturnValueOnce('test-gemini-key')
        .mockReturnValueOnce('gemini-1.5-flash')
        .mockReturnValueOnce('')
        .mockReturnValueOnce('gpt-4')
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      aiAnalysisService.generateMatchAnalysis.mockRejectedValue(
        new Error('Service unavailable')
      );

      // Act
      const result = await service.generateMatchAnalysis(mockMatchData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.fallback).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('generateLiveCommentary', () => {
    beforeEach(() => {
      configService.get
        .mockReturnValueOnce('test-gemini-key')
        .mockReturnValueOnce('gemini-1.5-flash')
        .mockReturnValueOnce('')
        .mockReturnValueOnce('gpt-4')
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);
    });

    it('should generate live commentary successfully', async () => {
      // Arrange
      const mockCommentary = 'Alice executes a perfect bank shot!';
      aiAnalysisService.getLiveCommentary.mockResolvedValue(mockCommentary);

      // Act
      const result = await service.generateLiveCommentary(mockShotData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe(mockCommentary);
      expect(result.provider).toBe('gemini');
    });

    it('should handle commentary generation timeout', async () => {
      // Arrange
      aiAnalysisService.getLiveCommentary.mockRejectedValue(
        new Error('Timeout')
      );

      // Act
      const result = await service.generateLiveCommentary(mockShotData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.fallback).toBe(true);
      expect(typeof result.data).toBe('string');
    });
  });

  describe('analyzeTableImage', () => {
    beforeEach(() => {
      configService.get
        .mockReturnValueOnce('test-gemini-key')
        .mockReturnValueOnce('gemini-1.5-flash')
        .mockReturnValueOnce('')
        .mockReturnValueOnce('gpt-4')
        .mockReturnValueOnce(true) // opencv enabled
        .mockReturnValueOnce(false);
    });

    it('should analyze table image successfully', async () => {
      // Arrange
      const mockTableData = {
        tableBounds: [
          { x: 10, y: 10 },
          { x: 100, y: 10 },
          { x: 100, y: 50 },
          { x: 10, y: 50 },
        ],
        balls: [
          { position: { x: 30, y: 20 }, radius: 5 },
          { position: { x: 70, y: 35 }, radius: 5 },
        ],
      };
      arAnalysisService.analyzeTableImage.mockResolvedValue(mockTableData);

      // Act
      const result = await service.analyzeTableImage(
        Buffer.from('test'),
        'image/jpeg'
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTableData);
      expect(result.provider).toBe('opencv');
      expect(result.metadata).toBeDefined();
    });

    it('should handle OpenCV disabled state', async () => {
      // Arrange
      configService.get
        .mockReturnValueOnce('test-gemini-key')
        .mockReturnValueOnce('gemini-1.5-flash')
        .mockReturnValueOnce('')
        .mockReturnValueOnce('gpt-4')
        .mockReturnValueOnce(false) // opencv disabled
        .mockReturnValueOnce(false);

      // Act
      const result = await service.analyzeTableImage(
        Buffer.from('test'),
        'image/jpeg'
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('disabled');
      expect(result.provider).toBe('opencv');
    });

    it('should handle analysis errors gracefully', async () => {
      // Arrange
      arAnalysisService.analyzeTableImage.mockRejectedValue(
        new Error('Analysis failed')
      );

      // Act
      const result = await service.analyzeTableImage(
        Buffer.from('test'),
        'image/jpeg'
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Analysis failed');
      expect(result.provider).toBe('opencv');
    });
  });

  describe('getHealthStatus', () => {
    it('should return health status for all providers', async () => {
      // Arrange
      configService.get
        .mockReturnValueOnce('test-gemini-key')
        .mockReturnValueOnce('gemini-1.5-flash')
        .mockReturnValueOnce('test-openai-key')
        .mockReturnValueOnce('gpt-4')
        .mockReturnValueOnce(true)
        .mockReturnValueOnce('/path/to/model');

      aiAnalysisService.generateMatchAnalysis.mockResolvedValue(
        mockMatchAnalysis
      );
      arAnalysisService.analyzeTableImage.mockResolvedValue({
        tableBounds: [],
        balls: [],
      });

      // Act
      const status = await service.getHealthStatus();

      // Assert
      expect(status).toHaveProperty('gemini');
      expect(status).toHaveProperty('openai');
      expect(status).toHaveProperty('opencv');
      expect(status).toHaveProperty('tensorflow');

      expect(status.gemini.enabled).toBe(true);
      expect(status.gemini.configured).toBe(true);
      expect(status.openai.enabled).toBe(true);
      expect(status.opencv.enabled).toBe(true);
      expect(status.tensorflow.enabled).toBe(false);
    });

    it('should handle service unavailability', async () => {
      // Arrange
      configService.get
        .mockReturnValueOnce('') // no gemini key
        .mockReturnValueOnce('gemini-1.5-flash')
        .mockReturnValueOnce('') // no openai key
        .mockReturnValueOnce('gpt-4')
        .mockReturnValueOnce(false) // opencv disabled
        .mockReturnValueOnce(''); // no tensorflow model

      // Act
      const status = await service.getHealthStatus();

      // Assert
      expect(status.gemini.enabled).toBe(false);
      expect(status.openai.enabled).toBe(false);
      expect(status.opencv.enabled).toBe(false);
      expect(status.tensorflow.enabled).toBe(false);
    });
  });

  describe('Configuration and Utilities', () => {
    it('should return current configuration', () => {
      // Arrange
      configService.get
        .mockReturnValueOnce('test-key')
        .mockReturnValueOnce('model-name')
        .mockReturnValueOnce('')
        .mockReturnValueOnce('gpt-4')
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      // Act
      const config = service.getConfiguration();

      // Assert
      expect(config).toHaveProperty('gemini');
      expect(config).toHaveProperty('openai');
      expect(config).toHaveProperty('opencv');
      expect(config).toHaveProperty('tensorflow');
    });

    it('should check if provider is available', () => {
      // Arrange
      configService.get
        .mockReturnValueOnce('test-key') // gemini available
        .mockReturnValueOnce('model')
        .mockReturnValueOnce('') // openai not available
        .mockReturnValueOnce('gpt-4')
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      // Act & Assert
      expect(service.isProviderAvailable('gemini')).toBe(true);
      expect(service.isProviderAvailable('openai')).toBe(false);
      expect(service.isProviderAvailable('opencv')).toBe(true);
      expect(service.isProviderAvailable('tensorflow')).toBe(false);
    });
  });

  describe('Fallback Analysis', () => {
    it('should generate fallback analysis with proper structure', () => {
      // Act
      const fallback = (service as any).generateFallbackAnalysis(mockMatchData);

      // Assert
      expect(fallback).toHaveProperty('keyMoments');
      expect(fallback).toHaveProperty('strategicInsights');
      expect(fallback).toHaveProperty('playerPerformance');
      expect(fallback).toHaveProperty('overallAssessment');
      expect(fallback).toHaveProperty('recommendations');

      expect(Array.isArray(fallback.keyMoments)).toBe(true);
      expect(Array.isArray(fallback.strategicInsights)).toBe(true);
      expect(Array.isArray(fallback.recommendations)).toBe(true);
      expect(typeof fallback.playerPerformance.playerA).toBe('string');
      expect(typeof fallback.overallAssessment).toBe('string');
    });

    it('should include player names in fallback analysis', () => {
      // Act
      const fallback = (service as any).generateFallbackAnalysis(mockMatchData);

      // Assert
      expect(fallback.playerPerformance.playerA).toContain('Alice');
      expect(fallback.playerPerformance.playerB).toContain('Bob');
      expect(fallback.overallAssessment).toContain('Alice');
    });
  });

  describe('Fallback Commentary', () => {
    it('should generate appropriate fallback commentary for different shot types', () => {
      // Test foul commentary
      const foulShot = { ...mockShotData, wasFoul: true, ballSunk: false };
      const foulCommentary = (service as any).generateFallbackCommentary(
        foulShot
      );
      expect(foulCommentary).toContain('foul');

      // Test ball sunk commentary
      const goodShot = { ...mockShotData, wasFoul: false, ballSunk: true };
      const goodCommentary = (service as any).generateFallbackCommentary(
        goodShot
      );
      expect(goodCommentary).toContain('sinks');

      // Test regular shot commentary
      const regularShot = { ...mockShotData, wasFoul: false, ballSunk: false };
      const regularCommentary = (service as any).generateFallbackCommentary(
        regularShot
      );
      expect(regularCommentary).toContain('shot');
    });

    it('should include player name in commentary when available', () => {
      // Act
      const commentary = (service as any).generateFallbackCommentary(
        mockShotData
      );

      // Assert
      expect(commentary).toContain('Alice');
    });
  });
});
