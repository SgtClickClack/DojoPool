# React Components Documentation

## App

**File:** `frontend\App.tsx`

### Dependencies

```typescript
import CssBaseline from '@mui/material/CssBaseline';
```
```typescript
import { ThemeProvider } from '@mui/material/styles';
```
```typescript
import React from 'react';
```
```typescript
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
```
```typescript
import { Toast } from './components/Notifications/Toast';
```
```typescript
import { Router } from './Router';
```
```typescript
import { theme } from './theme';
```
```typescript
import { logError } from './utils/errorHandling';
```

---

## App

**File:** `mobile\App.tsx`

### Dependencies

```typescript
import React from 'react';
```
```typescript
import { NavigationContainer } from '@react-navigation/native';
```
```typescript
import { createStackNavigator } from '@react-navigation/stack';
```
```typescript
import { ThemeProvider } from '@rneui/themed';
```
```typescript
import { SafeAreaProvider } from 'react-native-safe-area-context';
```
```typescript
import { theme } from './utils/theme';
```
```typescript
import RootNavigator from './navigation/RootNavigator';
```

---

## AIMetrics

**File:** `components\ai\AIMetrics.tsx`

### Props

```typescript
systemMetrics: SystemMetric[];
  performanceMetrics: PerformanceMetric[];
  lastUpdated: string;
  onRefresh: () => void;
```

### Dependencies

```typescript
import React from 'react';
```
```typescript
import {
```
```typescript
import {
```

---

## Dashboard

**File:** `components\ai\Dashboard.tsx`

### Props

