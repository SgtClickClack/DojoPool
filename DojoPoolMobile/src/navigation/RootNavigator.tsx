import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import VenuesScreen from '../screens/VenuesScreen';
import GamesScreen from '../screens/GamesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MobileOptimizationScreen from '../screens/MobileOptimizationScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: string;

        switch (route.name) {
          case 'Home':
            iconName = focused ? 'home' : 'home-outline';
            break;
          case 'Venues':
            iconName = focused ? 'map-marker' : 'map-marker-outline';
            break;
          case 'Games':
            iconName = focused ? 'gamepad-variant' : 'gamepad-variant-outline';
            break;
          case 'Profile':
            iconName = focused ? 'account' : 'account-outline';
            break;
          case 'Optimization':
            iconName = focused ? 'tune' : 'tune-variant';
            break;
          default:
            iconName = 'circle';
        }

        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#2196f3',
      tabBarInactiveTintColor: 'gray',
      headerShown: true,
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Venues" component={VenuesScreen} />
    <Tab.Screen name="Games" component={GamesScreen} />
    <Tab.Screen name="Optimization" component={MobileOptimizationScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const RootNavigator = () => {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );

  return isAuthenticated ? <MainTabs /> : <AuthStack />;
};

export default RootNavigator;
