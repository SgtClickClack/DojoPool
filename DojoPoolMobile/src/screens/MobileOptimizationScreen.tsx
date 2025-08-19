import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { Card, Title, Paragraph, Button, Divider } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import SyncStatusIndicator from '../components/SyncStatusIndicator';
import optimizationService from '../services/optimizationService';
import syncService from '../services/syncService';
import {
  OptimizationSettings,
  PerformanceMetrics,
} from '../services/optimizationService';
import { SyncStatus } from '../services/syncService';

const MobileOptimizationScreen: React.FC = () => {
  const [settings, setSettings] = useState<OptimizationSettings>({
    enableImageCompression: true,
    enableLazyLoading: true,
    enableBackgroundSync: true,
    enableOfflineMode: true,
    cacheStrategy: 'balanced',
  });

  const [performanceMetrics, setPerformanceMetrics] = useState<
    PerformanceMetrics[]
  >([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    lastSync: Date.now(),
    pendingItems: 0,
    syncInProgress: false,
    error: null,
  });

  const dispatch = useDispatch();
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );

  useEffect(() => {
    if (!isAuthenticated) return;

    // Load settings
    const loadSettings = async () => {
      const currentSettings = optimizationService.getSettings();
      setSettings(currentSettings);
    };

    // Load performance metrics
    const loadMetrics = () => {
      const metrics = optimizationService.getPerformanceMetrics();
      setPerformanceMetrics(metrics);
    };

    // Setup sync status listener
    const unsubscribe = syncService.addStatusListener((status) => {
      setSyncStatus(status);
    });

    loadSettings();
    loadMetrics();
    syncService.getSyncStatus().then(setSyncStatus);

    return unsubscribe;
  }, [isAuthenticated]);

  const handleSettingChange = async (
    key: keyof OptimizationSettings,
    value: any
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await optimizationService.updateSettings(newSettings);
  };

  const handleCacheStrategyChange = async (
    strategy: 'aggressive' | 'balanced' | 'minimal'
  ) => {
    await handleSettingChange('cacheStrategy', strategy);
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear all cached data? This will free up storage space but may slow down the app temporarily.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await optimizationService.clearCache();
            Alert.alert('Success', 'Cache cleared successfully.');
          },
        },
      ]
    );
  };

  const handleForceSync = async () => {
    try {
      await syncService.forceSync();
      Alert.alert('Success', 'Manual sync completed successfully.');
    } catch (error) {
      Alert.alert('Sync Failed', 'Failed to sync data. Please try again.');
    }
  };

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

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.authMessage}>
          Please log in to access optimization features.
        </Text>
      </View>
    );
  }

  const averageMetrics = getAverageMetrics();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Mobile Optimization</Title>
        <Paragraph style={styles.subtitle}>
          Optimize your DojoPool mobile experience with advanced sync and
          performance features.
        </Paragraph>
      </View>

      {/* Sync Status */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Sync Status</Title>
          <View style={styles.syncContainer}>
            <SyncStatusIndicator showDetails={true} />
          </View>
          <View style={styles.buttonRow}>
            <Button
              mode="contained"
              onPress={handleForceSync}
              style={styles.button}
            >
              Force Sync
            </Button>
            <Button
              mode="outlined"
              onPress={handleClearCache}
              style={styles.button}
            >
              Clear Cache
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Performance Metrics */}
      {averageMetrics && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Performance Metrics</Title>
            <View style={styles.metricsContainer}>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>App Launch Time:</Text>
                <Text style={styles.metricValue}>
                  {formatTime(averageMetrics.appLaunchTime)}
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Screen Load Time:</Text>
                <Text style={styles.metricValue}>
                  {formatTime(averageMetrics.screenLoadTime)}
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Memory Usage:</Text>
                <Text style={styles.metricValue}>
                  {formatPercentage(averageMetrics.memoryUsage)}
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Battery Level:</Text>
                <Text style={styles.metricValue}>
                  {formatPercentage(averageMetrics.batteryLevel)}
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Network Latency:</Text>
                <Text style={styles.metricValue}>
                  {formatLatency(averageMetrics.networkLatency)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Optimization Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Optimization Settings</Title>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Image Compression</Text>
              <Text style={styles.settingDescription}>
                Automatically compress images to save bandwidth and improve
                loading times.
              </Text>
            </View>
            <Switch
              value={settings.enableImageCompression}
              onValueChange={(value) =>
                handleSettingChange('enableImageCompression', value)
              }
            />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Lazy Loading</Text>
              <Text style={styles.settingDescription}>
                Load content on-demand to improve initial app performance.
              </Text>
            </View>
            <Switch
              value={settings.enableLazyLoading}
              onValueChange={(value) =>
                handleSettingChange('enableLazyLoading', value)
              }
            />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Background Sync</Text>
              <Text style={styles.settingDescription}>
                Sync data in the background when the app is not active.
              </Text>
            </View>
            <Switch
              value={settings.enableBackgroundSync}
              onValueChange={(value) =>
                handleSettingChange('enableBackgroundSync', value)
              }
            />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Offline Mode</Text>
              <Text style={styles.settingDescription}>
                Enable offline functionality with local data storage.
              </Text>
            </View>
            <Switch
              value={settings.enableOfflineMode}
              onValueChange={(value) =>
                handleSettingChange('enableOfflineMode', value)
              }
            />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Cache Strategy</Text>
            <Text style={styles.settingDescription}>
              Choose how aggressively the app should cache data.
            </Text>
            <View style={styles.strategyButtons}>
              <TouchableOpacity
                style={[
                  styles.strategyButton,
                  settings.cacheStrategy === 'aggressive' &&
                    styles.strategyButtonActive,
                ]}
                onPress={() => handleCacheStrategyChange('aggressive')}
              >
                <Text
                  style={[
                    styles.strategyButtonText,
                    settings.cacheStrategy === 'aggressive' &&
                      styles.strategyButtonTextActive,
                  ]}
                >
                  Aggressive
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.strategyButton,
                  settings.cacheStrategy === 'balanced' &&
                    styles.strategyButtonActive,
                ]}
                onPress={() => handleCacheStrategyChange('balanced')}
              >
                <Text
                  style={[
                    styles.strategyButtonText,
                    settings.cacheStrategy === 'balanced' &&
                      styles.strategyButtonTextActive,
                  ]}
                >
                  Balanced
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.strategyButton,
                  settings.cacheStrategy === 'minimal' &&
                    styles.strategyButtonActive,
                ]}
                onPress={() => handleCacheStrategyChange('minimal')}
              >
                <Text
                  style={[
                    styles.strategyButtonText,
                    settings.cacheStrategy === 'minimal' &&
                      styles.strategyButtonTextActive,
                  ]}
                >
                  Minimal
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Network Optimization */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Network Optimization</Title>
          <Paragraph>
            Optimal batch size for network requests:{' '}
            {optimizationService.getOptimalBatchSize()} items
          </Paragraph>
          <Paragraph>
            Background sync enabled:{' '}
            {optimizationService.shouldBackgroundSync() ? 'Yes' : 'No'}
          </Paragraph>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  syncContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  metricsContainer: {
    marginTop: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  metricLabel: {
    fontSize: 16,
    color: '#666',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196f3',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  divider: {
    marginVertical: 8,
  },
  strategyButtons: {
    flexDirection: 'row',
    marginTop: 12,
  },
  strategyButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  strategyButtonActive: {
    backgroundColor: '#2196f3',
    borderColor: '#2196f3',
  },
  strategyButtonText: {
    fontSize: 14,
    color: '#666',
  },
  strategyButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  authMessage: {
    textAlign: 'center',
    fontSize: 18,
    color: '#666',
    marginTop: 100,
  },
});

export default MobileOptimizationScreen;
