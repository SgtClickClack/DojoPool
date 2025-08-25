import Head from 'next/head';
import React from 'react';
import AdvancedAIRefereeRuleEnforcementDashboard from '../src/components/AI/AdvancedAIRefereeRuleEnforcementDashboard';

const AdvancedAIRefereeRuleEnforcementPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Advanced AI Referee & Rule Enforcement - DojoPool</title>
        <meta
          name="description"
          content="Advanced AI-powered referee system with rule interpretation and enforcement for DojoPool"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Advanced AI Referee & Rule Enforcement
            </h1>
            <p className="mt-2 text-gray-600">
              Comprehensive AI-powered referee system with rule interpretation,
              foul detection, strategy analysis, and performance assessment.
            </p>
          </div>

          <AdvancedAIRefereeRuleEnforcementDashboard />
        </div>
      </div>
    </>
  );
};

export default AdvancedAIRefereeRuleEnforcementPage;
