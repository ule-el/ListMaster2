import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "../../components/ScreenContainer";
import { TextField } from "../../components/TextField";
import { Button } from "../../components/Button";
import { colors, spacing, typography } from "../../theme";
import { createTeamAndMaster } from "../../firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import type { OnboardingScreenProps } from "../../navigation/types";

export function CreateTeamScreen({ navigation }: OnboardingScreenProps<"CreateTeam">) {
  const { firebaseUser } = useAuth();
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!firebaseUser) return;
    if (!teamName.trim()) {
      setError("Give your team a name.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await createTeamAndMaster(firebaseUser.uid, firebaseUser.displayName ?? "Master", teamName);
      // AuthContext's profile listener fires once the doc is written and
      // RootNavigator automatically switches to the master dashboard.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.content}>
          <Text style={styles.title}>Name your team</Text>
          <Text style={styles.subtitle}>
            We'll generate an invite code your clients use to join.
          </Text>

          <View style={styles.form}>
            <TextField
              label="Team name"
              placeholder="e.g. Riverside Renovations"
              value={teamName}
              onChangeText={setTeamName}
              autoCapitalize="words"
            />
            {!!error && <Text style={styles.error}>{error}</Text>}
            <Button label="Create team" onPress={handleCreate} loading={loading} />
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
