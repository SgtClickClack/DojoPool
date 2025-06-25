import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import { AIMatchAnalysisComponent } from '../components/ai/AIMatchAnalysisComponent';
import { AIPoweredMatchAnalysisService } from '../services/ai/AIPoweredMatchAnalysisService';

const AIMatchAnalysisPage: React.FC = () => {
  const [matchId] = useState('demo_match_001');
  const [player1Id] = useState('player_001');
  const [player2Id] = useState('player_002');
  const [isDemoActive, setIsDemoActive] = useState(false);

  const aiService = AIPoweredMatchAnalysisService.getInstance();

  const startDemo = async () => {
    try {
      setIsDemoActive(true);
      
      // Simulate shot data for demo
      const demoShots = [
        {
          shotId: 'shot_001',
          timestamp: Date.now(),
          playerId: player1Id,
          matchId,
          ballPositions: {
            cueBall: { x: 100, y: 200 },
            targetBall: { x: 300, y: 400 }
          },
          velocity: 75,
          topSpin: 20,
          sideSpin: 10,
          english: 15,
          intendedPosition: { x: 350, y: 450 },
          actualPosition: { x: 340, y: 440 },
          success: true,
          consistency: 80,
          isBreak: false,
          isBank: false,
          isCombination: false,
          isSafety: false,
          obstacles: 2
        },
        {
          shotId: 'shot_002',
          timestamp: Date.now() + 1000,
          playerId: player2Id,
          matchId,
          ballPositions: {
            cueBall: { x: 150, y: 250 },
            targetBall: { x: 400, y: 500 }
          },
          velocity: 60,
          topSpin: 10,
          sideSpin: 30,
          english: 25,
          intendedPosition: { x: 450, y: 550 },
          actualPosition: { x: 420, y: 520 },
          success: false,
          consistency: 65,
          isBreak: false,
          isBank: true,
          isCombination: false,
          isSafety: false,
          obstacles: 1
        }
      ];

      // Process demo shots
      for (const shot of demoShots) {
        await aiService.processShotData(shot);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between shots
      }

    } catch (error) {
      console.error('Error in demo:', error);
    }
  };

  const stopDemo = () => {
    setIsDemoActive(false);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              AI-Powered Match Analysis
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real-time shot tracking, performance analytics, and AI coaching insights 
              powered by advanced computer vision and machine learning.
            </p>
          </div>

          {/* Demo Controls */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">Live Demo</h2>
                <p className="text-gray-600">
                  Experience real-time AI analysis with simulated shot data
                </p>
              </div>
              <div className="flex space-x-4">
                {!isDemoActive ? (
                  <button
                    onClick={startDemo}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Start Demo
                  </button>
                ) : (
                  <button
                    onClick={stopDemo}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Stop Demo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* AI Analysis Component */}
          <AIMatchAnalysisComponent
            matchId={matchId}
            player1Id={player1Id}
            player2Id={player2Id}
            onAnalysisUpdate={(analysis) => {
              console.log('Analysis updated:', analysis);
            }}
          />

          {/* Features Overview */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Real-time Shot Tracking */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Real-time Shot Tracking</h3>
              <p className="text-gray-600">
                Advanced computer vision tracks ball positions, shot types, power, spin, and accuracy in real-time.
              </p>
            </div>

            {/* Performance Analytics */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Performance Analytics</h3>
              <p className="text-gray-600">
                Comprehensive analysis of accuracy, consistency, strategy, and pressure handling with detailed metrics.
              </p>
            </div>

            {/* AI Coaching */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">AI Coaching</h3>
              <p className="text-gray-600">
                Intelligent coaching recommendations based on current situation, player performance, and match context.
              </p>
            </div>

            {/* Match Prediction */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Match Prediction</h3>
              <p className="text-gray-600">
                AI-powered predictions for match outcomes, next shot probabilities, and strategic recommendations.
              </p>
            </div>

            {/* Mental Game Analysis */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Mental Game Analysis</h3>
              <p className="text-gray-600">
                Analysis of focus, confidence, pressure handling, and emotional control with personalized mental coaching.
              </p>
            </div>

            {/* Training Programs */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Personalized Training</h3>
              <p className="text-gray-600">
                AI-generated training programs tailored to individual weaknesses and improvement areas.
              </p>
            </div>
          </div>

          {/* Technical Details */}
          <div className="mt-12 bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Technical Architecture</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">AI Technologies</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Computer Vision for ball tracking and position detection</li>
                  <li>• Machine Learning for shot type classification</li>
                  <li>• Predictive Analytics for performance forecasting</li>
                  <li>• Natural Language Processing for coaching insights</li>
                  <li>• Real-time data processing and analysis</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Key Features</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Real-time WebSocket communication</li>
                  <li>• Advanced shot pattern recognition</li>
                  <li>• Mental game assessment algorithms</li>
                  <li>• Adaptive difficulty adjustment</li>
                  <li>• Multi-player performance comparison</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AIMatchAnalysisPage; 