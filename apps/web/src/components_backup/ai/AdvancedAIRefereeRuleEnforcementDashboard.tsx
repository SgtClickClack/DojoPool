import React, { useState, useEffect } from 'react';
import useAdvancedAIRefereeRuleEnforcement from '../../hooks/useAdvancedAIRefereeRuleEnforcement';
import {
  type RuleViolation,
  type RuleInterpretation,
  type StrategyAnalysis,
  type PerformanceAssessment,
  type AIRefereeConfig,
} from '../../services/ai/AdvancedAIRefereeRuleEnforcementService';

interface AdvancedAIRefereeRuleEnforcementDashboardProps {
  matchId?: string;
  playerId?: string;
  onViolationDetected?: (violation: RuleViolation) => void;
  onRuleInterpreted?: (interpretation: RuleInterpretation) => void;
  onStrategyAnalyzed?: (analysis: StrategyAnalysis) => void;
  onPerformanceAssessed?: (assessment: PerformanceAssessment) => void;
}

type TabType =
  | 'violations'
  | 'rules'
  | 'strategy'
  | 'performance'
  | 'config'
  | 'metrics';

const AdvancedAIRefereeRuleEnforcementDashboard: React.FC<
  AdvancedAIRefereeRuleEnforcementDashboardProps
> = ({
  matchId,
  playerId,
  onViolationDetected,
  onRuleInterpreted,
  onStrategyAnalyzed,
  onPerformanceAssessed,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('violations');
  const [selectedViolation, setSelectedViolation] =
    useState<RuleViolation | null>(null);
  const [appealReason, setAppealReason] = useState('');
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [newViolationForm, setNewViolationForm] = useState({
    type: 'foul' as const,
    category: 'technical' as const,
    severity: 'medium' as const,
    ruleCode: '',
    ruleDescription: '',
    violation: '',
    playerId: playerId || '',
    matchId: matchId || '',
    confidence: 85,
    explanation: '',
    appealable: true,
  });

  const {
    isConnected,
    isLoading,
    error,
    violations,
    ruleInterpretations,
    strategyAnalyses,
    performanceAssessments,
    config,
    metrics,
    detectViolation,
    appealDecision,
    interpretRule,
    analyzeStrategy,
    assessPerformance,
    updateConfig,
    refreshData,
    clearError,
  } = useAdvancedAIRefereeRuleEnforcement();

  // Filter data based on matchId and playerId
  const filteredViolations = violations.filter(
    (v) =>
      (!matchId || v.matchId === matchId) &&
      (!playerId || v.playerId === playerId)
  );
  const filteredStrategyAnalyses = strategyAnalyses.filter(
    (s) =>
      (!matchId || s.matchId === matchId) &&
      (!playerId || s.playerId === playerId)
  );
  const filteredPerformanceAssessments = performanceAssessments.filter(
    (p) =>
      (!matchId || p.matchId === matchId) &&
      (!playerId || p.playerId === playerId)
  );

  useEffect(() => {
    if (onViolationDetected && violations.length > 0) {
      onViolationDetected(violations[0]);
    }
  }, [violations, onViolationDetected]);

  const handleDetectViolation = async () => {
    try {
      const violation = await detectViolation(newViolationForm);
      setNewViolationForm({
        type: 'foul',
        category: 'technical',
        severity: 'medium',
        ruleCode: '',
        ruleDescription: '',
        violation: '',
        playerId: playerId || '',
        matchId: matchId || '',
        confidence: 85,
        explanation: '',
        appealable: true,
      });
    } catch (error) {
      console.error('Failed to detect violation:', error);
    }
  };

  const handleAppealViolation = async () => {
    if (!selectedViolation || !appealReason) return;

    try {
      await appealDecision(selectedViolation.id, appealReason);
      setShowAppealModal(false);
      setAppealReason('');
      setSelectedViolation(null);
    } catch (error) {
      console.error('Failed to appeal violation:', error);
    }
  };

  const handleInterpretRule = async (ruleCode: string) => {
    try {
      const interpretation = await interpretRule(ruleCode);
      if (onRuleInterpreted) {
        onRuleInterpreted(interpretation);
      }
    } catch (error) {
      console.error('Failed to interpret rule:', error);
    }
  };

  const handleAnalyzeStrategy = async () => {
    if (!matchId || !playerId) return;

    try {
      const analysis = await analyzeStrategy({
        matchId,
        playerId,
        analysisType: 'shot_selection',
        insights: [],
        recommendations: [],
        riskLevel: 'medium',
        confidence: 80,
      });
      if (onStrategyAnalyzed) {
        onStrategyAnalyzed(analysis);
      }
    } catch (error) {
      console.error('Failed to analyze strategy:', error);
    }
  };

  const handleAssessPerformance = async () => {
    if (!matchId || !playerId) return;

    try {
      const assessment = await assessPerformance({
        matchId,
        playerId,
        metrics: {
          shotAccuracy: 75,
          positionPlay: 70,
          decisionMaking: 80,
          ruleCompliance: 95,
          sportsmanship: 85,
          overallRating: 81,
        },
        strengths: [],
        weaknesses: [],
        recommendations: [],
      });
      if (onPerformanceAssessed) {
        onPerformanceAssessed(assessment);
      }
    } catch (error) {
      console.error('Failed to assess performance:', error);
    }
  };

  const handleUpdateConfig = async (newConfig: Partial<AIRefereeConfig>) => {
    try {
      await updateConfig(newConfig);
    } catch (error) {
      console.error('Failed to update config:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getViolationTypeColor = (type: string) => {
    switch (type) {
      case 'foul':
        return 'text-red-600 bg-red-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'penalty':
        return 'text-orange-600 bg-orange-100';
      case 'disqualification':
        return 'text-red-800 bg-red-200';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const tabs = [
    { id: 'violations', label: 'Violations', count: filteredViolations.length },
    {
      id: 'rules',
      label: 'Rule Interpretations',
      count: ruleInterpretations.length,
    },
    {
      id: 'strategy',
      label: 'Strategy Analysis',
      count: filteredStrategyAnalyses.length,
    },
    {
      id: 'performance',
      label: 'Performance Assessment',
      count: filteredPerformanceAssessments.length,
    },
    { id: 'config', label: 'Configuration', count: 0 },
    { id: 'metrics', label: 'Metrics', count: 0 },
  ];

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
          <button
            onClick={clearError}
            className="text-red-400 hover:text-red-600"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              AI Referee & Rule Enforcement
            </h2>
            <p className="text-sm text-gray-600">
              Advanced AI-powered referee system with rule interpretation and
              enforcement
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center ${isConnected ? 'text-green-600' : 'text-red-600'}`}
            >
              <div
                className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
              ></div>
              <span className="text-sm font-medium">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <button
              onClick={refreshData}
              disabled={isLoading}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'violations' && (
          <div className="space-y-6">
            {/* New Violation Form */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Detect New Violation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <select
                    value={newViolationForm.type}
                    onChange={(e) =>
                      setNewViolationForm((prev) => ({
                        ...prev,
                        type: e.target.value as any,
                      }))
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="foul">Foul</option>
                    <option value="warning">Warning</option>
                    <option value="penalty">Penalty</option>
                    <option value="disqualification">Disqualification</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    value={newViolationForm.category}
                    onChange={(e) =>
                      setNewViolationForm((prev) => ({
                        ...prev,
                        category: e.target.value as any,
                      }))
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="technical">Technical</option>
                    <option value="behavioral">Behavioral</option>
                    <option value="sportsmanship">Sportsmanship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Severity
                  </label>
                  <select
                    value={newViolationForm.severity}
                    onChange={(e) =>
                      setNewViolationForm((prev) => ({
                        ...prev,
                        severity: e.target.value as any,
                      }))
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Rule Code
                  </label>
                  <input
                    type="text"
                    value={newViolationForm.ruleCode}
                    onChange={(e) =>
                      setNewViolationForm((prev) => ({
                        ...prev,
                        ruleCode: e.target.value,
                      }))
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 6.3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Violation Description
                  </label>
                  <input
                    type="text"
                    value={newViolationForm.violation}
                    onChange={(e) =>
                      setNewViolationForm((prev) => ({
                        ...prev,
                        violation: e.target.value,
                      }))
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe the violation"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Confidence (%)
                  </label>
                  <input
                    type="number"
                    value={newViolationForm.confidence}
                    onChange={(e) =>
                      setNewViolationForm((prev) => ({
                        ...prev,
                        confidence: parseInt(e.target.value),
                      }))
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Explanation
                </label>
                <textarea
                  value={newViolationForm.explanation}
                  onChange={(e) =>
                    setNewViolationForm((prev) => ({
                      ...prev,
                      explanation: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Detailed explanation of the violation"
                />
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleDetectViolation}
                  disabled={
                    isLoading ||
                    !newViolationForm.ruleCode ||
                    !newViolationForm.violation
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Detecting...' : 'Detect Violation'}
                </button>
              </div>
            </div>

            {/* Violations List */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Recent Violations
              </h3>
              <div className="space-y-4">
                {filteredViolations.map((violation) => (
                  <div
                    key={violation.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getViolationTypeColor(violation.type)}`}
                        >
                          {violation.type.toUpperCase()}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(violation.severity)}`}
                        >
                          {violation.severity.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">
                          Rule {violation.ruleCode}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(violation.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      {violation.violation}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {violation.explanation}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Player: {violation.playerId} | Match:{' '}
                        {violation.matchId} | Confidence: {violation.confidence}
                        %
                      </div>
                      <div className="flex space-x-2">
                        {violation.appealable &&
                          violation.status === 'confirmed' && (
                            <button
                              onClick={() => {
                                setSelectedViolation(violation);
                                setShowAppealModal(true);
                              }}
                              className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
                            >
                              Appeal
                            </button>
                          )}
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            violation.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : violation.status === 'appealed'
                                ? 'bg-yellow-100 text-yellow-800'
                                : violation.status === 'overturned'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {violation.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredViolations.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No violations found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Rule Interpretations
              </h3>
              <button
                onClick={() => handleInterpretRule('6.3')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Interpret Rule 6.3
              </button>
            </div>
            <div className="space-y-4">
              {ruleInterpretations.map((interpretation) => (
                <div
                  key={interpretation.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">
                      Rule {interpretation.ruleCode}
                    </h4>
                    <span className="text-sm text-gray-500">
                      {new Date(
                        interpretation.lastUpdated
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {interpretation.ruleText}
                  </p>
                  <p className="text-sm text-gray-800 mb-3">
                    {interpretation.interpretation}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">
                        Examples
                      </h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {interpretation.examples.map((example, index) => (
                          <li key={index}>• {example}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">
                        Exceptions
                      </h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {interpretation.exceptions.map((exception, index) => (
                          <li key={index}>• {exception}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-gray-500">
                    Confidence: {interpretation.confidence}%
                  </div>
                </div>
              ))}
              {ruleInterpretations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No rule interpretations available
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'strategy' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Strategy Analysis
              </h3>
              <button
                onClick={handleAnalyzeStrategy}
                disabled={!matchId || !playerId}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Analyze Strategy
              </button>
            </div>
            <div className="space-y-4">
              {filteredStrategyAnalyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">
                      {analysis.analysisType.replace('_', ' ').toUpperCase()}{' '}
                      Analysis
                    </h4>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        analysis.riskLevel === 'low'
                          ? 'bg-green-100 text-green-800'
                          : analysis.riskLevel === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {analysis.riskLevel.toUpperCase()} RISK
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">
                        Insights
                      </h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {analysis.insights.map((insight, index) => (
                          <li key={index}>• {insight}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">
                        Recommendations
                      </h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {analysis.recommendations.map(
                          (recommendation, index) => (
                            <li key={index}>• {recommendation}</li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-gray-500">
                    Player: {analysis.playerId} | Match: {analysis.matchId} |
                    Confidence: {analysis.confidence}%
                  </div>
                </div>
              ))}
              {filteredStrategyAnalyses.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No strategy analyses available
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Performance Assessment
              </h3>
              <button
                onClick={handleAssessPerformance}
                disabled={!matchId || !playerId}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Assess Performance
              </button>
            </div>
            <div className="space-y-4">
              {filteredPerformanceAssessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">
                      Performance Assessment
                    </h4>
                    <div className="text-2xl font-bold text-blue-600">
                      {assessment.metrics.overallRating}/100
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {assessment.metrics.shotAccuracy}
                      </div>
                      <div className="text-xs text-gray-500">Shot Accuracy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {assessment.metrics.positionPlay}
                      </div>
                      <div className="text-xs text-gray-500">Position Play</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {assessment.metrics.decisionMaking}
                      </div>
                      <div className="text-xs text-gray-500">
                        Decision Making
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {assessment.metrics.ruleCompliance}
                      </div>
                      <div className="text-xs text-gray-500">
                        Rule Compliance
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {assessment.metrics.sportsmanship}
                      </div>
                      <div className="text-xs text-gray-500">Sportsmanship</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">
                        Strengths
                      </h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {assessment.strengths.map((strength, index) => (
                          <li key={index}>• {strength}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">
                        Areas for Improvement
                      </h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {assessment.weaknesses.map((weakness, index) => (
                          <li key={index}>• {weakness}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h5 className="font-medium text-gray-900 mb-2">
                      Recommendations
                    </h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {assessment.recommendations.map(
                        (recommendation, index) => (
                          <li key={index}>• {recommendation}</li>
                        )
                      )}
                    </ul>
                  </div>

                  <div className="mt-3 text-sm text-gray-500">
                    Player: {assessment.playerId} | Match: {assessment.matchId}
                  </div>
                </div>
              ))}
              {filteredPerformanceAssessments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No performance assessments available
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.enableRealTimeAnalysis}
                      onChange={(e) =>
                        handleUpdateConfig({
                          enableRealTimeAnalysis: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Enable Real-time Analysis
                    </span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.enablePredictiveDecisions}
                      onChange={(e) =>
                        handleUpdateConfig({
                          enablePredictiveDecisions: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Enable Predictive Decisions
                    </span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.enableRuleLearning}
                      onChange={(e) =>
                        handleUpdateConfig({
                          enableRuleLearning: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Enable Rule Learning
                    </span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.enableAppeals}
                      onChange={(e) =>
                        handleUpdateConfig({ enableAppeals: e.target.checked })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Enable Appeals
                    </span>
                  </label>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Confidence Threshold (%)
                  </label>
                  <input
                    type="number"
                    value={config.confidenceThreshold}
                    onChange={(e) =>
                      handleUpdateConfig({
                        confidenceThreshold: parseInt(e.target.value),
                      })
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Rule Set
                  </label>
                  <select
                    value={config.ruleSet}
                    onChange={(e) =>
                      handleUpdateConfig({ ruleSet: e.target.value as any })
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="standard_8ball">Standard 8-Ball</option>
                    <option value="standard_9ball">Standard 9-Ball</option>
                    <option value="tournament">Tournament</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    AI Model
                  </label>
                  <select
                    value={config.aiModel}
                    onChange={(e) =>
                      handleUpdateConfig({ aiModel: e.target.value as any })
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="sky_t1">Sky-T1</option>
                    <option value="gpt4">GPT-4</option>
                    <option value="claude">Claude</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">
              Service Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {metrics.totalDecisions}
                </div>
                <div className="text-sm text-blue-600">Total Decisions</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">
                  {metrics.averageConfidence.toFixed(1)}%
                </div>
                <div className="text-sm text-green-600">Average Confidence</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-600">
                  {metrics.appealRate.toFixed(1)}%
                </div>
                <div className="text-sm text-yellow-600">Appeal Rate</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {metrics.analysisAccuracy.toFixed(1)}%
                </div>
                <div className="text-sm text-purple-600">Analysis Accuracy</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Decisions by Type
                </h4>
                <div className="space-y-2">
                  {Object.entries(metrics.decisionsByType).map(
                    ([type, count]) => (
                      <div
                        key={type}
                        className="flex justify-between items-center"
                      >
                        <span className="text-sm text-gray-600 capitalize">
                          {type}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {count}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  System Information
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Response Time</span>
                    <span className="text-sm font-medium text-gray-900">
                      {metrics.responseTime}ms
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Overturned Decisions
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {metrics.overturnedDecisions}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Last Updated</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(metrics.lastUpdated).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Appeal Modal */}
      {showAppealModal && selectedViolation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Appeal Violation
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Violation: {selectedViolation.violation}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Appeal Reason
                </label>
                <textarea
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Explain why you believe this decision should be overturned..."
                />
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowAppealModal(false);
                    setAppealReason('');
                    setSelectedViolation(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAppealViolation}
                  disabled={!appealReason.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded hover:bg-yellow-700 disabled:opacity-50"
                >
                  Submit Appeal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedAIRefereeRuleEnforcementDashboard;
