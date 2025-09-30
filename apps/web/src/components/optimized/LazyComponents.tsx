/**
 * Optimized Lazy Components
 *
 * Enhanced lazy-loaded components with proper loading states, error boundaries,
 * performance monitoring, and intelligent prefetching strategies.
 */

import dynamic from 'next/dynamic';
import React, { Suspense, useCallback, useEffect, useState } from 'react';
import {
  CircularProgress,
  Box,
  Typography,
  Alert,
  Button,
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
import ErrorBoundary from '@/components/Common/ErrorBoundary';

// Enhanced loading component with better UX
const LoadingSpinner: React.FC<{
  message?: string;
  size?: number;
  showProgress?: boolean;
}> = ({ message = 'Loading...', size = 40, showProgress = false }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (showProgress) {
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) return 0;
          return prev + 10;
        });
      }, 200);
      return () => clearInterval(timer);
    }
  }, [showProgress]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="200px"
      gap={2}
      sx={{ padding: 3 }}
    >
      <CircularProgress
        size={size}
        variant={showProgress ? 'determinate' : 'indeterminate'}
        value={showProgress ? progress : undefined}
      />
      <Typography variant="body2" color="text.secondary" textAlign="center">
        {message}
      </Typography>
      {showProgress && (
        <Typography variant="caption" color="text.secondary">
          {progress}%
        </Typography>
      )}
    </Box>
  );
};

