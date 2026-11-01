import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "../../components/ScreenContainer";
import { TextField } from "../../components/TextField";
import { Button } from "../../components/Button";
import { colors, spacing, typography } from "../../theme";
import { friendlyAuthError, registerWithEmail } from "../../firebase/auth";
import type { AuthScreenProps } from "../../navigation/types";

export function SignUpScreen({ navigation }: AuthScreenProps<"SignUp">) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignUp() {
    if (!name.trim() || !email || !password) {
      setError("Fill in your name, email, and password.");
      return;
    }
    if (password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await registerWithEmail(email, password, name);
      // AuthContext picks up the new user; RootNavigator routes to role selection
      // since no profile document exists yet.
    } catch (e) {
      setError(friendlyAuthError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>You'll choose master or client next.</Text>

          <View style={styles.form}>
            <TextField label="Name" value={name} onChangeText={setName} autoCapitalize="words" />
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            {!!error && <Text style={styles.error}>{error}</Text>}
            <Button label="Continue" onPress={handleSignUp} loading={loading} />
            <Button label="I already have an account" variant="ghost" onPress={() => navigation.navigate("Login")} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", paddingVertical: spacing.xxl },
  title: { ...typography.title, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl },
  form: { gap: spacing.sm },
  error: { ...typography.caption, color: colors.danger, marginBottom: spacing.sm },
});
