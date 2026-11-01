import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Button } from "../../components/Button";
import { colors, radius, spacing, typography } from "../../theme";
import type { AuthScreenProps } from "../../navigation/types";

export function WelcomeScreen({ navigation }: AuthScreenProps<"Welcome">) {
  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Ionicons name="checkmark-done" size={36} color={colors.textInverse} />
        </View>
        <Text style={styles.title}>ListMaster</Text>
        <Text style={styles.subtitle}>
          Assign tasks, track progress, and see exactly who finished what — and how fast.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button label="Get started" onPress={() => navigation.navigate("SignUp")} />
        <Button
          label="I already have an account"
          variant="ghost"
          onPress={() => navigation.navigate("Login")}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: "space-between", paddingVertical: spacing.xxl },
  hero: { flex: 1, alignItems: "center", justifyContent: "center" },
  logo: {
    width: 76,
    height: 76,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  title: { ...typography.display, color: colors.text, marginBottom: spacing.md },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    maxWidth: 300,
  },
  actions: { gap: spacing.md },
});
