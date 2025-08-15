import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Cloud, 
  CloudOff, 
  Zap, 
  Battery, 
  HardDrive,
  Settings,
  Activity,
  TrendingUp,
  Shield
} from 'lucide-react';

interface SyncStatus {
  isOnline: boolean;
  lastSync: number;
  pendingItems: number;
  syncInProgress: boolean;
  error: string | null;
}

interface PerformanceMetrics {
  appLaunchTime: number;
  screenLoadTime: number;
  memoryUsage: number;
  batteryLevel: number;
  networkLatency: number;
  timestamp: number;
}

interface OptimizationSettings {
  enableImageCompression: boolean;
  enableLazyLoading: boolean;
  enableBackgroundSync: boolean;
  enableOfflineMode: boolean;
  cacheStrategy: 'aggressive' | 'balanced' | 'minimal';
}

const MobileOptimizationPage: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    lastSync: Date.now(),
    pendingItems: 0,
    syncInProgress: false,
    error: null,
  });

  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics[]>([
    {
      appLaunchTime: 1200,
      screenLoadTime: 450,
      memoryUsage: 65,
      batteryLevel: 85,
      networkLatency: 120,
      timestamp: Date.now(),
    },
    {
      appLaunchTime: 1100,
      screenLoadTime: 420,
      memoryUsage: 62,
      batteryLevel: 82,
      networkLatency: 95,
      timestamp: Date.now() - 300000,
    },
  ]);

  const [settings, setSettings] = useState<OptimizationSettings>({
    enableImageCompression: true,
    enableLazyLoading: true,
    enableBackgroundSync: true,
    enableOfflineMode: true,
    cacheStrategy: 'balanced',
  });

  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Simulate real-time sync status updates
    const interval = setInterval(() => {
      setSyncStatus(prev => ({
        ...prev,
        lastSync: Date.now(),
        pendingItems: Math.max(0, prev.pendingItems - Math.floor(Math.random() * 3)),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getAverageMetrics = () => {
    if (performanceMetrics.length === 0) return null;

    const sum = performanceMetrics.reduce(
      (acc, metric) => ({
        appLaunchTime: acc.appLaunchTime + metric.appLaunchTime,
        screenLoadTime: acc.screenLoadTime + metric.screenLoadTime,
        memoryUsage: acc.memoryUsage + metric.memoryUsage,
        batteryLevel: acc.batteryLevel + metric.batteryLevel,
        networkLatency: acc.networkLatency + metric.networkLatency,
      }),
      {
        appLaunchTime: 0,
        screenLoadTime: 0,
        memoryUsage: 0,
        batteryLevel: 0,
        networkLatency: 0,
      }
    );

    const count = performanceMetrics.length;
    return {
      appLaunchTime: sum.appLaunchTime / count,
      screenLoadTime: sum.screenLoadTime / count,
      memoryUsage: sum.memoryUsage / count,
      batteryLevel: sum.batteryLevel / count,
      networkLatency: sum.networkLatency / count,
    };
  };

  const formatTime = (ms: number) => `${Math.round(ms)}ms`;
  const formatPercentage = (value: number) => `${Math.round(value)}%`;
  const formatLatency = (ms: number) => `${Math.round(ms)}ms`;

  const formatLastSync = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const averageMetrics = getAverageMetrics();

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="p-3 bg-white/20 rounded-full">
                  <Smartphone className="h-8 w-8" />
                </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Mobile App Optimization
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100">
                Advanced cross-platform synchronization with offline capabilities and real-time sync
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Badge variant="secondary" className="text-sm">
                  <Wifi className="h-4 w-4 mr-2" />
                  Real-time Sync
                </Badge>
                <Badge variant="secondary" className="text-sm">
                  <Cloud className="h-4 w-4 mr-2" />
                  Offline Support
                </Badge>
                <Badge variant="secondary" className="text-sm">
                  <Zap className="h-4 w-4 mr-2" />
                  Performance Optimized
                </Badge>
                <Badge variant="secondary" className="text-sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Secure
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sync">Sync Status</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
                    {syncStatus.isOnline ? (
                      <Wifi className="h-4 w-4 text-green-600" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-red-600" />
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {syncStatus.isOnline ? 'Online' : 'Offline'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {syncStatus.isOnline ? 'Connected to server' : 'Working offline'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Sync</CardTitle>
                    <Cloud className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{syncStatus.pendingItems}</div>
                    <p className="text-xs text-muted-foreground">
                      Items waiting to sync
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">App Performance</CardTitle>
                    <Activity className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {averageMetrics ? formatTime(averageMetrics.appLaunchTime) : 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Average launch time
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Battery Level</CardTitle>
                    <Battery className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {averageMetrics ? formatPercentage(averageMetrics.batteryLevel) : 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Current battery level
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Cloud className="h-5 w-5 mr-2" />
                      Offline Capabilities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Local data storage for offline access
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Automatic sync when connection restored
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Conflict resolution for data conflicts
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Queue management for pending operations
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Zap className="h-5 w-5 mr-2" />
                      Performance Optimization
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Intelligent caching strategies
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Image compression and lazy loading
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Battery-aware background sync
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Network latency optimization
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Sync Status Tab */}
            <TabsContent value="sync" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Real-time Sync Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Connection:</span>
                        <Badge variant={syncStatus.isOnline ? "default" : "destructive"}>
                          {syncStatus.isOnline ? 'Online' : 'Offline'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Last Sync:</span>
                        <span className="text-sm">{formatLastSync(syncStatus.lastSync)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Pending Items:</span>
                        <span className="text-sm">{syncStatus.pendingItems}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Sync Status:</span>
                        <Badge variant={syncStatus.syncInProgress ? "secondary" : "outline"}>
                          {syncStatus.syncInProgress ? 'In Progress' : 'Idle'}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Sync Progress</span>
                          <span className="text-sm text-muted-foreground">
                            {syncStatus.pendingItems > 0 ? 'Syncing...' : 'Complete'}
                          </span>
                        </div>
                        <Progress 
                          value={syncStatus.pendingItems > 0 ? 50 : 100} 
                          className="h-2"
                        />
                      </div>

                      {syncStatus.error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm text-red-600">{syncStatus.error}</p>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <Button size="sm" className="flex-1">
                          Force Sync
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          Clear Queue
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              {averageMetrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">App Launch Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatTime(averageMetrics.appLaunchTime)}
                      </div>
                      <Progress value={Math.min(100, (averageMetrics.appLaunchTime / 2000) * 100)} className="mt-2" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Screen Load Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {formatTime(averageMetrics.screenLoadTime)}
                      </div>
                      <Progress value={Math.min(100, (averageMetrics.screenLoadTime / 1000) * 100)} className="mt-2" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Memory Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">
                        {formatPercentage(averageMetrics.memoryUsage)}
                      </div>
                      <Progress value={averageMetrics.memoryUsage} className="mt-2" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Battery Level</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {formatPercentage(averageMetrics.batteryLevel)}
                      </div>
                      <Progress value={averageMetrics.batteryLevel} className="mt-2" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Network Latency</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">
                        {formatLatency(averageMetrics.networkLatency)}
                      </div>
                      <Progress value={Math.min(100, (averageMetrics.networkLatency / 500) * 100)} className="mt-2" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Performance Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-indigo-600">85/100</div>
                      <Progress value={85} className="mt-2" />
                    </CardContent>
                  </Card>
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Performance Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Performance trend chart would be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Optimization Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Image Compression</h4>
                        <p className="text-sm text-muted-foreground">
                          Automatically compress images to save bandwidth
                        </p>
                      </div>
                      <Button variant={settings.enableImageCompression ? "default" : "outline"} size="sm">
                        {settings.enableImageCompression ? "Enabled" : "Disabled"}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Lazy Loading</h4>
                        <p className="text-sm text-muted-foreground">
                          Load content on-demand to improve performance
                        </p>
                      </div>
                      <Button variant={settings.enableLazyLoading ? "default" : "outline"} size="sm">
                        {settings.enableLazyLoading ? "Enabled" : "Disabled"}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Background Sync</h4>
                        <p className="text-sm text-muted-foreground">
                          Sync data in the background when app is inactive
                        </p>
                      </div>
                      <Button variant={settings.enableBackgroundSync ? "default" : "outline"} size="sm">
                        {settings.enableBackgroundSync ? "Enabled" : "Disabled"}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Offline Mode</h4>
                        <p className="text-sm text-muted-foreground">
                          Enable offline functionality with local storage
                        </p>
                      </div>
                      <Button variant={settings.enableOfflineMode ? "default" : "outline"} size="sm">
                        {settings.enableOfflineMode ? "Enabled" : "Disabled"}
                      </Button>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Cache Strategy</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Choose how aggressively the app should cache data
                      </p>
                      <div className="flex space-x-2">
                        <Button 
                          variant={settings.cacheStrategy === 'aggressive' ? "default" : "outline"} 
                          size="sm"
                        >
                          Aggressive
                        </Button>
                        <Button 
                          variant={settings.cacheStrategy === 'balanced' ? "default" : "outline"} 
                          size="sm"
                        >
                          Balanced
                        </Button>
                        <Button 
                          variant={settings.cacheStrategy === 'minimal' ? "default" : "outline"} 
                          size="sm"
                        >
                          Minimal
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default MobileOptimizationPage; 