import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Text, Card, Button, Badge } from "@rneui/themed";
import { useRoute, useNavigation } from "@react-navigation/native";
import { LineChart } from "react-native-chart-kit";
import Share from "react-native-share";
import SyncManager from "../../utils/sync";
import StorageManager from "../../utils/storage";

const GameSummaryScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [gameData, setGameData] = useState(route.params?.gameData);
  const [syncStatus, setSyncStatus] = useState("synced");
  const syncManager = SyncManager.getInstance();
  const storageManager = StorageManager.getInstance();

  useEffect(() => {
    checkSyncStatus();
  }, []);

  const checkSyncStatus = async () => {
    const pendingItems = syncManager.getPendingItems();
    const hasPendingSync = pendingItems.some(
      (item) => item.data.startTime === gameData.startTime,
    );
    setSyncStatus(hasPendingSync ? "pending" : "synced");
  };

  const chartData = {
    labels: gameData.shots.map((_, index) => `Shot ${index + 1}`),
    datasets: [
      {
        data: gameData.shots.map((shot) => shot.accuracy || 0),
      },
    ],
  };

  const calculateStats = () => {
    const totalShots = gameData.shots.length;
    const accuracy =
      gameData.shots.reduce((acc, shot) => acc + (shot.accuracy || 0), 0) /
      totalShots;
    const duration = Math.floor((gameData.endTime - gameData.startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    return {
      totalShots,
      accuracy: `${(accuracy * 100).toFixed(1)}%`,
      duration: `${minutes}:${seconds.toString().padStart(2, "0")}`,
    };
  };

  const stats = calculateStats();

  const shareResults = async () => {
    try {
      const message = `Just finished a pool game!\nStats:\nTotal Shots: ${stats.totalShots}\nAccuracy: ${stats.accuracy}\nDuration: ${stats.duration}`;
      await Share.open({
        message,
        title: "Game Summary",
      });
    } catch (error) {
      console.error("Error sharing results:", error);
    }
  };

  const startNewGame = () => {
    navigation.navigate("GameTracking");
  };

  return (
    <ScrollView style={styles.container}>
      <Card>
        <View style={styles.headerContainer}>
          <Card.Title>Game Summary</Card.Title>
          <Badge
            value={syncStatus === "synced" ? "Synced" : "Pending Sync"}
            status={syncStatus === "synced" ? "success" : "warning"}
            containerStyle={styles.badge}
          />
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalShots}</Text>
            <Text style={styles.statLabel}>Total Shots</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.accuracy}</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.duration}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
        </View>
      </Card>

      <Card>
        <Card.Title>Shot Accuracy Trend</Card.Title>
        <LineChart
          data={chartData}
          width={300}
          height={200}
          chartConfig={{
            backgroundColor: "#ffffff",
            backgroundGradientFrom: "#ffffff",
            backgroundGradientTo: "#ffffff",
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          style={styles.chart}
        />
      </Card>

      <Card>
        <Card.Title>Recommendations</Card.Title>
        <Text style={styles.recommendation}>
          {gameData.recommendations || generateRecommendations(stats)}
        </Text>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          title="Share Results"
          onPress={shareResults}
          buttonStyle={styles.button}
          icon={{
            name: "share",
            type: "material",
            color: "white",
          }}
        />
        <Button
          title="New Game"
          onPress={startNewGame}
          buttonStyle={[styles.button, styles.newGameButton]}
          icon={{
            name: "play-circle",
            type: "material",
            color: "white",
          }}
        />
      </View>
    </ScrollView>
  );
};

const generateRecommendations = (stats) => {
  const recommendations = [];

  if (stats.totalShots < 10) {
    recommendations.push("Try to play more shots to get better insights.");
  }

  if (parseFloat(stats.accuracy) < 70) {
    recommendations.push(
      "Focus on improving shot accuracy through practice drills.",
    );
  }

  return recommendations.join(" ");
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  badge: {
    position: "absolute",
    right: 0,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  recommendation: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginVertical: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20,
  },
  button: {
    width: 150,
    borderRadius: 25,
  },
  newGameButton: {
    backgroundColor: "#4CAF50",
  },
});

export default GameSummaryScreen;
