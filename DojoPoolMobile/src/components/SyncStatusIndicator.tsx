import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import syncService from '../services/syncService';
import { SyncStatus } from '../services/syncService';

interface SyncStatusIndicatorProps {
  showDetails?: boolean;
  onSyncPress?: () => void;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  showDetails = false,
  onSyncPress,
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    lastSync: Date.now(),
    pendingItems: 0,
    syncInProgress: false,
    error: null,
  });

  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = syncService.addStatusListener((status) => {
      setSyncStatus(status);
    });

    // Load initial status
    syncService.getSyncStatus().then(setSyncStatus);

    return unsubscribe;
  }, [isAuthenticated]);

  const handleSyncPress = async () => {
    if (onSyncPress) {
      onSyncPress();
      return;
    }

    if (!syncStatus.isOnline) {
      Alert.alert('Offline', 'Cannot sync while offline. Please check your connection.');
      return;
    }

    if (syncStatus.syncInProgress) {
      Alert.alert('Sync in Progress', 'Synchronization is already in progress.');
      return;
    }

    try {
      await syncService.forceSync();
      Alert.alert('Success', 'Manual sync completed successfully.');
    } catch (error) {
      Alert.alert('Sync Failed', 'Failed to sync data. Please try again.');
    }
  };

  const getStatusColor = () => {
    if (syncStatus.error) return '#f44336';
    if (syncStatus.syncInProgress) return '#ff9800';
    if (!syncStatus.isOnline) return '#9e9e9e';
    if (syncStatus.pendingItems > 0) return '#2196f3';
    return '#4caf50';
  };

  const getStatusIcon = () => {
    if (syncStatus.error) return 'alert-circle';
    if (syncStatus.syncInProgress) return 'sync';
    if (!syncStatus.isOnline) return 'wifi-off';
    if (syncStatus.pendingItems > 0) return 'cloud-upload';
    return 'cloud-check';
  };

  const getStatusText = () => {
    if (syncStatus.error) return 'Sync Error';
    if (syncStatus.syncInProgress) return 'Syncing...';
    if (!syncStatus.isOnline) return 'Offline';
    if (syncStatus.pendingItems > 0) return `${syncStatus.pendingItems} pending`;
    return 'Synced';
  };

  const formatLastSync = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (!isAuthenticated) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.statusButton, { borderColor: getStatusColor() }]}
        onPress={handleSyncPress}
        disabled={syncStatus.syncInProgress}
      >
        <IconButton
          icon={getStatusIcon()}
          size={20}
          iconColor={getStatusColor()}
          disabled={syncStatus.syncInProgress}
        />
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </TouchableOpacity>

      {showDetails && (
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Connection:</Text>
            <Text style={[styles.detailValue, { color: syncStatus.isOnline ? '#4caf50' : '#f44336' }]}>
              {syncStatus.isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last Sync:</Text>
            <Text style={styles.detailValue}>
              {formatLastSync(syncStatus.lastSync)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pending Items:</Text>
            <Text style={[styles.detailValue, { color: syncStatus.pendingItems > 0 ? '#2196f3' : '#4caf50' }]}>
              {syncStatus.pendingItems}
            </Text>
          </View>

          {syncStatus.error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{syncStatus.error}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  detailsContainer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    minWidth: 200,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#ffebee',
    borderRadius: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#f44336',
    textAlign: 'center',
  },
});

export default SyncStatusIndicator; 