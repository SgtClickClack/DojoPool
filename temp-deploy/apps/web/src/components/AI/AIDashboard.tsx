'use client';

import { useAI } from '@/hooks/useAI';
import { AiHealthStatus } from '@/services/aiService';
import {
  ArrowPathIcon,
  CameraIcon,
  ChatBubbleLeftIcon,
  CheckCircleIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';

interface AIDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIDashboard: React.FC<AIDashboardProps> = ({ isOpen, onClose }) => {
  const {
    healthStatus,
    isAiAvailable,
    preferredProvider,
    isLoading,
    error,
    refreshHealth,
  } = useAI();

  const [selectedTab, setSelectedTab] = useState<
    'status' | 'analysis' | 'vision'
  >('status');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'unhealthy':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getProviderBadge = (provider: keyof AiHealthStatus) => {
    const config = healthStatus?.[provider];
    if (!config) return null;

    return (
      <div className="flex items-center space-x-2 p-3 bg-gray-800 rounded-lg">
        {getStatusIcon(config.status)}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-medium text-white capitalize">
              {provider}
            </span>
            <div className="flex items-center space-x-1">
              {config.enabled && (
                <span className="text-xs text-green-400">Enabled</span>
              )}
              {'configured' in config && config.configured && (
                <span className="text-xs text-blue-400">Configured</span>
              )}
            </div>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {config.status === 'healthy' && 'Service is operational'}
            {config.status === 'unhealthy' && 'Service is experiencing issues'}
            {config.status === 'unknown' && 'Service status unknown'}
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (isOpen) {
      refreshHealth();
    }
  }, [isOpen, refreshHealth]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <CpuChipIcon className="w-8 h-8 text-blue-500" />
              <div>
                <h2 className="text-xl font-bold text-white">
                  AI Services Dashboard
                </h2>
                <p className="text-sm text-gray-400">
                  Unified AI integration status and controls
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-800 transition-colors"
            >
              <XCircleIcon className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            {[
              { id: 'status', label: 'Service Status', icon: CpuChipIcon },
              {
                id: 'analysis',
                label: 'Match Analysis',
                icon: ChatBubbleLeftIcon,
              },
              { id: 'vision', label: 'Computer Vision', icon: CameraIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {selectedTab === 'status' && (
              <div className="space-y-6">
                {/* Overall Status */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">
                      Overall Status
                    </h3>
                    <button
                      onClick={refreshHealth}
                      disabled={isLoading}
                      className="flex items-center space-x-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
                    >
                      <ArrowPathIcon
                        className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
                      />
                      <span className="text-sm">Refresh</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div
                        className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                          isAiAvailable ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                      <p className="text-white font-medium">
                        {isAiAvailable ? 'AI Available' : 'AI Unavailable'}
                      </p>
                      <p className="text-sm text-gray-400">
                        {preferredProvider
                          ? `Primary: ${preferredProvider}`
                          : 'No provider available'}
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {
                          Object.values(healthStatus || {}).filter(
                            (s) => s.enabled
                          ).length
                        }
                      </div>
                      <p className="text-sm text-gray-400">Services Enabled</p>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-900 border border-red-700 rounded-lg p-3">
                      <p className="text-red-300 text-sm">{error}</p>
                    </div>
                  )}
                </div>

                {/* Individual Services */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white">
                    Service Details
                  </h3>
                  {healthStatus && (
                    <>
                      {getProviderBadge('gemini')}
                      {getProviderBadge('openai')}
                      {getProviderBadge('opencv')}
                      {getProviderBadge('tensorflow')}
                    </>
                  )}
                </div>

                {/* Configuration Info */}
                <div className="bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg p-4">
                  <h4 className="text-blue-300 font-medium mb-2">
                    Configuration
                  </h4>
                  <div className="text-sm text-blue-200 space-y-1">
                    <p>• Set GEMINI_API_KEY for Google Gemini AI</p>
                    <p>• Set OPENAI_API_KEY for OpenAI GPT models</p>
                    <p>• Set OPENCV_ENABLED=true for computer vision</p>
                    <p>
                      • Set TENSORFLOW_ENABLED=true for TensorFlow.js models
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'analysis' && (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Match Analysis
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="text-white font-medium">Features</h4>
                      <ul className="text-sm text-gray-300 space-y-2">
                        <li className="flex items-center space-x-2">
                          <CheckCircleIcon className="w-4 h-4 text-green-500" />
                          <span>Post-match analysis</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircleIcon className="w-4 h-4 text-green-500" />
                          <span>Strategic insights</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <ChatBubbleLeftIcon className="w-4 h-4 text-blue-500" />
                          <span>Live commentary</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <EyeIcon className="w-4 h-4 text-purple-500" />
                          <span>Performance metrics</span>
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-white font-medium">
                        Supported Providers
                      </h4>
                      <ul className="text-sm text-gray-300 space-y-2">
                        <li className="flex items-center space-x-2">
                          <span className="w-4 h-4 bg-blue-500 rounded text-xs text-white text-center font-bold">
                            G
                          </span>
                          <span>Google Gemini 1.5 Flash</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className="w-4 h-4 bg-green-500 rounded text-xs text-white text-center font-bold">
                            O
                          </span>
                          <span>OpenAI GPT-4</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className="w-4 h-4 bg-gray-500 rounded text-xs text-white text-center font-bold">
                            F
                          </span>
                          <span>Fallback responses</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">API Endpoints</h4>
                  <div className="space-y-2 text-sm">
                    <div className="bg-gray-700 rounded p-2 font-mono text-gray-300">
                      POST /api/ai/analyze/match
                    </div>
                    <div className="bg-gray-700 rounded p-2 font-mono text-gray-300">
                      POST /api/ai/analyze/shot
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'vision' && (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Computer Vision
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="text-white font-medium">Capabilities</h4>
                      <ul className="text-sm text-gray-300 space-y-2">
                        <li className="flex items-center space-x-2">
                          <CameraIcon className="w-4 h-4 text-blue-500" />
                          <span>Table detection</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <EyeIcon className="w-4 h-4 text-green-500" />
                          <span>Ball tracking</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircleIcon className="w-4 h-4 text-purple-500" />
                          <span>Shot analysis</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CpuChipIcon className="w-4 h-4 text-orange-500" />
                          <span>Real-time processing</span>
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-white font-medium">
                        Technology Stack
                      </h4>
                      <ul className="text-sm text-gray-300 space-y-2">
                        <li className="flex items-center space-x-2">
                          <span className="w-4 h-4 bg-red-500 rounded text-xs text-white text-center font-bold">
                            O
                          </span>
                          <span>OpenCV.js</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className="w-4 h-4 bg-orange-500 rounded text-xs text-white text-center font-bold">
                            T
                          </span>
                          <span>TensorFlow.js</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className="w-4 h-4 bg-blue-500 rounded text-xs text-white text-center font-bold">
                            W
                          </span>
                          <span>WebAssembly</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">API Endpoint</h4>
                  <div className="bg-gray-700 rounded p-2 font-mono text-gray-300 text-sm">
                    POST /api/ai/analyze/table
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    Accepts image files (JPEG, PNG) up to 10MB for table and
                    ball analysis
                  </p>
                </div>

                <div className="bg-yellow-900 bg-opacity-50 border border-yellow-700 rounded-lg p-4">
                  <h4 className="text-yellow-300 font-medium mb-2">
                    Performance Note
                  </h4>
                  <p className="text-sm text-yellow-200">
                    Computer vision processing may take several seconds
                    depending on image complexity and device capabilities.
                    Results are cached for improved performance on repeated
                    analyses.
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AIDashboard;
