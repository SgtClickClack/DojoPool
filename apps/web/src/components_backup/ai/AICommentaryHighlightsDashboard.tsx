import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Slider,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Share,
  Download,
  Settings,
  Analytics,
  VideoLibrary,
  Mic,
  VolumeUp,
  Speed,
  HighQuality,
  SocialDistance,
  TrendingUp,
  Timeline,
  Refresh,
  ExpandMore,
  CheckCircle,
  Error,
  Warning,
  Info,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import {
  useAICommentaryHighlights,
  GeneratedHighlight,
  type HighlightGenerationRequest,
} from '../../hooks/useAICommentaryHighlights';

interface HighlightGenerationRequest {
  matchId: string;
  tournamentId?: string;
  userId: string;
  gameType: string;
  highlights: string[];
  commentaryStyle?: 'professional' | 'casual' | 'excited' | 'analytical';
  includeAudio?: boolean;
  duration?: number;
  quality?: 'low' | 'medium' | 'high';
}

interface GeneratedHighlight {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  audioUrl?: string;
  duration: number;
  thumbnailUrl?: string;
  createdAt: Date;
  matchId: string;
  tournamentId?: string;
  userId: string;
  highlights: string[];
  commentary: CommentaryEvent[];
  metadata: {
    quality: string;
    style: string;
    excitementLevel: number;
    difficulty: number;
    impact: number;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  };
  socialSharing: {
    shareUrl: string;
    downloadUrl: string;
    embedCode: string;
  };
}

interface CommentaryEvent {
  id: string;
  timestamp: Date;
  type:
    | 'shot'
    | 'foul'
    | 'score'
    | 'highlight'
    | 'analysis'
    | 'blessing'
    | 'fluke';
  content: string;
  audioUrl?: string;
  excitementLevel: number;
  confidence: number;
  context: any;
  poolGod?: string;
}

