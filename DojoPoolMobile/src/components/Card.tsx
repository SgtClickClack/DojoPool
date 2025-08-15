import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Card as PaperCard, Text, useTheme } from 'react-native-paper';

type CardProps = {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  elevation?: number;
};

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  onPress,
  style,
  contentStyle,
  elevation = 1,
}) => {
  const theme = useTheme();

  return (
    <PaperCard
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          elevation,
        },
        style,
      ]}
      onPress={onPress}
    >
      {(title || subtitle) && (
        <PaperCard.Title
          title={title}
          subtitle={subtitle}
          titleStyle={[
            styles.title,
            { color: theme.colors.onSurface },
          ]}
          subtitleStyle={[
            styles.subtitle,
            { color: theme.colors.onSurfaceVariant },
          ]}
        />
      )}
      <PaperCard.Content style={[styles.content, contentStyle]}>
        {children}
      </PaperCard.Content>
    </PaperCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
  },
  content: {
    paddingTop: 8,
    paddingBottom: 16,
  },
});

export default Card; 