import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';

type LoadingProps = {
  size?: 'small' | 'large';
  message?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
};

const Loading: React.FC<LoadingProps> = ({
  size = 'large',
  message,
  fullScreen = false,
  style,
}) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        fullScreen && styles.fullScreen,
        { backgroundColor: theme.colors.background },
        style,
      ]}
    >
      <ActivityIndicator
        size={size}
        color={theme.colors.primary}
        style={styles.spinner}
      />
      {message && (
        <Text
          style={[styles.message, { color: theme.colors.onSurfaceVariant }]}
        >
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  spinner: {
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default Loading;
