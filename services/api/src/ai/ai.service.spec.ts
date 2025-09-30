import { vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ArAnalysisService } from '../ar-analysis/ar-analysis.service';
import {
  AiAnalysisService,
  MatchAnalysis,
} from '../matches/ai-analysis.service';
import { AiService } from './ai.service';
import { TestDependencyInjector } from '../__tests__/utils/test-dependency-injector';

describe('AiService', () => {
  let service: AiService;
  let aiAnalysisService: vi.mocked<AiAnalysisService>;
  let arAnalysisService: vi.mocked<ArAnalysisService>;
  let configService: vi.mocked<ConfigService>;

  const mockMatchData: {
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

  const mockShotData: {
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

  beforeEach(async () => {
    const mockAiAnalysisService = {
      generateMatchAnalysis: vi.fn(),
      getLiveCommentary: vi.fn(),
    };

    const mockArAnalysisService = {
      analyzeTableImage: vi.fn(),
    };

    const mockConfigService = {
      get: vi.fn(),
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

    // Manually inject dependencies into the service instance
    TestDependencyInjector.injectDependencies(service, {
      configService: mockConfigService,
      aiAnalysisService: mockAiAnalysisService,
      arAnalysisService: mockArAnalysisService,
    });

    // Re-initialize the service configuration with the mocked config service
    (service as any).config = (service as any).loadConfiguration();
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should load configuration correctly', () => {
      // Mock environment variables
      configService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'GEMINI_API_KEY':
            return 'test-gemini-key';
          case 'GEMINI_MODEL':
            return 'gemini-1.5-flash';
          case 'OPENAI_API_KEY':
            return 'test-openai-key';
          case 'OPENAI_MODEL':
            return 'gpt-4';
          case 'OPENCV_ENABLED':
            return true;
          case 'TENSORFLOW_ENABLED':
            return false;
          default:
            return undefined;
        }
      });

      // Re-inject the updated config service
      TestDependencyInjector.injectDependencies(service, {
        configService: configService,
      });

      // Re-initialize the service configuration with the mocked config service
      (service as any).config = (service as any).loadConfiguration();

      const config = (
        service as unknown as { loadConfiguration: () => any }
      ).loadConfiguration();

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
      configService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'GEMINI_API_KEY':
            return 'test-gemini-key';
          case 'GEMINI_MODEL':
            return 'gemini-1.5-flash';
          case 'OPENAI_API_KEY':
            return '';
          case 'OPENAI_MODEL':
            return 'gpt-4';
          case 'OPENCV_ENABLED':
            return true;
          case 'TENSORFLOW_ENABLED':
            return false;
          default:
            return undefined;
        }
      });

      // Re-inject the updated config service
      TestDependencyInjector.injectDependencies(service, {
        configService: configService,
      });

      // Re-initialize the service configuration with the mocked config service
      (service as any).config = (service as any).loadConfiguration();
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
      configService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'GEMINI_API_KEY':
            return '';
          case 'GEMINI_MODEL':
            return 'gemini-1.5-flash';
          case 'OPENAI_API_KEY':
            return '';
          case 'OPENAI_MODEL':
            return 'gpt-4';
          case 'OPENCV_ENABLED':
            return true;
          case 'TENSORFLOW_ENABLED':
            return false;
          default:
            return undefined;
        }
      });

      // Re-inject the updated config service
      TestDependencyInjector.injectDependencies(service, {
        configService: configService,
      });

      // Re-initialize the service configuration with the mocked config service
      (service as any).config = (service as any).loadConfiguration();

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
      configService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'GEMINI_API_KEY':
            return 'test-gemini-key';
          case 'GEMINI_MODEL':
            return 'gemini-1.5-flash';
          case 'OPENAI_API_KEY':
            return '';
          case 'OPENAI_MODEL':
            return 'gpt-4';
          case 'OPENCV_ENABLED':
            return true;
          case 'TENSORFLOW_ENABLED':
            return false;
          default:
            return undefined;
        }
      });

      // Re-inject the updated config service
      TestDependencyInjector.injectDependencies(service, {
        configService: configService,
      });

      // Re-initialize the service configuration with the mocked config service
      (service as any).config = (service as any).loadConfiguration();

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
      configService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'GEMINI_API_KEY':
            return 'test-gemini-key';
          case 'GEMINI_MODEL':
            return 'gemini-1.5-flash';
          case 'OPENAI_API_KEY':
            return '';
          case 'OPENAI_MODEL':
            return 'gpt-4';
          case 'OPENCV_ENABLED':
            return true;
          case 'TENSORFLOW_ENABLED':
            return false;
          default:
            return undefined;
        }
      });

      // Re-inject the updated config service
      TestDependencyInjector.injectDependencies(service, {
        configService: configService,
      });

      // Re-initialize the service configuration with the mocked config service
      (service as any).config = (service as any).loadConfiguration();
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
      configService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'GEMINI_API_KEY':
            return 'test-gemini-key';
          case 'GEMINI_MODEL':
            return 'gemini-1.5-flash';
          case 'OPENAI_API_KEY':
            return '';
          case 'OPENAI_MODEL':
            return 'gpt-4';
          case 'OPENCV_ENABLED':
            return true;
          case 'TENSORFLOW_ENABLED':
            return false;
          default:
            return undefined;
        }
      });

      // Re-inject the updated config service
      TestDependencyInjector.injectDependencies(service, {
        configService: configService,
      });

      // Re-initialize the service configuration with the mocked config service
      (service as any).config = (service as any).loadConfiguration();
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
      configService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'GEMINI_API_KEY':
            return 'test-gemini-key';
          case 'GEMINI_MODEL':
            return 'gemini-1.5-flash';
          case 'OPENAI_API_KEY':
            return '';
          case 'OPENAI_MODEL':
            return 'gpt-4';
          case 'OPENCV_ENABLED':
            return false; // opencv disabled
          case 'TENSORFLOW_ENABLED':
            return false;
          default:
            return undefined;
        }
      });

      // Re-inject the updated config service
      TestDependencyInjector.injectDependencies(service, {
        configService: configService,
      });

      // Re-initialize the service configuration with the mocked config service
      (service as any).config = (service as any).loadConfiguration();

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
      configService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'GEMINI_API_KEY':
            return 'test-gemini-key';
          case 'GEMINI_MODEL':
            return 'gemini-1.5-flash';
          case 'OPENAI_API_KEY':
            return 'test-openai-key';
          case 'OPENAI_MODEL':
            return 'gpt-4';
          case 'OPENCV_ENABLED':
            return true;
          case 'TENSORFLOW_ENABLED':
            return false;
          case 'TENSORFLOW_MODEL_PATH':
            return '/path/to/model';
          default:
            return undefined;
        }
      });

      // Re-inject the updated config service
      TestDependencyInjector.injectDependencies(service, {
        configService: configService,
      });

      // Re-initialize the service configuration with the mocked config service
      (service as any).config = (service as any).loadConfiguration();

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
      configService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'GEMINI_API_KEY':
            return ''; // no gemini key
          case 'GEMINI_MODEL':
            return 'gemini-1.5-flash';
          case 'OPENAI_API_KEY':
            return ''; // no openai key
          case 'OPENAI_MODEL':
            return 'gpt-4';
          case 'OPENCV_ENABLED':
            return false; // opencv disabled
          case 'TENSORFLOW_ENABLED':
            return false;
          case 'TENSORFLOW_MODEL_PATH':
            return ''; // no tensorflow model
          default:
            return undefined;
        }
      });

      // Re-inject the updated config service
      TestDependencyInjector.injectDependencies(service, {
        configService: configService,
      });

      // Re-initialize the service configuration with the mocked config service
      (service as any).config = (service as any).loadConfiguration();

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
      configService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'GEMINI_API_KEY':
            return 'test-key';
          case 'GEMINI_MODEL':
            return 'model-name';
          case 'OPENAI_API_KEY':
            return '';
          case 'OPENAI_MODEL':
            return 'gpt-4';
          case 'OPENCV_ENABLED':
            return true;
          case 'TENSORFLOW_ENABLED':
            return false;
          default:
            return undefined;
        }
      });

      // Re-inject the updated config service
      TestDependencyInjector.injectDependencies(service, {
        configService: configService,
      });

      // Re-initialize the service configuration with the mocked config service
      (service as any).config = (service as any).loadConfiguration();

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
      configService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'GEMINI_API_KEY':
            return 'test-key'; // gemini available
          case 'GEMINI_MODEL':
            return 'model';
          case 'OPENAI_API_KEY':
            return ''; // openai not available
          case 'OPENAI_MODEL':
            return 'gpt-4';
          case 'OPENCV_ENABLED':
            return true;
          case 'TENSORFLOW_ENABLED':
            return false;
          default:
            return undefined;
        }
      });

      // Re-inject the updated config service
      TestDependencyInjector.injectDependencies(service, {
        configService: configService,
      });

      // Re-initialize the service configuration with the mocked config service
      (service as any).config = (service as any).loadConfiguration();

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
      const fallback = (
        service as unknown as {
          generateFallbackAnalysis: (data: typeof mockMatchData) => any;
        }
      ).generateFallbackAnalysis(mockMatchData);

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
      const fallback = (
        service as unknown as {
          generateFallbackAnalysis: (data: typeof mockMatchData) => any;
        }
      ).generateFallbackAnalysis(mockMatchData);

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
      const foulCommentary = (
        service as unknown as {
          generateFallbackCommentary: (data: typeof mockShotData) => string;
        }
      ).generateFallbackCommentary(foulShot);
      expect(foulCommentary).toContain('foul');

      // Test ball sunk commentary
      const goodShot = { ...mockShotData, wasFoul: false, ballSunk: true };
      const goodCommentary = (
        service as unknown as {
          generateFallbackCommentary: (data: typeof mockShotData) => string;
        }
      ).generateFallbackCommentary(goodShot);
      expect(goodCommentary).toContain('sinks');

      // Test regular shot commentary
      const regularShot = { ...mockShotData, wasFoul: false, ballSunk: false };
      const regularCommentary = (
        service as unknown as {
          generateFallbackCommentary: (data: typeof mockShotData) => string;
        }
      ).generateFallbackCommentary(regularShot);
      expect(regularCommentary).toContain('shot');
    });

    it('should include player name in commentary when available', () => {
      // Act
      const commentary = (
        service as unknown as {
          generateFallbackCommentary: (data: typeof mockShotData) => string;
        }
      ).generateFallbackCommentary(mockShotData);

      // Assert
      expect(commentary).toContain('Alice');
    });
  });
});
