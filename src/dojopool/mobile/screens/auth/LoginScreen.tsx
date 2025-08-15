import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Button, Input, Text, useTheme } from "@rneui/themed";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      // TODO: Implement actual login logic
      // const response = await authService.login(email, password);

      // For now, just simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // TODO: Handle successful login
      // - Store auth token
      // - Update auth context
      // - Navigate to main app
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Icon name="billiards" size={64} color={theme.colors.primary} />
            <Text h1 style={[styles.title, { color: theme.colors.text }]}>
              Dojo Pool
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              leftIcon={
                <Icon name="email" size={24} color={theme.colors.secondary} />
              }
            />

            <Input
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon={
                <Icon name="lock" size={24} color={theme.colors.secondary} />
              }
            />

            {error ? (
              <Text style={[styles.error, { color: theme.colors.error }]}>
                {error}
              </Text>
            ) : null}

            <Button
              title="Login"
              onPress={handleLogin}
              loading={loading}
              containerStyle={styles.buttonContainer}
            />

            <Button
              title="Create Account"
              type="outline"
              onPress={() => navigation.navigate("Signup")}
              containerStyle={styles.buttonContainer}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    marginTop: 16,
  },
  form: {
    width: "100%",
  },
  buttonContainer: {
    marginVertical: 8,
  },
  error: {
    textAlign: "center",
    marginBottom: 16,
  },
});

export default LoginScreen;
