import React, { forwardRef } from 'react';
import { StyleSheet, TextInput as RNTextInput } from 'react-native';
import { TextInput as PaperTextInput, HelperText } from 'react-native-paper';
import { useTheme } from 'react-native-paper';

type TextInputProps = React.ComponentProps<typeof PaperTextInput> & {
  error?: string;
  touched?: boolean;
};

const TextInput = forwardRef<RNTextInput, TextInputProps>(
  ({ error, touched, style, ...props }, ref) => {
    const theme = useTheme();
    const showError = error && touched;

    return (
      <>
        <PaperTextInput
          ref={ref}
          mode="outlined"
          style={[
            styles.input,
            { backgroundColor: theme.colors.surface },
            showError && styles.errorInput,
            style,
          ]}
          error={showError}
          outlineColor={showError ? theme.colors.error : theme.colors.outline}
          activeOutlineColor={showError ? theme.colors.error : theme.colors.primary}
          {...props}
        />
        {showError && (
          <HelperText type="error" visible={showError} style={styles.errorText}>
            {error}
          </HelperText>
        )}
      </>
    );
  }
);

const styles = StyleSheet.create({
  input: {
    marginVertical: 8,
  },
  errorInput: {
    marginBottom: 4,
  },
  errorText: {
    marginBottom: 8,
    marginTop: 0,
  },
});

export default TextInput; 