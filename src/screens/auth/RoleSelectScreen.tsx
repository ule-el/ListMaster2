import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/ScreenContainer";
import { colors, radius, shadows, spacing, typography } from "../../theme";
import type { OnboardingScreenProps } from "../../navigation/types";

export function RoleSelectScreen({ navigation }: OnboardingScreenProps<"RoleSelect">) {
  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>How will you use ListMaster?</Text>
        <Text style={styles.subtitle}>You can't change this later, so pick carefully.</Text>
      </View>

      <View style={styles.options}>
        <RoleOption
          icon="shield-checkmark"
          color={colors.master}
          title="I'm a master"
          description="Create a team, assign tasks, and track everyone's progress."
          onPress={() => navigation.navigate("CreateTeam")}
        />
        <RoleOption
          icon="person"
          color={colors.client}
          title="I'm a client"
          description="Join a team with an invite code and work through your tasks."
          onPress={() => navigation.navigate("JoinTeam")}
        />
      </View>
    </ScreenContainer>
  );
}

function RoleOption({
  icon,
  color,
  title,
  description,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.option, shadows.card, pressed && styles.optionPressed]}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon} size={26} color={color} />
      </View>
      <View style={styles.optionBody}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: "center" },
  header: { marginBottom: spacing.xxl },
  title: { ...typography.title, color: colors.text, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.textSecondary },
  options: { gap: spacing.md },
  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionPressed: { opacity: 0.85 },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.lg,
  },
  optionBody: { flex: 1 },
  optionTitle: { ...typography.heading, color: colors.text },
  optionDescription: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});