interface ServiceMetrics {
  totalHighlights: number;
  highlightsByMatch: Record<string, number>;
  averageGenerationTime: number;
  audioGenerated: number;
  videosGenerated: number;
  sharesGenerated: number;
  downloadsGenerated: number;
  popularStyles: Record<string, number>;
  poolGodUsage: Record<string, number>;
  lastActivity: Date;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ai-commentary-tabpanel-${index}`}
      aria-labelledby={`ai-commentary-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface AICommentaryHighlightsDashboardProps {
  className?: string;
}

export const AICommentaryHighlightsDashboard: React.FC<
  AICommentaryHighlightsDashboardProps
> = ({ className = '' }) => {
  const {
    config,
    updateConfig,
    generateHighlights,
    isGenerating,
    generationError,
    highlights,
    matchHighlights,
    tournamentHighlights,
    userHighlights,
    shareHighlight,
    downloadHighlight,
    metrics,
    resetMetrics,
    isLoading,
    error,
  } = useAICommentaryHighlights();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'generate' | 'highlights' | 'config' | 'metrics'
  >('overview');
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  // Sample data for demonstration
  const sampleMatches = [
    {
      id: 'match-1',
      name: 'Brisbane Championship Final',
      players: ['Player A', 'Player B'],
    },
    {
      id: 'match-2',
      name: 'Quarter Final Match',
      players: ['Player C', 'Player D'],
    },
    {
      id: 'match-3',
      name: 'Semi Final Match',
      players: ['Player E', 'Player F'],
    },
  ];

  const sampleTournaments = [
    { id: 'tournament-1', name: 'Brisbane Championship 2024' },
    { id: 'tournament-2', name: 'Summer Series 2024' },
    { id: 'tournament-3', name: 'Winter Cup 2024' },
  ];

  const sampleUsers = [
    { id: 'user-1', name: 'Player A' },
    { id: 'user-2', name: 'Player B' },
    { id: 'user-3', name: 'Player C' },
  ];

  const handleGenerateHighlights = async () => {
    if (!selectedMatchId) return;

    const request: HighlightGenerationRequest = {
      matchId: selectedMatchId,
      tournamentId: selectedTournamentId || undefined,
      userId: selectedUserId || 'user-1',
      gameType: '8-ball',
      highlights: ['amazing shot', 'perfect break', 'clutch finish'],
      commentaryStyle: 'excited',
      includeAudio: true,
      duration: 60,
      quality: 'high',
    };

    try {
      await generateHighlights(request);
    } catch (err) {
      console.error('Failed to generate highlights:', err);
    }
  };

  const handleShareHighlight = async (highlightId: string) => {
    try {
      await shareHighlight(
        highlightId,
        ['twitter', 'facebook'],
        'Check out this amazing pool highlight!'
      );
    } catch (err) {
      console.error('Failed to share highlight:', err);
    }
  };

  const handleDownloadHighlight = async (highlightId: string) => {
    try {
      const downloadUrl = await downloadHighlight(highlightId);
      window.open(downloadUrl, '_blank');
    } catch (err) {
      console.error('Failed to download highlight:', err);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Total Highlights
          </h3>
          <p className="text-3xl font-bold text-blue-600">
            {metrics?.totalHighlights || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Audio Generated
          </h3>
          <p className="text-3xl font-bold text-green-600">
            {metrics?.audioGenerated || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Videos Generated
          </h3>
          <p className="text-3xl font-bold text-purple-600">
            {metrics?.videosGenerated || 0}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Highlights
        </h3>
        <div className="space-y-4">
          {highlights.slice(0, 5).map((highlight) => (
            <div
              key={highlight.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <h4 className="font-medium text-gray-900">{highlight.title}</h4>
                <p className="text-sm text-gray-600">{highlight.description}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {highlight.metadata.rarity}
                  </span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {highlight.metadata.excitementLevel}% excitement
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleShareHighlight(highlight.id)}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Share
                </button>
                <button
                  onClick={() => handleDownloadHighlight(highlight.id)}
                  className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderGenerate = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Generate New Highlights
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Match
            </label>
            <select
              value={selectedMatchId}
              onChange={(e) => setSelectedMatchId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Choose a match...</option>
              {sampleMatches.map((match) => (
                <option key={match.id} value={match.id}>
                  {match.name} - {match.players.join(' vs ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Tournament (Optional)
            </label>
            <select
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Choose a tournament...</option>
              {sampleTournaments.map((tournament) => (
                <option key={tournament.id} value={tournament.id}>
                  {tournament.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select User
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Choose a user...</option>
              {sampleUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commentary Style
            </label>
            <select className="w-full p-2 border border-gray-300 rounded-md">
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="excited">Excited</option>
              <option value="analytical">Analytical</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleGenerateHighlights}
            disabled={isGenerating || !selectedMatchId}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isGenerating ? 'Generating Highlights...' : 'Generate Highlights'}
          </button>

          {generationError && (
            <p className="mt-2 text-red-600 text-sm">{generationError}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderHighlights = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          All Highlights
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {highlights.map((highlight) => (
            <div
              key={highlight.id}
              className="border rounded-lg overflow-hidden"
            >
              {highlight.thumbnailUrl && (
                <img
                  src={highlight.thumbnailUrl}
                  alt={highlight.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  {highlight.title}
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  {highlight.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {highlight.metadata.rarity}
                  </span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {highlight.metadata.excitementLevel}% excitement
                  </span>
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    {highlight.duration}s
                  </span>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleShareHighlight(highlight.id)}
                    className="flex-1 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Share
                  </button>
                  <button
                    onClick={() => handleDownloadHighlight(highlight.id)}
                    className="flex-1 px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderConfig = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          AI Commentary Configuration
        </h3>

        {config && (
          <div className="space-y-6">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => updateConfig({ enabled: e.target.checked })}
                  className="mr-2"
                />
                Enable AI Commentary
              </label>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.realTimeCommentary}
                  onChange={(e) =>
                    updateConfig({ realTimeCommentary: e.target.checked })
                  }
                  className="mr-2"
                />
                Real-time Commentary
              </label>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.highlightGeneration}
                  onChange={(e) =>
                    updateConfig({ highlightGeneration: e.target.checked })
                  }
                  className="mr-2"
                />
                Highlight Generation
              </label>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.audioSynthesis.enabled}
                  onChange={(e) =>
                    updateConfig({
                      audioSynthesis: {
                        ...config.audioSynthesis,
                        enabled: e.target.checked,
                      },
                    })
                  }
                  className="mr-2"
                />
                Audio Synthesis
              </label>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.videoGeneration.enabled}
                  onChange={(e) =>
                    updateConfig({
                      videoGeneration: {
                        ...config.videoGeneration,
                        enabled: e.target.checked,
                      },
                    })
                  }
                  className="mr-2"
                />
                Video Generation
              </label>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.socialSharing.enabled}
                  onChange={(e) =>
                    updateConfig({
                      socialSharing: {
                        ...config.socialSharing,
                        enabled: e.target.checked,
                      },
                    })
                  }
                  className="mr-2"
                />
                Social Sharing
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderMetrics = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Service Metrics
          </h3>
          <button
            onClick={resetMetrics}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
          >
            Reset Metrics
          </button>
        </div>

        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {metrics.totalHighlights}
              </p>
              <p className="text-sm text-gray-600">Total Highlights</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {metrics.audioGenerated}
              </p>
              <p className="text-sm text-gray-600">Audio Generated</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {metrics.videosGenerated}
              </p>
              <p className="text-sm text-gray-600">Videos Generated</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {metrics.sharesGenerated}
              </p>
              <p className="text-sm text-gray-600">Shares Generated</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'generate', name: 'Generate', icon: '🎬' },
    { id: 'highlights', name: 'Highlights', icon: '🎯' },
    { id: 'config', name: 'Configuration', icon: '⚙️' },
    { id: 'metrics', name: 'Metrics', icon: '📈' },
  ];

  return (
    <div className={`bg-gray-50 min-h-screen ${className}`}>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            AI-Powered Match Commentary & Highlights
          </h1>
          <p className="mt-2 text-gray-600">
            Generate AI-powered commentary, highlights, and social media content
            for pool matches
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'generate' && renderGenerate()}
            {activeTab === 'highlights' && renderHighlights()}
            {activeTab === 'config' && renderConfig()}
            {activeTab === 'metrics' && renderMetrics()}
          </>
        )}
      </div>
    </div>
  );
};
