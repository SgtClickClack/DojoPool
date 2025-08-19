import { useState, useEffect, useCallback, useRef } from 'react';
import AdvancedAIRefereeRuleEnforcementService, {
  type RuleViolation,
  type RuleInterpretation,
  type StrategyAnalysis,
  type PerformanceAssessment,
  type AIRefereeConfig,
  type AIRefereeMetrics,
} from '../services/ai/AdvancedAIRefereeRuleEnforcementService';

interface UseAdvancedAIRefereeRuleEnforcementReturn {
  // Service state
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // Data state
  violations: RuleViolation[];
  ruleInterpretations: RuleInterpretation[];
  strategyAnalyses: StrategyAnalysis[];
  performanceAssessments: PerformanceAssessment[];
  config: AIRefereeConfig;
  metrics: AIRefereeMetrics;

  // Violation methods
  detectViolation: (
    violationData: Omit<RuleViolation, 'id' | 'timestamp' | 'status'>
  ) => Promise<RuleViolation>;
  getViolations: (matchId?: string) => RuleViolation[];
  appealDecision: (
    violationId: string,
    appealReason: string
  ) => Promise<boolean>;

  // Rule interpretation methods
  interpretRule: (ruleCode: string) => Promise<RuleInterpretation>;
  getRuleInterpretations: () => RuleInterpretation[];

  // Strategy analysis methods
  analyzeStrategy: (
    analysisData: Omit<StrategyAnalysis, 'id' | 'timestamp'>
  ) => Promise<StrategyAnalysis>;
  getStrategyAnalyses: (matchId?: string) => StrategyAnalysis[];

  // Performance assessment methods
  assessPerformance: (
    assessmentData: Omit<PerformanceAssessment, 'id' | 'timestamp'>
  ) => Promise<PerformanceAssessment>;
  getPerformanceAssessments: (matchId?: string) => PerformanceAssessment[];

  // Configuration methods
  updateConfig: (newConfig: Partial<AIRefereeConfig>) => Promise<void>;
  getConfig: () => AIRefereeConfig;

  // Metrics methods
  getMetrics: () => AIRefereeMetrics;

  // Utility methods
  refreshData: () => void;
  clearError: () => void;
}