// Enhanced error boundary for lazy components
const LazyErrorBoundary: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  componentName?: string;
}> = ({ children, fallback, componentName = 'Component' }) => {
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const handleRetry = useCallback(() => {
    if (retryCount < maxRetries) {
      setRetryCount((prev) => prev + 1);
      // Force re-render by updating key
      window.location.reload();
    }
  }, [retryCount]);

  const defaultFallback = (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="200px"
      gap={2}
      sx={{ padding: 3 }}
    >
      <Alert severity="error" sx={{ maxWidth: 400 }}>
        <Typography variant="h6" gutterBottom>
          Failed to load {componentName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Something went wrong while loading this component.
        </Typography>
      </Alert>
      {retryCount < maxRetries && (
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={handleRetry}
        >
          Retry ({maxRetries - retryCount} attempts left)
        </Button>
      )}
    </Box>
  );

  return (
    <ErrorBoundary
      fallback={fallback || defaultFallback}
      enableRecovery={retryCount < maxRetries}
    >
      {children}
    </ErrorBoundary>
  );
};

// Performance monitoring hook
const useComponentPerformance = (componentName: string) => {
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      setLoadTime(duration);

      // Log performance metrics
      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName} load time: ${duration.toFixed(2)}ms`);
      }
    };
  }, [componentName]);

  return { loadTime, error, setError };
};

// Enhanced lazy component wrapper
export const createLazyComponent = <P extends object = any>(
  importFunc: () => Promise<{ default: React.ComponentType<any> }>,
  options: {
    componentName?: string;
    loadingMessage?: string;
    showProgress?: boolean;
    fallback?: React.ReactNode;
  } = {}
) => {
  const {
    componentName = 'Component',
    loadingMessage = `Loading ${componentName}...`,
    showProgress = false,
    fallback,
  } = options;

  const LazyComponent = dynamic(importFunc, {
    ssr: false,
    loading: () => (
      <LoadingSpinner message={loadingMessage} showProgress={showProgress} />
    ),
  });

  const WrappedComponent: React.FC<P> = (props) => {
    const { loadTime } = useComponentPerformance(componentName);

    return (
      <LazyErrorBoundary componentName={componentName} fallback={fallback}>
        <Suspense
          fallback={
            <LoadingSpinner
              message={loadingMessage}
              showProgress={showProgress}
            />
          }
        >
          <LazyComponent {...props} />
        </Suspense>
      </LazyErrorBoundary>
    );
  };

  WrappedComponent.displayName = `Lazy${componentName}`;
  return WrappedComponent;
};

// Pre-configured lazy components for common use cases
export const LazyWorldHubMap = createLazyComponent(
  () =>
    import('@/components/world/refactored/RefactoredWorldHubMap').then(
      (module) => ({ default: module.default })
    ),
  {
    componentName: 'WorldHubMap',
    loadingMessage: 'Loading interactive map...',
    showProgress: true,
  }
);

export const LazyGameSessionView = createLazyComponent(
  () =>
    import('@/components/GameSession/GameSessionView').then((module) => ({
      default: module.default,
    })),
  {
    componentName: 'GameSessionView',
    loadingMessage: 'Loading game session...',
  }
);

export const LazyCMSDashboard = createLazyComponent(
  () =>
    import('@/components/CMS/CMSDashboard').then((module) => ({
      default: module.default,
    })),
  {
    componentName: 'CMSDashboard',
    loadingMessage: 'Loading admin dashboard...',
  }
);

export const LazyChatWindow = createLazyComponent(
  () =>
    import('@/components/chat/ChatWindow').then((module) => ({
      default: module.default,
    })),
  {
    componentName: 'ChatWindow',
    loadingMessage: 'Loading chat...',
  }
);

export const LazyClanProfile = createLazyComponent(
  () =>
    import('@/components/ClanProfile').then((module) => ({
      default: module.default,
    })),
  {
    componentName: 'ClanProfile',
    loadingMessage: 'Loading clan profile...',
  }
);

export const LazyVenueManagement = createLazyComponent(
  () =>
    import('@/components/venue/VenueManagementPortal').then((module) => ({
      default: module.default,
    })),
  {
    componentName: 'VenueManagement',
    loadingMessage: 'Loading venue management...',
  }
);

export const LazyTournamentList = createLazyComponent(
  () =>
    import('@/components/Tournament/TournamentList').then((module) => ({
      default: module.default,
    })),
  {
    componentName: 'TournamentList',
    loadingMessage: 'Loading tournaments...',
  }
);

export const LazyInventory = createLazyComponent(
  () =>
    import('@/components/Inventory/InventoryLayout').then((module) => ({
      default: module.default,
    })),
  {
    componentName: 'Inventory',
    loadingMessage: 'Loading inventory...',
  }
);

// Higher-order component for lazy loading
export const withLazyLoading = <P extends object>(
  Component: React.ComponentType<P>,
  options: {
    componentName?: string;
    loadingMessage?: string;
    showProgress?: boolean;
  } = {}
) => {
  const {
    componentName = Component.displayName || 'Component',
    loadingMessage = `Loading ${componentName}...`,
    showProgress = false,
  } = options;

  const LazyComponent = createLazyComponent(
    () => Promise.resolve({ default: Component }),
    { componentName, loadingMessage, showProgress }
  );

  return LazyComponent;
};

// Hook for prefetching components based on user behavior
export const useComponentPrefetch = () => {
  const [prefetchedComponents, setPrefetchedComponents] = useState<Set<string>>(
    new Set()
  );

  const prefetchComponent = useCallback(
    (componentName: string) => {
      if (prefetchedComponents.has(componentName)) return;

      // Prefetch component based on user behavior
      switch (componentName) {
        case 'map':
          import('@/components/world/refactored/RefactoredWorldHubMap');
          break;
        case 'game':
          import('@/components/GameSession/GameSessionView');
          break;
        case 'admin':
          import('@/components/CMS/CMSDashboard');
          break;
        case 'chat':
          import('@/components/chat/ChatWindow');
          break;
        case 'clan':
          import('@/components/ClanProfile');
          break;
        case 'venue':
          import('@/components/venue/VenueManagementPortal');
          break;
        case 'tournament':
          import('@/components/Tournament/TournamentList');
          break;
        case 'inventory':
          import('@/components/Inventory/InventoryLayout');
          break;
        default:
          break;
      }

      setPrefetchedComponents((prev) => new Set([...prev, componentName]));
    },
    [prefetchedComponents]
  );

  return { prefetchComponent, prefetchedComponents };
};

// Performance monitoring for lazy components
export const useLazyComponentPerformance = (componentName: string) => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    errorCount: 0,
    retryCount: 0,
  });

  const recordMetric = useCallback((metric: string, value: number) => {
    setMetrics((prev) => ({
      ...prev,
      [metric]: value,
    }));
  }, []);

  const incrementCounter = useCallback((counter: string) => {
    setMetrics((prev) => ({
      ...prev,
      [counter]: prev[counter as keyof typeof prev] + 1,
    }));
  }, []);

  return {
    metrics,
    recordMetric,
    incrementCounter,
  };
};

// Export all lazy components
export const LazyComponents = {
  WorldHubMap: LazyWorldHubMap,
  GameSessionView: LazyGameSessionView,
  CMSDashboard: LazyCMSDashboard,
  ChatWindow: LazyChatWindow,
  ClanProfile: LazyClanProfile,
  VenueManagement: LazyVenueManagement,
  TournamentList: LazyTournamentList,
  Inventory: LazyInventory,
} as const;
