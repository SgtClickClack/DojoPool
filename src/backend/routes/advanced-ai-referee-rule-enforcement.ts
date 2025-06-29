import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import AdvancedAIRefereeRuleEnforcementService from '../../services/ai/AdvancedAIRefereeRuleEnforcementService';

const router = express.Router();
const aiRefereeService = AdvancedAIRefereeRuleEnforcementService.getInstance();

// Async error handler wrapper
const handleAsync = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Health check endpoint
router.get('/health', handleAsync(async (req: Request, res: Response) => {
  try {
    const config = aiRefereeService.getConfig();
    const metrics = aiRefereeService.getMetrics();

    res.json({
      success: true,
      status: 'healthy',
      data: {
        enabled: config.enableRealTimeAnalysis,
        totalDecisions: metrics.totalDecisions,
        averageConfidence: metrics.averageConfidence,
        lastUpdated: metrics.lastUpdated
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: 'Service health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// ===== VIOLATION DETECTION ENDPOINTS =====

// Detect a new rule violation
router.post('/violations/detect', handleAsync(async (req: Request, res: Response) => {
  const {
    type,
    category,
    severity,
    ruleCode,
    ruleDescription,
    violation,
    evidence,
    playerId,
    matchId,
    confidence,
    explanation,
    appealable,
    decision
  } = req.body;

  if (!type || !category || !severity || !ruleCode || !violation || !playerId || !matchId) {
    return res.status(400).json({
      error: 'Missing required fields: type, category, severity, ruleCode, violation, playerId, matchId'
    });
  }

  try {
    const violationResult = await aiRefereeService.detectViolation({
      type,
      category,
      severity,
      ruleCode,
      ruleDescription,
      violation,
      evidence: evidence || [],
      playerId,
      matchId,
      confidence: confidence || 85,
      explanation,
      appealable: appealable !== false,
      decision: decision || {
        action: 'foul',
        points: 1,
        explanation: 'Standard foul penalty',
        ruleReference: ruleCode
      }
    });

    res.status(201).json({
      success: true,
      violation: violationResult,
      message: 'Violation detected and decision made'
    });
  } catch (error) {
    console.error('Error detecting violation:', error);
    res.status(500).json({
      error: 'Failed to detect violation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Get all violations (with optional filtering)
router.get('/violations', handleAsync(async (req: Request, res: Response) => {
  const { matchId, type, category, severity, playerId, status } = req.query;

  try {
    let violations = aiRefereeService.getViolations(matchId as string);

    // Apply additional filters
    if (type) violations = violations.filter(v => v.type === type);
    if (category) violations = violations.filter(v => v.category === category);
    if (severity) violations = violations.filter(v => v.severity === severity);
    if (playerId) violations = violations.filter(v => v.playerId === playerId);
    if (status) violations = violations.filter(v => v.status === status);

    res.json({
      success: true,
      violations,
      count: violations.length
    });
  } catch (error) {
    console.error('Error fetching violations:', error);
    res.status(500).json({
      error: 'Failed to fetch violations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Get specific violation by ID
router.get('/violations/:id', handleAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const violations = aiRefereeService.getViolations();
    const violation = violations.find(v => v.id === id);

    if (!violation) {
      return res.status(404).json({
        error: 'Violation not found'
      });
    }

    res.json({
      success: true,
      violation
    });
  } catch (error) {
    console.error('Error fetching violation:', error);
    res.status(500).json({
      error: 'Failed to fetch violation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Appeal a violation decision
router.post('/violations/:id/appeal', handleAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { appealReason } = req.body;

  if (!appealReason) {
    return res.status(400).json({
      error: 'Appeal reason is required'
    });
  }

  try {
    const success = await aiRefereeService.appealDecision(id, appealReason);

    if (!success) {
      return res.status(400).json({
        error: 'Violation is not appealable or not found'
      });
    }

    res.json({
      success: true,
      message: 'Appeal submitted successfully',
      violationId: id
    });
  } catch (error) {
    console.error('Error appealing violation:', error);
    res.status(500).json({
      error: 'Failed to appeal violation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// ===== RULE INTERPRETATION ENDPOINTS =====

// Get rule interpretation
router.get('/rules/interpret/:ruleCode', handleAsync(async (req: Request, res: Response) => {
  const { ruleCode } = req.params;

  try {
    const interpretation = await aiRefereeService.interpretRule(ruleCode);

    res.json({
      success: true,
      interpretation
    });
  } catch (error) {
    console.error('Error interpreting rule:', error);
    res.status(500).json({
      error: 'Failed to interpret rule',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Get all rule interpretations
router.get('/rules/interpretations', handleAsync(async (req: Request, res: Response) => {
  try {
    const interpretations = aiRefereeService.getRuleInterpretations();

    res.json({
      success: true,
      interpretations,
      count: interpretations.length
    });
  } catch (error) {
    console.error('Error fetching rule interpretations:', error);
    res.status(500).json({
      error: 'Failed to fetch rule interpretations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// ===== STRATEGY ANALYSIS ENDPOINTS =====

// Generate strategy analysis
router.post('/strategy/analyze', handleAsync(async (req: Request, res: Response) => {
  const {
    matchId,
    playerId,
    analysisType,
    riskLevel,
    confidence
  } = req.body;

  if (!matchId || !playerId || !analysisType) {
    return res.status(400).json({
      error: 'Missing required fields: matchId, playerId, analysisType'
    });
  }

  try {
    const analysis = await aiRefereeService.analyzeStrategy({
      matchId,
      playerId,
      analysisType,
      insights: [],
      recommendations: [],
      riskLevel: riskLevel || 'medium',
      confidence: confidence || 80
    });

    res.status(201).json({
      success: true,
      analysis,
      message: 'Strategy analysis generated'
    });
  } catch (error) {
    console.error('Error analyzing strategy:', error);
    res.status(500).json({
      error: 'Failed to analyze strategy',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Get strategy analyses
router.get('/strategy/analyses', handleAsync(async (req: Request, res: Response) => {
  const { matchId, playerId, analysisType } = req.query;

  try {
    let analyses = aiRefereeService.getStrategyAnalyses();

    // Apply filters
    if (matchId) analyses = analyses.filter(a => a.matchId === matchId);
    if (playerId) analyses = analyses.filter(a => a.playerId === playerId);
    if (analysisType) analyses = analyses.filter(a => a.analysisType === analysisType);

    res.json({
      success: true,
      analyses,
      count: analyses.length
    });
  } catch (error) {
    console.error('Error fetching strategy analyses:', error);
    res.status(500).json({
      error: 'Failed to fetch strategy analyses',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// ===== PERFORMANCE ASSESSMENT ENDPOINTS =====

// Generate performance assessment
router.post('/performance/assess', handleAsync(async (req: Request, res: Response) => {
  const {
    matchId,
    playerId,
    metrics
  } = req.body;

  if (!matchId || !playerId || !metrics) {
    return res.status(400).json({
      error: 'Missing required fields: matchId, playerId, metrics'
    });
  }

  try {
    const assessment = await aiRefereeService.assessPerformance({
      matchId,
      playerId,
      metrics,
      strengths: [],
      weaknesses: [],
      recommendations: []
    });

    res.status(201).json({
      success: true,
      assessment,
      message: 'Performance assessment generated'
    });
  } catch (error) {
    console.error('Error generating performance assessment:', error);
    res.status(500).json({
      error: 'Failed to generate performance assessment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Get performance assessments
router.get('/performance/assessments', handleAsync(async (req: Request, res: Response) => {
  const { matchId, playerId } = req.query;

  try {
    let assessments = aiRefereeService.getPerformanceAssessments(matchId as string);

    // Apply filters
    if (playerId) assessments = assessments.filter(a => a.playerId === playerId);

    res.json({
      success: true,
      assessments,
      count: assessments.length
    });
  } catch (error) {
    console.error('Error fetching performance assessments:', error);
    res.status(500).json({
      error: 'Failed to fetch performance assessments',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// ===== CONFIGURATION ENDPOINTS =====

// Update configuration
router.put('/config', handleAsync(async (req: Request, res: Response) => {
  try {
    const newConfig = req.body;
    await aiRefereeService.updateConfig(newConfig);

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      config: aiRefereeService.getConfig()
    });
  } catch (error) {
    console.error('Error updating configuration:', error);
    res.status(500).json({
      error: 'Failed to update configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Get configuration
router.get('/config', handleAsync(async (req: Request, res: Response) => {
  try {
    const config = aiRefereeService.getConfig();

    res.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('Error fetching configuration:', error);
    res.status(500).json({
      error: 'Failed to fetch configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// ===== METRICS ENDPOINTS =====

// Get metrics
router.get('/metrics', handleAsync(async (req: Request, res: Response) => {
  try {
    const metrics = aiRefereeService.getMetrics();

    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// ===== BULK OPERATIONS =====

// Get comprehensive match analysis
router.get('/match/:matchId/analysis', handleAsync(async (req: Request, res: Response) => {
  const { matchId } = req.params;

  try {
    const violations = aiRefereeService.getViolations(matchId);
    const strategyAnalyses = aiRefereeService.getStrategyAnalyses(matchId);
    const performanceAssessments = aiRefereeService.getPerformanceAssessments(matchId);

    const analysis = {
      matchId,
      violations: {
        total: violations.length,
        byType: violations.reduce((acc, v) => {
          acc[v.type] = (acc[v.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        bySeverity: violations.reduce((acc, v) => {
          acc[v.severity] = (acc[v.severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        list: violations
      },
      strategyAnalyses: {
        total: strategyAnalyses.length,
        byType: strategyAnalyses.reduce((acc, s) => {
          acc[s.analysisType] = (acc[s.analysisType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        list: strategyAnalyses
      },
      performanceAssessments: {
        total: performanceAssessments.length,
        averageOverallRating: performanceAssessments.length > 0 
          ? performanceAssessments.reduce((sum, p) => sum + p.metrics.overallRating, 0) / performanceAssessments.length
          : 0,
        list: performanceAssessments
      },
      summary: {
        totalDecisions: violations.length,
        averageConfidence: violations.length > 0 
          ? violations.reduce((sum, v) => sum + v.confidence, 0) / violations.length
          : 0,
        appealRate: violations.length > 0 
          ? (violations.filter(v => v.status === 'appealed').length / violations.length) * 100
          : 0
      }
    };

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Error generating match analysis:', error);
    res.status(500).json({
      error: 'Failed to generate match analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Error handling middleware
router.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Advanced AI Referee API Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    details: error.message || 'Unknown error occurred'
  });
});

export default router; 