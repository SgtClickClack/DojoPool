import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Import screens
import LoginScreen from "../screens/auth/LoginScreen";
import GameTrackingScreen from "../screens/game/GameTrackingScreen";
import GameSummaryScreen from "../screens/game/GameSummaryScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import LeaderboardScreen from "../screens/social/LeaderboardScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const GameStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="GameTracking"
      component={GameTrackingScreen}
      options={{ headerTitle: "Game Tracking" }}
    />
    <Stack.Screen
      name="GameSummary"
      component={GameSummaryScreen}
      options={{ headerTitle: "Game Summary" }}
    />
  </Stack.Navigator>
);

const RootNavigator = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  if (!isAuthenticated) {
    return (
      <Stack.Navigator>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case "Game":
              iconName = focused ? "pool" : "pool";
              break;
            case "Profile":
              iconName = focused ? "account" : "account-outline";
              break;
            case "Leaderboard":
              iconName = focused ? "trophy" : "trophy-outline";
              break;
            default:
              iconName = "circle";
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Game"
        component={GameStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
    </Tab.Navigator>
  );
};

export default RootNavigator;