export const useAdvancedAIRefereeRuleEnforcement =
  (): UseAdvancedAIRefereeRuleEnforcementReturn => {
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [violations, setViolations] = useState<RuleViolation[]>([]);
    const [ruleInterpretations, setRuleInterpretations] = useState<
      RuleInterpretation[]
    >([]);
    const [strategyAnalyses, setStrategyAnalyses] = useState<
      StrategyAnalysis[]
    >([]);
    const [performanceAssessments, setPerformanceAssessments] = useState<
      PerformanceAssessment[]
    >([]);
    const [config, setConfig] = useState<AIRefereeConfig>({
      enableRealTimeAnalysis: true,
      enablePredictiveDecisions: true,
      enableRuleLearning: true,
      confidenceThreshold: 80,
      enableAppeals: true,
      ruleSet: 'tournament',
      aiModel: 'sky_t1',
    });
    const [metrics, setMetrics] = useState<AIRefereeMetrics>({
      totalDecisions: 0,
      decisionsByType: {},
      averageConfidence: 0,
      appealRate: 0,
      overturnedDecisions: 0,
      analysisAccuracy: 95.5,
      responseTime: 150,
      lastUpdated: new Date(),
    });

    const serviceRef = useRef<AdvancedAIRefereeRuleEnforcementService | null>(
      null
    );
    const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize service and event listeners
    useEffect(() => {
      const initializeService = () => {
        try {
          const service = AdvancedAIRefereeRuleEnforcementService.getInstance();
          serviceRef.current = service;

          // Set initial connection status
          setIsConnected(service.getConnectionStatus());

          // Set up event listeners
          service.on('violationDetected', (violation: RuleViolation) => {
            setViolations((prev) => [violation, ...prev]);
          });

          service.on(
            'ruleInterpreted',
            (interpretation: RuleInterpretation) => {
              setRuleInterpretations((prev) => [interpretation, ...prev]);
            }
          );

          service.on('strategyAnalyzed', (analysis: StrategyAnalysis) => {
            setStrategyAnalyses((prev) => [analysis, ...prev]);
          });

          service.on(
            'performanceAssessed',
            (assessment: PerformanceAssessment) => {
              setPerformanceAssessments((prev) => [assessment, ...prev]);
            }
          );

          service.on('configUpdated', (newConfig: AIRefereeConfig) => {
            setConfig(newConfig);
          });

          // Load initial data
          loadInitialData();

          // Set up periodic refresh
          setupPeriodicRefresh();
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to initialize AI Referee service'
          );
        }
      };

      initializeService();

      return () => {
        // Cleanup event listeners and intervals
        if (serviceRef.current) {
          serviceRef.current.removeAllListeners();
        }
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }, []);

    const loadInitialData = useCallback(async () => {
      if (!serviceRef.current) return;

      try {
        setIsLoading(true);
        setError(null);

        // Load all data in parallel
        const [
          violationsData,
          interpretationsData,
          analysesData,
          assessmentsData,
          configData,
          metricsData,
        ] = await Promise.all([
          Promise.resolve(serviceRef.current.getViolations()),
          Promise.resolve(serviceRef.current.getRuleInterpretations()),
          Promise.resolve(serviceRef.current.getStrategyAnalyses()),
          Promise.resolve(serviceRef.current.getPerformanceAssessments()),
          Promise.resolve(serviceRef.current.getConfig()),
          Promise.resolve(serviceRef.current.getMetrics()),
        ]);

        setViolations(violationsData);
        setRuleInterpretations(interpretationsData);
        setStrategyAnalyses(analysesData);
        setPerformanceAssessments(assessmentsData);
        setConfig(configData);
        setMetrics(metricsData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load initial data'
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

    const setupPeriodicRefresh = useCallback(() => {
      // Refresh metrics every 30 seconds
      refreshIntervalRef.current = setInterval(() => {
        if (serviceRef.current) {
          const newMetrics = serviceRef.current.getMetrics();
          setMetrics(newMetrics);
        }
      }, 30000);
    }, []);

    // Violation methods
    const detectViolation = useCallback(
      async (
        violationData: Omit<RuleViolation, 'id' | 'timestamp' | 'status'>
      ): Promise<RuleViolation> => {
        if (!serviceRef.current) {
          throw new Error('Service not initialized');
        }

        try {
          setIsLoading(true);
          setError(null);

          const violation =
            await serviceRef.current.detectViolation(violationData);
          return violation;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : 'Failed to detect violation';
          setError(errorMessage);
          throw new Error(errorMessage);
        } finally {
          setIsLoading(false);
        }
      },
      []
    );

    const getViolations = useCallback((matchId?: string): RuleViolation[] => {
      if (!serviceRef.current) return [];
      return serviceRef.current.getViolations(matchId);
    }, []);

    const appealDecision = useCallback(
      async (violationId: string, appealReason: string): Promise<boolean> => {
        if (!serviceRef.current) {
          throw new Error('Service not initialized');
        }

        try {
          setIsLoading(true);
          setError(null);

          const success = await serviceRef.current.appealDecision(
            violationId,
            appealReason
          );
          return success;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : 'Failed to appeal decision';
          setError(errorMessage);
          throw new Error(errorMessage);
        } finally {
          setIsLoading(false);
        }
      },
      []
    );

    // Rule interpretation methods
    const interpretRule = useCallback(
      async (ruleCode: string): Promise<RuleInterpretation> => {
        if (!serviceRef.current) {
          throw new Error('Service not initialized');
        }

        try {
          setIsLoading(true);
          setError(null);

          const interpretation =
            await serviceRef.current.interpretRule(ruleCode);
          return interpretation;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : 'Failed to interpret rule';
          setError(errorMessage);
          throw new Error(errorMessage);
        } finally {
          setIsLoading(false);
        }
      },
      []
    );

    const getRuleInterpretations = useCallback((): RuleInterpretation[] => {
      if (!serviceRef.current) return [];
      return serviceRef.current.getRuleInterpretations();
    }, []);

    // Strategy analysis methods
    const analyzeStrategy = useCallback(
      async (
        analysisData: Omit<StrategyAnalysis, 'id' | 'timestamp'>
      ): Promise<StrategyAnalysis> => {
        if (!serviceRef.current) {
          throw new Error('Service not initialized');
        }

        try {
          setIsLoading(true);
          setError(null);

          const analysis =
            await serviceRef.current.analyzeStrategy(analysisData);
          return analysis;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : 'Failed to analyze strategy';
          setError(errorMessage);
          throw new Error(errorMessage);
        } finally {
          setIsLoading(false);
        }
      },
      []
    );

    const getStrategyAnalyses = useCallback(
      (matchId?: string): StrategyAnalysis[] => {
        if (!serviceRef.current) return [];
        return serviceRef.current.getStrategyAnalyses(matchId);
      },
      []
    );

    // Performance assessment methods
    const assessPerformance = useCallback(
      async (
        assessmentData: Omit<PerformanceAssessment, 'id' | 'timestamp'>
      ): Promise<PerformanceAssessment> => {
        if (!serviceRef.current) {
          throw new Error('Service not initialized');
        }

        try {
          setIsLoading(true);
          setError(null);

          const assessment =
            await serviceRef.current.assessPerformance(assessmentData);
          return assessment;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : 'Failed to assess performance';
          setError(errorMessage);
          throw new Error(errorMessage);
        } finally {
          setIsLoading(false);
        }
      },
      []
    );

    const getPerformanceAssessments = useCallback(
      (matchId?: string): PerformanceAssessment[] => {
        if (!serviceRef.current) return [];
        return serviceRef.current.getPerformanceAssessments(matchId);
      },
      []
    );

    // Configuration methods
    const updateConfig = useCallback(
      async (newConfig: Partial<AIRefereeConfig>): Promise<void> => {
        if (!serviceRef.current) {
          throw new Error('Service not initialized');
        }

        try {
          setIsLoading(true);
          setError(null);

          await serviceRef.current.updateConfig(newConfig);
        } catch (err) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : 'Failed to update configuration';
          setError(errorMessage);
          throw new Error(errorMessage);
        } finally {
          setIsLoading(false);
        }
      },
      []
    );

    const getConfig = useCallback((): AIRefereeConfig => {
      if (!serviceRef.current) return config;
      return serviceRef.current.getConfig();
    }, [config]);

    // Metrics methods
    const getMetrics = useCallback((): AIRefereeMetrics => {
      if (!serviceRef.current) return metrics;
      return serviceRef.current.getMetrics();
    }, [metrics]);

    // Utility methods
    const refreshData = useCallback(() => {
      loadInitialData();
    }, [loadInitialData]);

    const clearError = useCallback(() => {
      setError(null);
    }, []);

    return {
      // Service state
      isConnected,
      isLoading,
      error,

      // Data state
      violations,
      ruleInterpretations,
      strategyAnalyses,
      performanceAssessments,
      config,
      metrics,

      // Violation methods
      detectViolation,
      getViolations,
      appealDecision,

      // Rule interpretation methods
      interpretRule,
      getRuleInterpretations,

      // Strategy analysis methods
      analyzeStrategy,
      getStrategyAnalyses,

      // Performance assessment methods
      assessPerformance,
      getPerformanceAssessments,

      // Configuration methods
      updateConfig,
      getConfig,

      // Metrics methods
      getMetrics,

      // Utility methods
      refreshData,
      clearError,
    };
  };

export default useAdvancedAIRefereeRuleEnforcement;
