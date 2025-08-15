import React from 'react';
import { StyleSheet } from 'react-native';
import { Button as PaperButton } from 'react-native-paper';
import { useTheme } from 'react-native-paper';

type ButtonProps = React.ComponentProps<typeof PaperButton> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  fullWidth?: boolean;
};

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  fullWidth = false,
  mode,
  style,
  labelStyle,
  ...props
}) => {
  const theme = useTheme();

  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          mode: 'contained' as const,
          buttonStyle: styles.primary,
          labelStyle: styles.primaryLabel,
        };
      case 'secondary':
        return {
          mode: 'contained' as const,
          buttonStyle: [styles.secondary, { backgroundColor: theme.colors.secondary }],
          labelStyle: styles.secondaryLabel,
        };
      case 'outline':
        return {
          mode: 'outlined' as const,
          buttonStyle: styles.outline,
          labelStyle: [styles.outlineLabel, { color: theme.colors.primary }],
        };
      case 'text':
        return {
          mode: 'text' as const,
          buttonStyle: styles.text,
          labelStyle: [styles.textLabel, { color: theme.colors.primary }],
        };
      default:
        return {
          mode: 'contained' as const,
          buttonStyle: styles.primary,
          labelStyle: styles.primaryLabel,
        };
    }
  };

  const { mode: buttonMode, buttonStyle, labelStyle: variantLabelStyle } = getButtonStyle();

  return (
    <PaperButton
      mode={mode || buttonMode}
      style={[
        styles.button,
        buttonStyle,
        fullWidth && styles.fullWidth,
        style,
      ]}
      labelStyle={[styles.label, variantLabelStyle, labelStyle]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'none',
  },
  primary: {
    elevation: 2,
  },
  primaryLabel: {
    color: '#FFFFFF',
  },
  secondary: {
    elevation: 2,
  },
  secondaryLabel: {
    color: '#FFFFFF',
  },
  outline: {
    borderWidth: 2,
  },
  outlineLabel: {
    fontWeight: '600',
  },
  text: {
    backgroundColor: 'transparent',
  },
  textLabel: {
    fontWeight: '600',
  },
});

export default Button; 