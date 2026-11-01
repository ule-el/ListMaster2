import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "../../components/ScreenContainer";
import { TextField } from "../../components/TextField";
import { Button } from "../../components/Button";
import { colors, spacing, typography } from "../../theme";
import { joinTeamAsClient } from "../../firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import type { OnboardingScreenProps } from "../../navigation/types";

export function JoinTeamScreen({ navigation }: OnboardingScreenProps<"JoinTeam">) {
  const { firebaseUser } = useAuth();
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleJoin() {
    if (!firebaseUser) return;
    if (joinCode.trim().length < 4) {
      setError("Enter the invite code your master shared with you.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await joinTeamAsClient(firebaseUser.uid, firebaseUser.displayName ?? "Client", joinCode);
      // AuthContext's profile listener fires once the doc is written and
      // RootNavigator automatically switches to the client task list.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.content}>
          <Text style={styles.title}>Join your team</Text>
          <Text style={styles.subtitle}>Enter the invite code your master shared with you.</Text>

          <View style={styles.form}>
            <TextField
              label="Invite code"
              placeholder="e.g. 7F3KQ9"
              value={joinCode}
              onChangeText={(t) => setJoinCode(t.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={8}
            />
            {!!error && <Text style={styles.error}>{error}</Text>}
            <Button label="Join team" onPress={handleJoin} loading={loading} />
            <Button label="Back" variant="ghost" onPress={() => navigation.goBack()} disabled={loading} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flex: 1, justifyContent: "center" },
  title: { ...typography.title, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl },
  form: { gap: spacing.sm },
  error: { ...typography.caption, color: colors.danger, marginBottom: spacing.sm },
});