```typescript
children?: React.ReactNode;
  index: number;
  value: number;
```

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import React, { useState, useEffect } from 'react';
```
```typescript
import {
```
```typescript
import {
```
```typescript
import { MatchStory } from './MatchStory';
```
```typescript
import { Recommendations } from './Recommendations';
```
```typescript
import { MatchAnalysis } from './MatchAnalysis';
```
```typescript
import { DifficultySettings } from './DifficultySettings';
```
```typescript
import { AIMetrics } from './AIMetrics';
```

---

## DifficultySettings

**File:** `components\ai\DifficultySettings.tsx`

### Props

```typescript
parameters: DifficultyParameter[];
  onParameterChange: (name: string, value: number) => void;
  onReset: () => void;
  adaptiveScore: number;
```

### Dependencies

```typescript
import React from 'react';
```
```typescript
import {
```
```typescript
import {
```

---

## MatchAnalysis

**File:** `components\ai\MatchAnalysis.tsx`

### Props

```typescript
metrics: Metric[];
  keyMoments: KeyMoment[];
  patterns: Pattern[];
  summary: string;
```

### Dependencies

```typescript
import React from 'react';
```
```typescript
import {
```
```typescript
import {
```

---

## MatchStory

**File:** `components\ai\MatchStory.tsx`

### Props

```typescript
title: string;
  date: string;
  players: Player[];
  story: string;
  highlights: Highlight[];
  isBookmarked: boolean;
  onBookmark: () => void;
  onShare: () => void;
```

### Dependencies

```typescript
import React from 'react';
```
```typescript
import {
```
```typescript
import {
```

---

## Recommendations

**File:** `components\ai\Recommendations.tsx`

### Props

```typescript
recommendations: Recommendation[];
```

### Dependencies

```typescript
import React from 'react';
```
```typescript
import {
```
```typescript
import {
```

---

## Dashboard

**File:** `components\analytics\Dashboard.tsx`

### Props

```typescript
userId?: number;
  isAdmin: boolean;
```

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import React, { useState, useEffect } from 'react';
```
```typescript
import { Box, Container, Grid, Paper, Typography, useTheme } from '@mui/material';
```
```typescript
import { MetricsChart } from './MetricsChart';
```
```typescript
import { MetricsTable } from './MetricsTable';
```
```typescript
import { MetricsSummary } from './MetricsSummary';
```
```typescript
import { DateRangePicker } from './DateRangePicker';
```
```typescript
import { FilterPanel } from './FilterPanel';
```
```typescript
import { LoadingSpinner } from '../common/LoadingSpinner';
```
```typescript
import { ErrorAlert } from '../common/ErrorAlert';
```
```typescript
import { useAnalytics } from '../../hooks/useAnalytics';
```
```typescript
import { formatDate } from '../../utils/dateUtils';
```

---

## DateRangePicker

**File:** `components\analytics\DateRangePicker.tsx`

### Props

```typescript
startDate: Date;
  endDate: Date;
  onChange: (range: { startDate: Date; endDate: Date
```

### Dependencies

```typescript
import React from 'react';
```
```typescript
import { Box, TextField } from '@mui/material';
```
```typescript
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
```
```typescript
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
```
```typescript
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
```

---

## FilterPanel

**File:** `components\analytics\FilterPanel.tsx`

### Props

```typescript
selectedMetrics: string[];
  selectedDimension: string;
  selectedPeriod: string;
  onMetricsChange: (metrics: string[]) => void;
  onDimensionChange: (dimension: string) => void;
  onPeriodChange: (period: string) => void;
  isAdmin: boolean;
```

### Dependencies

```typescript
import React from 'react';
```
```typescript
import {
```

---

## MetricsChart

**File:** `components\analytics\MetricsChart.tsx`

### Props

```typescript
data: any[];
  metrics: string[];
  period: string;
```

### Hooks Used

- useMemo

### Dependencies

```typescript
import React, { useMemo } from 'react';
```
```typescript
import {
```
```typescript
import { Box, Typography, useTheme } from '@mui/material';
```
```typescript
import { formatDate, parseDate } from '../../utils/dateUtils';
```

---

## MetricsSummary

**File:** `components\analytics\MetricsSummary.tsx`

### Props

```typescript
metric: string;
  data: any[];
  loading: boolean;
```

### Hooks Used

- useMemo

### Dependencies

```typescript
import React, { useMemo } from 'react';
```
```typescript
import { Card, CardContent, Typography, Box, Skeleton, useTheme } from '@mui/material';
```
```typescript
import {
```

---

## MetricsTable

**File:** `components\analytics\MetricsTable.tsx`

### Props

```typescript
data: any[];
  metrics: string[];
  loading: boolean;
```

### Hooks Used

- useState
- useMemo

### Dependencies

```typescript
import React, { useState, useMemo } from 'react';
```
```typescript
import {
```
```typescript
import { visuallyHidden } from '@mui/utils';
```

---

## AnomalyDetection

**File:** `components\ml\AnomalyDetection.tsx`

### Props

```typescript
onAnomalyDetected: (anomalies: any) => void;
```

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import React, { useState, useEffect } from 'react';
```
```typescript
import {
```
```typescript
import { MLService } from '../../services/ml.service';
```
```typescript
import {
```

---

## MLDashboard

**File:** `components\ml\MLDashboard.tsx`

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import React, { useState, useEffect } from 'react';
```
```typescript
import { Box, Grid, Typography, CircularProgress } from '@mui/material';
```
```typescript
import { useTheme } from '@mui/material/styles';
```
```typescript
import { MLService } from '../../services/ml.service';
```
```typescript
import { ModelMetrics } from './ModelMetrics';
```
```typescript
import { ShotPrediction } from './ShotPrediction';
```
```typescript
import { PatternRecognition } from './PatternRecognition';
```
```typescript
import { AnomalyDetection } from './AnomalyDetection';
```
```typescript
import { TrainingPlan } from './TrainingPlan';
```
```typescript
import { ErrorBoundary } from '../common/ErrorBoundary';
```

---

## ModelMetrics

**File:** `components\ml\ModelMetrics.tsx`

### Props

```typescript
modelId: string | null;
  metrics: any;
  models: any[];
  onModelSelect: (modelId: string) => void;
```

### Dependencies

```typescript
import React from 'react';
```
```typescript
import {
```
```typescript
import {
```
```typescript
importance: metrics.feature_importance.importance[index],
```

---

## PatternRecognition

**File:** `components\ml\PatternRecognition.tsx`

### Props

```typescript
modelId: string | null;
  onPatternDetected: (pattern: any) => void;
```

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import React, { useState, useEffect } from 'react';
```
```typescript
import {
```
```typescript
import { MLService } from '../../services/ml.service';
```
```typescript
import {
```

---

## ShotPrediction

**File:** `components\ml\ShotPrediction.tsx`

### Props

```typescript
modelId: string | null;
  onPrediction: (prediction: any) => void;
```

### Hooks Used

- useState

### Dependencies

```typescript
import React, { useState } from 'react';
```
```typescript
import {
```
```typescript
import { MLService } from '../../services/ml.service';
```

---

## TrainingPlan

**File:** `components\ml\TrainingPlan.tsx`

### Props

```typescript
metrics: any;
  onPlanGenerated: (plan: any) => void;
```

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import React, { useState, useEffect } from 'react';
```
```typescript
import {
```
```typescript
import {
```
```typescript
import { MLService } from '../../services/ml.service';
```
```typescript
import {
```

---

## MetricsChart

**File:** `components\performance\MetricsChart.tsx`

### Props

```typescript
data: Array<{
    timestamp: string;
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    network_io_rate: number;
```

### Dependencies

```typescript
import React from 'react';
```
```typescript
import { Box, Paper, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';
```
```typescript
import {
```

---

## OptimizationRecommendations

**File:** `components\performance\OptimizationRecommendations.tsx`

### Props

```typescript
recommendations: Recommendation[];
```

### Dependencies

```typescript
import React from 'react';
```
```typescript
import {
```
```typescript
import {
```

---

## PerformanceDashboard

**File:** `components\performance\PerformanceDashboard.tsx`

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import React, { useState, useEffect } from 'react';
```
```typescript
import { Box, Container, Grid } from '@mui/material';
```
```typescript
import { SystemStatus } from './SystemStatus';
```
```typescript
import { MetricsChart } from './MetricsChart';
```
```typescript
import { OptimizationRecommendations } from './OptimizationRecommendations';
```
```typescript
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';
```

---

## SystemStatus

**File:** `components\performance\SystemStatus.tsx`

### Props

```typescript
status: {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    network_io: {
      bytes_sent: number;
      bytes_recv: number;
      packets_sent: number;
      packets_recv: number;
```

### Dependencies

```typescript
import React from 'react';
```
```typescript
import { Box, Grid, Paper, Typography, LinearProgress, Tooltip } from '@mui/material';
```
```typescript
import {
```

---

## PredictiveDashboard

**File:** `components\predictive\PredictiveDashboard.tsx`

### Props

```typescript
children?: React.ReactNode;
  index: number;
  value: number;
```

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import React, { useState, useEffect } from 'react';
```
```typescript
import { Box, Grid, Typography, CircularProgress, Paper, Tabs, Tab } from '@mui/material';
```
```typescript
import { useTheme } from '@mui/material/styles';
```
```typescript
import { PerformanceForecast } from './PerformanceForecast';
```
```typescript
import { SkillProgression } from './SkillProgression';
```
```typescript
import { MatchupPrediction } from './MatchupPrediction';
```
```typescript
import { ModelMetrics } from './ModelMetrics';
```
```typescript
import { ErrorBoundary } from '../common/ErrorBoundary';
```
```typescript
import { usePredictiveAnalytics } from '../../hooks/usePredictiveAnalytics';
```

---

## ABTestResults

**File:** `frontend\components\ABTestResults.tsx`

### Props

```typescript
testId: string;
    refreshInterval?: number;
```

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import React, { useEffect, useState } from 'react';
```
```typescript
import { abTestingService } from '../services/abTesting';
```

---

## AnimatedAvatar

**File:** `frontend\components\AnimatedAvatar.tsx`

### Props

```typescript
userId: number;
  size?: number;
  defaultAnimation?: string;
  onAnimationComplete?: () => void;
  className?: string;
```

### Hooks Used

- useState
- useEffect
- useRef
- useCallback

### Dependencies

```typescript
import React, { useState, useEffect, useCallback, useRef } from 'react';
```
```typescript
import lottie from 'lottie-web';
```
```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
```
```typescript
import { Avatar, Box, CircularProgress, IconButton, Menu, MenuItem } from '@mui/material';
```
```typescript
import { PlayArrow, Pause, Loop, Stop } from '@mui/icons-material';
```
```typescript
import { styled } from '@mui/material/styles';
```

---

## AuthCallback

**File:** `frontend\components\AuthCallback.tsx`

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import React, { useEffect, useState } from 'react';
```
```typescript
import { useNavigate } from 'react-router-dom';
```
```typescript
import { authService } from '../services/auth';
```

---

## ProtectedRoute

**File:** `frontend\components\ProtectedRoute.tsx`

### Props

```typescript
children: React.ReactNode;
    requireAuth?: boolean;
```

### Dependencies

```typescript
import React from 'react';
```
```typescript
import { Navigate, useLocation } from 'react-router-dom';
```
```typescript
import { useAuth } from '../contexts/AuthContext';
```

---

## AuthContext

**File:** `frontend\contexts\AuthContext.tsx`

### Hooks Used

- useState
- useEffect
- useContext

### Dependencies

```typescript
import { User } from 'firebase/auth';
```
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
```
```typescript
import { authService } from '../services/auth';
```

---

## DojoDiscovery

**File:** `frontend\pages\DojoDiscovery.tsx`

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import React, { useState, useEffect } from 'react';
```
```typescript
import {
```
```typescript
import { styled } from '@mui/material/styles';
```
```typescript
import DojoMap from '../components/DojoMap/DojoMap';
```
```typescript
import { AnimatedAvatar } from '../components/Avatar';
```

---

## TournamentManagement

**File:** `frontend\pages\TournamentManagement.tsx`

### Props

```typescript
children?: React.ReactNode;
  index: number;
  value: number;
```

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import React, { useEffect, useState } from 'react';
```
```typescript
import {
```
```typescript
import { DateTimePicker } from '@mui/x-date-pickers';
```
```typescript
import { Add as AddIcon } from '@mui/icons-material';
```
```typescript
import TournamentBracket from '../components/Tournament/TournamentBracket';
```
```typescript
import { Tournament, TournamentMatch } from '../../types/tournament';
```
```typescript
import { useAuth } from '../hooks/useAuth';
```
```typescript
import { api } from '../services/api';
```

---

## TournamentRoutes

**File:** `frontend\routes\TournamentRoutes.tsx`

### Dependencies

```typescript
import React from 'react';
```
```typescript
import { Routes, Route } from 'react-router-dom';
```
```typescript
import TournamentList from '../components/tournaments/TournamentList';
```
```typescript
import TournamentDetail from '../components/tournaments/TournamentDetail';
```
```typescript
import TournamentForm from '../components/tournaments/TournamentForm';
```
```typescript
import { PrivateRoute } from './PrivateRoute';
```

---

## VenueRoutes

**File:** `frontend\routes\VenueRoutes.tsx`

### Dependencies

```typescript
import React from 'react';
```
```typescript
import { Routes, Route } from 'react-router-dom';
```
```typescript
import VenueList from '../components/venues/VenueList';
```
```typescript
import VenueDetail from '../components/venues/VenueDetail';
```
```typescript
import PrivateRoute from './PrivateRoute';
```

---

## App

**File:** `frontend\src\App.tsx`

### Dependencies

```typescript
import React from 'react';
```
```typescript
import { Route, Routes } from 'react-router-dom';
```
```typescript
import Home from './components/Pages/Home.tsx';
```

---

## index

**File:** `frontend\src\index.tsx`

### Dependencies

```typescript
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
```
```typescript
import React from 'react';
```
```typescript
import ReactDOM from 'react-dom/client';
```
```typescript
import { BrowserRouter } from 'react-router-dom';
```
```typescript
import App from './App.tsx';
```

---

## PerformancePredictor

**File:** `frontend\components\AI\PerformancePredictor.tsx`

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import React, { useEffect, useState } from 'react';
```
```typescript
import {
```
```typescript
import { styled } from '@mui/material/styles';
```
```typescript
import {
```
```typescript
import { api } from '../../services/api';
```

---

## PlayerRecommender

**File:** `frontend\components\AI\PlayerRecommender.tsx`

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import React, { useState, useEffect } from 'react';
```
```typescript
import {
```
```typescript
import { styled } from '@mui/material/styles';
```
```typescript
import { PersonAdd } from '@mui/icons-material';
```
```typescript
import { api } from '../../services/api';
```

---

## ShotAnalyzer

**File:** `frontend\components\AI\ShotAnalyzer.tsx`

### Hooks Used

- useState

### Dependencies

```typescript
import React, { useState } from 'react';
```
```typescript
import {
```
```typescript
import { styled } from '@mui/material/styles';
```
```typescript
import { PhotoCamera } from '@mui/icons-material';
```
```typescript
import { api } from '../../services/api';
```

---

## Login

**File:** `frontend\components\Auth\Login.tsx`

### Hooks Used

- useState

### Dependencies

```typescript
import { useState } from 'react';
```
```typescript
import { useNavigate, Link as RouterLink } from 'react-router-dom';
```
```typescript
import {
```
```typescript
import { useAuth } from '@/contexts/AuthContext';
```

---

## PrivateRoute

**File:** `frontend\components\Auth\PrivateRoute.tsx`

### Props

```typescript
children: React.ReactNode;
```

### Dependencies

```typescript
import { Navigate, useLocation } from 'react-router-dom';
```
```typescript
import { useAuth } from '@/contexts/AuthContext';
```

---

## Register

**File:** `frontend\components\Auth\Register.tsx`

### Hooks Used

- useState

### Dependencies

```typescript
import { useState } from 'react';
```
```typescript
import { useNavigate, Link as RouterLink } from 'react-router-dom';
```
```typescript
import {
```
```typescript
import { useAuth } from '@/contexts/AuthContext';
```

---

## AvatarDisplay

**File:** `frontend\components\Avatar\AvatarDisplay.tsx`

### Props

```typescript
avatarUrl?: string | null;
  username: string;
  size?: number;
  editable?: boolean;
  onEdit?: () => void;
  showStatus?: boolean;
  isOnline?: boolean;
  className?: string;
```

### Dependencies

```typescript
import React from 'react';
```
```typescript
import { Avatar as MuiAvatar, Badge, IconButton, Tooltip } from '@mui/material';
```
```typescript
import { styled } from '@mui/material/styles';
```
```typescript
import EditIcon from '@mui/icons-material/Edit';
```

---

## AvatarEditDialog

**File:** `frontend\components\Avatar\AvatarEditDialog.tsx`

### Props

```typescript
open: boolean;
  onClose: () => void;
  onAvatarChange: (avatarUrl: string) => void;
  currentAvatarUrl?: string;
```

### Dependencies

```typescript
import React from 'react';
```
```typescript
import {
```
```typescript
import CloseIcon from '@mui/icons-material/Close';
```
```typescript
import AvatarGenerator from './AvatarGenerator';
```

---

## AvatarGenerator

**File:** `frontend\components\Avatar\AvatarGenerator.tsx`

### Props

```typescript
onAvatarGenerated: (avatarUrl: string) => void;
  currentAvatarUrl?: string;
```

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import React, { useState, useEffect } from 'react';
```
```typescript
import {
```
```typescript
import { styled } from '@mui/material/styles';
```

---

## DojoMap

**File:** `frontend\components\DojoMap\DojoMap.tsx`

### Props

```typescript
apiKey: string;
  center?: { lat: number; lng: number
```

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import React, { useState, useEffect } from 'react';
```
```typescript
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
```
```typescript
import { Box, Paper, Typography, Button, CircularProgress } from '@mui/material';
```
```typescript
import { styled } from '@mui/material/styles';
```

---

## ErrorBoundary

**File:** `frontend\components\ErrorBoundary\ErrorBoundary.tsx`

### Dependencies

```typescript
import { BugReport as BugReportIcon, Refresh as RefreshIcon } from '@mui/icons-material';
```
```typescript
import { Box, Button, Container, Paper, Typography } from '@mui/material';
```
```typescript
import React, { Component, ErrorInfo } from 'react';
```
```typescript
import { logError } from '../../utils/errorHandling';
```

---

## EventList

**File:** `frontend\components\events\EventList.tsx`

### Props

```typescript
events?: VenueEvent[];
  loading?: boolean;
  venueId: number;
```

### Hooks Used

- useState

### Dependencies

```typescript
import React, { useState } from 'react';
```
```typescript
import {
```
```typescript
import { PlusOutlined } from '@ant-design/icons';
```
```typescript
import { useMutation, useQueryClient } from 'react-query';
```
```typescript
import moment from 'moment';
```
```typescript
import { createEvent, registerForEvent } from '../../api/venues';
```
```typescript
import { VenueEvent } from '../../types/venue';
```
```typescript
import { useAuth } from '../../hooks/useAuth';
```

---

## GameAnalyzer

**File:** `frontend\components\GameAnalysis\GameAnalyzer.tsx`

### Props

```typescript
gameId: number;
```

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import React, { useState, useEffect } from 'react';
```
```typescript
import {
```
```typescript
import { styled } from '@mui/material/styles';
```
```typescript
import { ShotAnalysis } from './ShotAnalysis';
```
```typescript
import { GamePatterns } from './GamePatterns';
```
```typescript
import { GameStatistics } from './GameStatistics';
```
```typescript
import { api } from '../../services/api';
```

---

## GamePatterns

**File:** `frontend\components\GameAnalysis\GamePatterns.tsx`

### Props

```typescript
patterns: {
    shot_distribution: any;
    player_positioning: any;
    common_sequences: any[];
    success_patterns: any;
```

### Dependencies

```typescript
import React from 'react';
```
```typescript
import {
```
```typescript
import { TrendingUp, LocationOn, Repeat, EmojiEvents } from '@mui/icons-material';
```
```typescript
import { styled } from '@mui/material/styles';
```

---

## GameStatistics

**File:** `frontend\components\GameAnalysis\GameStatistics.tsx`

### Props

```typescript
statistics: {
    shot_stats: any;
    positional_stats: any;
    scoring_stats: any;
    player_stats: any;
```

### Dependencies

```typescript
import React from 'react';
```
```typescript
import {
```
```typescript
import {
```
```typescript
import { styled } from '@mui/material/styles';
```

---

## ShotAnalysis

**File:** `frontend\components\GameAnalysis\ShotAnalysis.tsx`

### Props

```typescript
gameId: number;
```

### Hooks Used

- useState

### Dependencies

```typescript
import React, { useState } from 'react';
```
```typescript
import {
```
```typescript
import { Speed, GpsFixed, RotateRight, Timeline } from '@mui/icons-material';
```
```typescript
import { styled } from '@mui/material/styles';
```

---

## Navbar

**File:** `frontend\components\Layout\Navbar.tsx`

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import { useState, useEffect } from 'react';
```
```typescript
import { Link as RouterLink } from 'react-router-dom';
```
```typescript
import {
```
```typescript
import MenuIcon from '@mui/icons-material/Menu';
```
```typescript
import LogoutIcon from '@mui/icons-material/Logout';
```
```typescript
import { useAuth } from '@/contexts/AuthContext';
```
```typescript
import NotificationCenter from './NotificationCenter';
```
```typescript
import notificationService from '../../services/notification';
```

---

## NotificationCenter

**File:** `frontend\components\Layout\NotificationCenter.tsx`

### Props

```typescript
className?: string;
```

### Hooks Used

- useState
- useEffect
- useCallback

### Dependencies

```typescript
import { useState, useEffect, useCallback } from 'react';
```
```typescript
import {
```
```typescript
import {
```
```typescript
import notificationService from '../../services/notification';
```
```typescript
import { formatDistanceToNow } from 'date-fns';
```

---

## GameMap

**File:** `frontend\components\Map\GameMap.tsx`

### Props

```typescript
currentLocation: Location;
  onLocationUpdate?: (location: Location) => void;
  otherPlayerLocations?: Record<string, Location>;
```

### Hooks Used

- useEffect
- useRef
- useCallback

### Dependencies

```typescript
import { useCallback, useEffect, useRef } from 'react';
```
```typescript
import { GoogleMap, LoadScript, Circle } from '@react-google-maps/api';
```
```typescript
import { useTheme } from '@mui/material';
```
```typescript
import { Location } from '@/utils/location';
```
```typescript
import {
```

---

## MarketplaceGrid

**File:** `frontend\components\marketplace\MarketplaceGrid.tsx`

### Props

```typescript
items: MarketplaceItem[];
  onItemClick: (item: MarketplaceItem) => void;
```

### Dependencies

```typescript
import React from 'react';
```
```typescript
import './MarketplaceGrid.css';
```

---

## MarketplaceLayout

**File:** `frontend\components\marketplace\MarketplaceLayout.tsx`

### Hooks Used

- useState
- useCallback

### Dependencies

```typescript
import React, { useState, useCallback } from 'react';
```
```typescript
import { Outlet, useNavigate } from 'react-router-dom';
```
```typescript
import './MarketplaceLayout.css';
```

---

## LiveMatch

**File:** `frontend\components\matches\LiveMatch.tsx`

### Props

```typescript
matchId: string;
  onScoreUpdate?: (score: any) => void;
```

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import React, { useEffect, useState } from 'react';
```
```typescript
import { LiveMatch } from '../../services/match-updates';
```
```typescript
import matchUpdateService from '../../services/match-updates';
```
```typescript
import { formatTimestamp } from '../../utils/date';
```
```typescript
import './LiveMatch.css';
```

---

## AlertPanel

**File:** `frontend\components\Monitoring\AlertPanel.tsx`

### Props

```typescript
gameId?: string;
  onAlertAcknowledge?: (alert: AlertType) => void;
```

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import React, { useState, useEffect } from 'react';
```
```typescript
import {
```
```typescript
import {
```
```typescript
import { Alert as AlertType } from '../../types/monitoring';
```
```typescript
import { gameMetricsMonitor } from '../../utils/monitoring';
```

---

## Dashboard

**File:** `frontend\components\Monitoring\Dashboard.tsx`

### Props

```typescript
children?: React.ReactNode;
  index: number;
  value: number;
```

### Hooks Used

- useState
- useEffect
- useMemo
- useCallback

### Dependencies

```typescript
import {
```
```typescript
import {
```
```typescript
import { saveAs } from 'file-saver';
```
```typescript
import html2canvas from 'html2canvas';
```
```typescript
import jsPDF from 'jspdf';
```
```typescript
import React, { useCallback, useEffect, useMemo, useState } from 'react';
```
```typescript
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
```
```typescript
import {
```
```typescript
import { Alert, ErrorEvent, MetricData } from '../../types/monitoring';
```
```typescript
import { ErrorTracker } from '../../utils/errorTracker';
```
```typescript
import { gameMetricsMonitor } from '../../utils/monitoring';
```
```typescript
import { ErrorBoundary } from './ErrorBoundary';
```
```typescript
import { MetricsChart } from './MetricsChart';
```

---

## ErrorBoundary

**File:** `frontend\components\Monitoring\ErrorBoundary.tsx`

### Dependencies

```typescript
import React, { Component, ErrorInfo } from 'react';
```
```typescript
import { ErrorTracker } from '../../utils/monitoring';
```

---

## ErrorReport

**File:** `frontend\components\Monitoring\ErrorReport.tsx`

### Props

```typescript
gameId?: string;
  onErrorClick?: (error: ErrorEvent) => void;
```

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import React, { useState, useEffect } from 'react';
```
```typescript
import {
```
```typescript
import {
```
```typescript
import { gameMetricsMonitor } from '../../utils/monitoring';
```

---

## MetricsChart

**File:** `frontend\components\Monitoring\MetricsChart.tsx`

### Props

```typescript
gameId?: string;
  refreshInterval?: number;
```

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import React, { useEffect, useState } from 'react';
```
```typescript
import {
```
```typescript
import {
```
```typescript
import { MetricData, MetricsSnapshot } from '../../types/monitoring';
```
```typescript
import { gameMetricsMonitor } from '../../utils/monitoring';
```

---

## Toast

**File:** `frontend\components\Notifications\Toast.tsx`

### Props

```typescript
autoHideDuration?: number;
```

### Dependencies

```typescript
import { Alert, AlertColor, Box, Snackbar, Typography } from '@mui/material';
```
```typescript
import React from 'react';
```
```typescript
import { useNotifications } from '../../hooks/useNotifications';
```

---

## Leaderboard

**File:** `frontend\components\Pages\Leaderboard.tsx`

### Props

```typescript
children?: React.ReactNode;
  index: number;
  value: number;
```

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import { useState, useEffect } from 'react';
```
```typescript
import {
```
```typescript
import {
```

---

## QRDialog

**File:** `frontend\components\QRCode\QRDialog.tsx`

### Props

```typescript
open: boolean;
  onClose: () => void;
  onScan?: (data: string) => void;
  qrCode?: string;
  tableNumber?: number;
  mode?: 'scan' | 'display' | 'both';
  title?: string;
```

### Hooks Used

- useState

### Dependencies

```typescript
import React, { useState } from 'react';
```
```typescript
import {
```
```typescript
import QRScanner from './QRScanner';
```
```typescript
import QRDisplay from './QRDisplay';
```

---

## QRDisplay

**File:** `frontend\components\QRCode\QRDisplay.tsx`

### Props

```typescript
qrCode: string;
  title?: string;
  tableNumber?: number;
  onDownload?: () => void;
```

### Dependencies

```typescript
import React from 'react';
```
```typescript
import { Box, Button, Paper, Typography } from '@mui/material';
```
```typescript
import { styled } from '@mui/material/styles';
```
```typescript
import DownloadIcon from '@mui/icons-material/Download';
```

---

## QRScanner

**File:** `frontend\components\QRCode\QRScanner.tsx`

### Props

```typescript
onScan: (data: string) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
```

### Hooks Used

- useState
- useEffect
- useRef

### Dependencies

```typescript
import React, { useState, useEffect, useRef } from 'react';
```
```typescript
import { Box, Button, CircularProgress, Typography } from '@mui/material';
```
```typescript
import { styled } from '@mui/material/styles';
```
```typescript
import QrScanner from 'qr-scanner';
```

---

## TournamentBracket

**File:** `frontend\components\Tournament\TournamentBracket.tsx`

### Props

```typescript
tournament: Tournament;
  onMatchClick?: (match: TournamentMatch) => void;
```

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import React, { useEffect, useState } from 'react';
```
```typescript
import { Box, Typography, Paper, Grid, Button, Chip } from '@mui/material';
```
```typescript
import { styled } from '@mui/material/styles';
```
```typescript
import { Tournament, TournamentMatch, TournamentParticipant } from '../../types/tournament';
```

---

## MatchStats

**File:** `frontend\components\tournaments\MatchStats.tsx`

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import React, { useState, useEffect } from 'react';
```
```typescript
import { Card, Table, Statistic, Row, Col, Timeline, Tag } from 'antd';
```
```typescript
import {
```
```typescript
import moment from 'moment';
```
```typescript
import { TournamentMatch, TournamentParticipant } from '../../types/tournament';
```
```typescript
import { getMatchHistory, getParticipantStats } from '../../api/tournaments';
```

---

## PrizeManagement

**File:** `frontend\components\tournaments\PrizeManagement.tsx`

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import React, { useState, useEffect } from 'react';
```
```typescript
import { Card, Table, Button, Tag, Modal, message, Tabs } from 'antd';
```
```typescript
import { TrophyOutlined, DollarOutlined, CheckOutlined } from '@ant-design/icons';
```
```typescript
import moment from 'moment';
```
```typescript
import { useAuth } from '../../hooks/useAuth';
```
```typescript
import { getUnclaimedPrizes, getPrizeHistory, claimPrize } from '../../api/tournaments';
```

---

## TournamentBracket

**File:** `frontend\components\tournaments\TournamentBracket.tsx`

### Hooks Used

- useMemo

### Dependencies

```typescript
import React, { useMemo } from 'react';
```
```typescript
import { Card, Tag } from 'antd';
```
```typescript
import { TournamentMatch, TournamentParticipant } from '../../types/tournament';
```

---

## TournamentDetail

**File:** `frontend\components\tournaments\TournamentDetail.tsx`

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import React, { useState, useEffect } from 'react';
```
```typescript
import { useParams, useNavigate } from 'react-router-dom';
```
```typescript
import {
```
```typescript
import {
```
```typescript
import moment from 'moment';
```
```typescript
import {
```
```typescript
import {
```
```typescript
import { useAuth } from '../../hooks/useAuth';
```
```typescript
import TournamentBracket from './TournamentBracket';
```
```typescript
import MatchStats from './MatchStats';
```

---

## TournamentForm

**File:** `frontend\components\tournaments\TournamentForm.tsx`

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import React, { useState, useEffect } from 'react';
```
```typescript
import { useNavigate, useParams } from 'react-router-dom';
```
```typescript
import { Form, Input, Select, DatePicker, InputNumber, Button, Card, message, Space } from 'antd';
```
```typescript
import moment from 'moment';
```
```typescript
import { Tournament, TournamentFormat, CreateTournamentData } from '../../types/tournament';
```
```typescript
import { createTournament, getTournament, updateTournament } from '../../api/tournaments';
```

---

## TournamentList

**File:** `frontend\components\tournaments\TournamentList.tsx`

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import React, { useState, useEffect } from 'react';
```
```typescript
import { Link } from 'react-router-dom';
```
```typescript
import { Table, Button, Space, Tag, Input, Select, DatePicker } from 'antd';
```
```typescript
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
```
```typescript
import moment from 'moment';
```
```typescript
import { Tournament, TournamentStatus, TournamentFormat } from '../../types/tournament';
```
```typescript
import { getTournaments } from '../../api/tournaments';
```
```typescript
import { useAuth } from '../../hooks/useAuth';
```

---

## ExerciseList

**File:** `frontend\components\Training\ExerciseList.tsx`

### Dependencies

```typescript
import React from 'react';
```
```typescript
import {
```
```typescript
import { styled } from '@mui/material/styles';
```
```typescript
import { FitnessCenter, Speed, Gavel, Timeline } from '@mui/icons-material';
```

---

## ProgressChart

**File:** `frontend\components\Training\ProgressChart.tsx`

### Dependencies

```typescript
import React from 'react';
```
```typescript
import {
```
```typescript
import { Box, useTheme } from '@mui/material';
```

---

## TrainingDashboard

**File:** `frontend\components\Training\TrainingDashboard.tsx`

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import React, { useState, useEffect } from 'react';
```
```typescript
import {
```
```typescript
import { styled } from '@mui/material/styles';
```
```typescript
import { FitnessCenter, Timeline, CheckCircle, ArrowForward } from '@mui/icons-material';
```
```typescript
import { api } from '../../services/api';
```
```typescript
import { ProgressChart } from './ProgressChart';
```
```typescript
import { ExerciseList } from './ExerciseList';
```

---

## CheckInSystem

**File:** `frontend\components\venues\CheckInSystem.tsx`

### Props

```typescript
venueId: number;
  venueName: string;
```

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import React, { useState, useEffect } from 'react';
```
```typescript
import {
```
```typescript
import {
```
```typescript
import moment from 'moment';
```
```typescript
import { Line } from '@ant-design/charts';
```
```typescript
import { useAuth } from '../../hooks/useAuth';
```
```typescript
import {
```

---

## EventManagement

**File:** `frontend\components\venues\EventManagement.tsx`

### Props

```typescript
venueId: number;
  venueName: string;
  isOwner?: boolean;
```

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import React, { useState, useEffect } from 'react';
```
```typescript
import {
```
```typescript
import {
```
```typescript
import moment from 'moment';
```
```typescript
import { useAuth } from '../../hooks/useAuth';
```
```typescript
import {
```

---

## LeaderboardList

**File:** `frontend\components\venues\LeaderboardList.tsx`

### Props

```typescript
venueId: number;
```

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import React, { useState, useEffect } from 'react';
```
```typescript
import {
```
```typescript
import {
```
```typescript
import moment from 'moment';
```
```typescript
import { useAuth } from '../../hooks/useAuth';
```
```typescript
import { getVenueLeaderboard, getUserStats } from '../../api/venues';
```

---

## VenueDetail

**File:** `frontend\components\venues\VenueDetail.tsx`

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import React, { useState, useEffect } from 'react';
```
```typescript
import { useParams } from 'react-router-dom';
```
```typescript
import { Card, Tabs, Descriptions, Tag, message } from 'antd';
```
```typescript
import {
```
```typescript
import { getVenue } from '../../api/venues';
```
```typescript
import CheckInSystem from './CheckInSystem';
```
```typescript
import LeaderboardList from './LeaderboardList';
```
```typescript
import EventList from '../events/EventList';
```
```typescript
import LoadingSpinner from '../common/LoadingSpinner';
```

---

## VenueList

**File:** `frontend\components\venues\VenueList.tsx`

### Props

```typescript
onVenueSelect?: (venue: Venue) => void;
```

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import React, { useState, useEffect } from 'react';
```
```typescript
import { Link } from 'react-router-dom';
```
```typescript
import { Card, Row, Col, Input, Select, Pagination, Empty, Spin } from 'antd';
```
```typescript
import { SearchOutlined } from '@ant-design/icons';
```
```typescript
import { useQuery } from 'react-query';
```
```typescript
import { getVenues } from '../../api/venues';
```
```typescript
import { Venue } from '../../types/venue';
```

---

## GameMap.test

**File:** `frontend\components\Map\__tests__\GameMap.test.tsx`

### Dependencies

```typescript
import { render, screen } from '@testing-library/react';
```
```typescript
import { ThemeProvider } from '@mui/material';
```
```typescript
import { theme } from '@/theme';
```
```typescript
import GameMap from '../GameMap';
```

---

## LiveMatch.test

**File:** `frontend\components\matches\__tests__\LiveMatch.test.tsx`

### Dependencies

```typescript
import React from 'react';
```
```typescript
import { render, screen, act } from '@testing-library/react';
```
```typescript
import { LiveMatchDisplay } from '../LiveMatch';
```
```typescript
import matchUpdateService from '../../../services/match-updates';
```

---

## Dashboard.test

**File:** `frontend\components\Monitoring\__tests__\Dashboard.test.tsx`

### Dependencies

```typescript
import React from 'react';
```
```typescript
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
```
```typescript
import MonitoringDashboard from '../Dashboard';
```
```typescript
import { ErrorTracker } from '../../../utils/monitoring';
```

---

## ErrorBoundary.test

**File:** `frontend\components\Monitoring\__tests__\ErrorBoundary.test.tsx`

### Dependencies

```typescript
import React from 'react';
```
```typescript
import { render, fireEvent, screen } from '@testing-library/react';
```
```typescript
import { ErrorBoundary } from '../ErrorBoundary';
```
```typescript
import { ErrorTracker } from '../../../utils/monitoring';
```

---

## integration.test

**File:** `frontend\components\Monitoring\__tests__\integration.test.tsx`

### Hooks Used

- useState

### Dependencies

```typescript
import React from 'react';
```
```typescript
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
```
```typescript
import MonitoringDashboard from '../Dashboard';
```
```typescript
import { ErrorBoundary } from '../ErrorBoundary';
```
```typescript
import { ErrorTracker, AuditLogger, RetryMechanism } from '../../../utils/monitoring';
```

---

## MarketplaceE2E.test

**File:** `frontend\components\__tests__\marketplace\MarketplaceE2E.test.tsx`

### Dependencies

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
```
```typescript
import userEvent from '@testing-library/user-event';
```
```typescript
import { BrowserRouter } from 'react-router-dom';
```
```typescript
import { MarketplaceLayout } from '../../marketplace/MarketplaceLayout';
```
```typescript
import { marketplaceService } from '../../../services/marketplace';
```

---

## Home

**File:** `frontend\src\components\Pages\Home.tsx`

### Dependencies

```typescript
import { Box, Button, Container, Typography } from '@mui/material';
```
```typescript
import React from 'react';
```

---

## RootNavigator

**File:** `mobile\navigation\RootNavigator.tsx`

### Hooks Used

- useState

### Dependencies

```typescript
import React from 'react';
```
```typescript
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
```
```typescript
import { createStackNavigator } from '@react-navigation/stack';
```
```typescript
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
```
```typescript
import LoginScreen from '../screens/auth/LoginScreen';
```
```typescript
import GameTrackingScreen from '../screens/game/GameTrackingScreen';
```
```typescript
import GameSummaryScreen from '../screens/game/GameSummaryScreen';
```
```typescript
import ProfileScreen from '../screens/profile/ProfileScreen';
```
```typescript
import LeaderboardScreen from '../screens/social/LeaderboardScreen';
```

---

## LoginScreen

**File:** `mobile\screens\auth\LoginScreen.tsx`

### Props

```typescript
navigation: any;
```

### Hooks Used

- useState

### Dependencies

```typescript
import React, { useState } from 'react';
```
```typescript
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
```
```typescript
import { Button, Input, Text, useTheme } from '@rneui/themed';
```
```typescript
import { SafeAreaView } from 'react-native-safe-area-context';
```
```typescript
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
```

---

## GameSummaryScreen

**File:** `mobile\screens\game\GameSummaryScreen.tsx`

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import React, { useState, useEffect } from 'react';
```
```typescript
import { View, ScrollView, StyleSheet } from 'react-native';
```
```typescript
import { Text, Card, Button, Badge } from '@rneui/themed';
```
```typescript
import { useRoute, useNavigation } from '@react-navigation/native';
```
```typescript
import { LineChart } from 'react-native-chart-kit';
```
```typescript
import Share from 'react-native-share';
```
```typescript
import SyncManager from '../../utils/sync';
```
```typescript
import StorageManager from '../../utils/storage';
```

---

## GameTrackingScreen

**File:** `mobile\screens\game\GameTrackingScreen.tsx`

### Hooks Used

- useState
- useEffect

### Dependencies

```typescript
import React, { useState, useEffect } from 'react';
```
```typescript
import { View, StyleSheet, Alert } from 'react-native';
```
```typescript
import { Text, Button } from '@rneui/themed';
```
```typescript
import { Camera } from 'react-native-vision-camera';
```
```typescript
import { useNavigation } from '@react-navigation/native';
```
```typescript
import axios from 'axios';
```
```typescript
import { API_URL } from '../../config';
```
```typescript
import SyncManager from '../../utils/sync';
```
```typescript
import StorageManager from '../../utils/storage';
```

---

## components.test

**File:** `tests\components\performance\components.test.tsx`

### Dependencies

```typescript
import React from 'react';
```
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
```
```typescript
import { SystemStatus } from '../../../components/performance/SystemStatus';
```
```typescript
import { MetricsChart } from '../../../components/performance/MetricsChart';
```
```typescript
import { OptimizationRecommendations } from '../../../components/performance/OptimizationRecommendations';
```

---

## PerformanceDashboard.test

**File:** `tests\components\performance\PerformanceDashboard.test.tsx`

### Dependencies

```typescript
import React from 'react';
```
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
```
```typescript
import { PerformanceDashboard } from '../../../components/performance/PerformanceDashboard';
```
```typescript
import { usePerformanceMonitor } from '../../../hooks/usePerformanceMonitor';
```

---

## test_predictive_dashboard

**File:** `tests\components\predictive\test_predictive_dashboard.tsx`

### Dependencies

```typescript
import React from 'react';
```
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
```
```typescript
import { PredictiveDashboard } from '../../../components/predictive/PredictiveDashboard';
```
```typescript
import { usePredictiveAnalytics } from '../../../hooks/usePredictiveAnalytics';
```
```typescript
import { ThemeProvider } from '@mui/material/styles';
```
```typescript
import { theme } from '../../../theme';
```

---

## errorTracker

**File:** `frontend\utils\errorTracker.ts`

### Dependencies

```typescript
import { AuditLogger } from './auditLogger';
```
```typescript
import { RetryMechanism } from './retryMechanism';
```

---

## monitoring

**File:** `frontend\utils\monitoring.ts`

### Dependencies

```typescript
import { MONITORING_CONFIG } from '../../constants';
```
```typescript
import { Cache } from './cache';
```

---

## errorTracker.test

**File:** `frontend\utils\__tests__\errorTracker.test.ts`

### Dependencies

```typescript
import { ErrorTracker } from '../monitoring';
```
```typescript
import { AuditLogger } from '../monitoring';
```

---

## monitoring.test

**File:** `frontend\utils\__tests__\monitoring.test.ts`

### Dependencies

```typescript
import { GameMetricsMonitor, ErrorTracker, AuditLogger, RetryMechanism } from '../monitoring';
```

---

## components

**File:** `static\js\components.js`

### Dependencies

```typescript
import { $, $$, ui } from './utils.js';
```

---

## review

**File:** `static\js\components\review.js`

---

