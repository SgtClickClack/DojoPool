import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button } from '@rneui/themed';
import { Camera } from 'react-native-vision-camera';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { API_URL } from '../../config';
import SyncManager from '../../utils/sync';
import StorageManager from '../../utils/storage';

const GameTrackingScreen = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [gameData, setGameData] = useState(null);
  const navigation = useNavigation();
  const syncManager = SyncManager.getInstance();
  const storageManager = StorageManager.getInstance();

  useEffect(() => {
    (async () => {
      const cameraPermission = await Camera.requestCameraPermission();
      setHasPermission(cameraPermission === 'authorized');

      // Load any cached game data
      const cachedGame = await storageManager.getItem('currentGame');
      if (cachedGame) {
        setGameData(cachedGame);
        setIsRecording(true);
      }
    })();
  }, []);

  const startTracking = async () => {
    try {
      setIsRecording(true);
      const newGameData = {
        startTime: Date.now(),
        shots: [],
        status: 'in_progress',
      };

      setGameData(newGameData);
      await storageManager.setItem('currentGame', newGameData);

      // Try to start game tracking on server, queue if offline
      try {
        await axios.post(`${API_URL}/api/v1/games/track/start`);
      } catch (error) {
        await syncManager.addToQueue({
          endpoint: '/api/v1/games/track/start',
          method: 'POST',
          data: newGameData,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to start game tracking');
      setIsRecording(false);
    }
  };

  const stopTracking = async () => {
    try {
      setIsRecording(false);

      if (gameData) {
        const finalGameData = {
          ...gameData,
          endTime: Date.now(),
          status: 'completed',
        };

        // Save final game data locally
        await storageManager.setItem(`game_${Date.now()}`, finalGameData);
        await storageManager.removeItem('currentGame');

        // Try to sync with server
        try {
          const result = await axios.post(`${API_URL}/api/v1/games/track/stop`, finalGameData);
          navigation.navigate('GameSummary', { gameData: result.data });
        } catch (error) {
          // Queue for later sync
          await syncManager.addToQueue({
            endpoint: '/api/v1/games/track/stop',
            method: 'POST',
            data: finalGameData,
          });

          // Navigate with local data
          navigation.navigate('GameSummary', { gameData: finalGameData });
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to stop game tracking');
    }
  };

  const updateGameData = async (newShot) => {
    if (gameData) {
      const updatedGameData = {
        ...gameData,
        shots: [...gameData.shots, newShot],
      };
      setGameData(updatedGameData);
      await storageManager.setItem('currentGame', updatedGameData);

      // Try to sync shot data
      try {
        await axios.post(`${API_URL}/api/v1/games/track/update`, {
          shot: newShot,
        });
      } catch (error) {
        await syncManager.addToQueue({
          endpoint: '/api/v1/games/track/update',
          method: 'POST',
          data: { shot: newShot },
        });
      }
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text>No camera permission</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera style={styles.camera} device="back" isActive={true} />
      <View style={styles.controls}>
        {!isRecording ? (
          <Button title="Start Tracking" onPress={startTracking} buttonStyle={styles.button} />
        ) : (
          <Button
            title="Stop Tracking"
            onPress={stopTracking}
            buttonStyle={[styles.button, styles.stopButton]}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: 200,
    borderRadius: 25,
  },
  stopButton: {
    backgroundColor: '#ff4444',
  },
});

export default GameTrackingScreen;
