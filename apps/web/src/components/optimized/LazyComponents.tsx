/**
 * Optimized Lazy Components
 * 
 * Provides efficient lazy loading with:
 * - Prefetching strategies
 * - Loading states
 * - Error boundaries
 * - Bundle size optimization
 */

import React, { Suspense, ComponentType } from 'react';
import { ErrorBoundary } from '@/components/Common/LoadingSpinner';
import { CircularProgress, Box, Alert } from '@mui/material';

interface LazyComponentOptions {
  fallback?: React.ComponentType;
  errorBoundary?: ComponentType<{ children: React.ReactNode; error?: Error }>;
  prefetch?: boolean;
  retries?: number;
  timeout?: number;
}

/**
 * Enhanced lazy component wrapper with advanced features
 */
export function createLazyComponent<T extends ComponentType<any>>({
  fallback: FallbackComponent,
  errorBoundary: ErrorBoundaryComponent = ErrorBoundary,
  prefetch = false,
  retries = 3,
  timeout = 10000,
  ...otherOptions
}: LazyComponentOptions = {}) {
  return function lazyWrapper<TProps extends object>(
    importFunc: () => Promise<{ default: T }>,
    componentName?: string
  ) {
    const LazyComponent = React.lazy(async () => {
      let retryCount = 0;
      
      while (retryCount <= retries) {
        try {
          const result = await Promise.race([
            importFunc(),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Import timeout')), timeout)
            )
          ]);
          
          return result;
        } catch (error) {
          retryCount++;
          
          if (retryCount > retries) {
            console.error(`Failed to load component ${componentName} after ${retries} retries:`, error);
            throw error;
          }
          
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
      
      throw new Error('Max retries exceeded');
    });

    const WrappedComponent = React.forwardRef<any, React.ComponentProps<T>>((props, ref) => (
      <ErrorBoundaryComponent 
        fallback={
          <Alert severity="error" sx={{ margin: 2 }}>
            Failed to load {componentName || 'component'}. Please refresh the page.
          </Alert>
        }
      >
        <Suspense 
          fallback={
            FallbackComponent ? (
              <FallbackComponent />
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
              </Box>
            )
          }
        >
          <LazyComponent {...props} ref={ref} />
        </Suspense>
      </ErrorBoundaryComponent>
    ));

    WrappedComponent.displayName = `LazyLoaded${componentName || 'Component'}`;
    
    // Add prefetching capability
    if (prefetch) {
      (WrappedComponent as any).prefetch = async () => {
        try {
          await importFunc();
        } catch (error) {
          console.warn('Prefetch failed:', error);
        }
      };
    }
    
    return WrappedComponent;
  };
}

/**
 * Specialized lazy component creator for maps
 */
export const createLazyMapComponent = createLazyComponent({
  errorBoundary: ({ children, error }) => (
    <Box display="flex" alignItems="center" justifyContent="center" height="400px">
      <Alert severity="error">
        Map failed to load: {error?.message || 'Unknown error'}
      </Alert>
    </Box>
  ),
  timeout: 15000,
  retries: 2,
});

/**
 * Specialized lazy component creator for heavy components
 */
export const createLazyHeavyComponent = createLazyComponent({
  timeout: 20000,
  retries: 3,
});

/**
 * Specialized lazy component creator for admin components
 */
export const createLazyAdminComponent = createLazyComponent({
  errorBoundary: ({ children, error }) => (
    <Box p={3}>
      <Alert severity="error" variant="outlined">
        Admin component failed to load: {error?.message || 'Unknown error'}
        <br />
        Please check your permissions and try refresh the page.
      </Alert>
    </Box>
  ),
  prefetch: true,
});

/**
 * Smart loading component with skeleton UI
 */
const SkeletonMap = () => (
  <Box
    width="100%"
    height="400px"
    bgcolor="grey.100"
    display="flex"
    alignItems="center"
    justifyContent="center"
    borderRadius={1}
  >
    <CircularProgress />
  </Box>
);

const SkeletonDashboard = () => (
  <Box p={3}>
    <Box width="100%" height="60px" bgcolor="grey.200" borderRadius={1} mb={2} />
    <Box display="flex" gap={2} mb={3}>
      {[...Array(4)].map((_, i) => (
        <Box key={i} flex={1} height="120px" bgcolor="grey.200" borderRadius={1} />
      ))}
    </Box>
    <Box height="300px" bgcolor="grey.100" borderRadius={1} />
  </Box>
);

const SkeletonForm = () => (
  <Box p={3}>
    {[...Array(6)].map((_, i) => (
      <Box
        key={i}
        width="100%"
        height="56px"
        bgcolor="grey.200"
        borderRadius={1}
        mb={2}
      />
    ))}
  </Box>
);

/**
 * Pre-created lazy components for common use cases
 */
export const LazyWorldHubMap = createLazyMapComponent(
  () => import('@/components/world/WorldHubMap'),
  'WorldHubMap'
);

export const LazyEnhancedWorldHubMap = createLazyMapComponent(
  () => import('@/components/world/EnhancedWorldHubMap'),
  'EnhancedWorldHubMap'
);

export const LazyRefactoredWorldHubMap = createLazyMapComponent(
  () => import('@/components/world/refactored/RefactoredWorldHubMap'),
  'RefactoredWorldHubMap'
);

export const LazyDashboard = createLazyHeavyComponent(
  () => import('@/components/Dashboard/PerformanceDashboard'),
  'PerformanceDashboard'
);

export const LazyInventory = createLazyHeavyComponent(
  () => import('@/components/Inventory/InventoryLayout'),
  'InventoryLayout'
);

export const LazyAdminPanel = createLazyAdminComponent(
  () => import('@/pages/admin'),
  'AdminPanel'
);

export const LazyTournamentManagement = createLazyHeavyComponent(
  () => import('@/components/venue/TournamentManagement'),
  'TournamentManagement'
);

export const LazyChatWindow = createLazyHeavyComponent(
  () => import('@/components/chat/ChatWindow'),
  'ChatWindow'
);

export const LazySocialFeed = createLazyHeavyComponent(
  () => import('@/components/Content/SocialFeed'),
  'SocialFeed'
);

/**
 * Component prefetching utilities
 */
export const prefetchComponents = {
  map: async () => {
    try {
      await import('@/components/world/WorldHubMap');
    } catch (error) {
      console.warn('Failed to prefetch map component:', error);
    }
  },
  
  dashboard: async () => {
    try {
      await import('@/components/Dashboard/PerformanceDashboard');
    } catch (error) {
      console.warn('Failed to prefetch dashboard component:', error);
    }
  },
  
  inventory: async () => {
    try {
      await import('@/components/Inventory/InventoryLayout');
    } catch (error) {
      console.warn('Failed to prefetch inventory component:', error);
    }
  },
  
  admin: async () => {
    try {
      await import('@/pages/admin');
    } catch (error) {
      console.warn('Failed to prefetch admin component:', error);
    }
  },
};

/**
 * Hook for prefetching components on user interaction
 */
export const usePrefetchComponents = () => {
  const [prefetchedComponents, setPrefetchedComponents] = React.useState<string[]>([]);
  
  const prefetch = React.useCallback(async (componentName: keyof typeof prefetchComponents) => {
    if (prefetchedComponents.includes(componentName)) return;
    
    try {
      await prefetchComponents[componentName]();
      setPrefetchedComponents(prev => [...prev, componentName]);
    } catch (error) {
      console.warn(`Failed to prefetch ${componentName}:`, error);
    }
  }, [prefetchedComponents]);
  
  return { prefetch, prefetchedComponents };
};

export default {
  createLazyComponent,
  createLazyMapComponent,
  createLazyHeavyComponent,
  createLazyAdminComponent,
  LazyWorldHubMap,
  LazyEnhancedWorldHubMap,
  LazyRefactoredWorldHubMap,
  LazyDashboard,
  LazyInventory,
  LazyAdminPanel,
  LazyTournamentManagement,
  LazyChatWindow,
  LazySocialFeed,
  prefetchComponents,
  usePrefetchComponents,
};
