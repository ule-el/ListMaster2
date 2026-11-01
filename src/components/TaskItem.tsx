import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "../theme";
import { formatDuration, formatRelativeDate } from "../utils/time";
import type { Assignment } from "../types";

interface TaskItemProps {
  assignment: Assignment;
  onPress?: () => void;
  disabled?: boolean;
  subtitle?: string; // e.g. assignee name, shown on master's views
}

export function TaskItem({ assignment, onPress, disabled, subtitle }: TaskItemProps) {
  const { title, description, completed, assignedAt, completedAt } = assignment;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={({ pressed }) => [
        styles.row,
        completed && styles.rowCompleted,
        pressed && !!onPress && styles.rowPressed,
      ]}
    >
      <View style={[styles.checkbox, completed && styles.checkboxChecked]}>
        {completed && <Ionicons name="checkmark" size={16} color={colors.textInverse} />}
      </View>

      <View style={styles.body}>
        <Text style={[styles.title, completed && styles.titleCompleted]} numberOfLines={2}>
          {title}
        </Text>
        {!!description && (
          <Text style={[styles.description, completed && styles.titleCompleted]} numberOfLines={2}>
            {description}
          </Text>
        )}
        <View style={styles.metaRow}>
          {!!subtitle && <Text style={styles.meta}>{subtitle}</Text>}
          {completed && completedAt ? (
            <Text style={styles.metaDone}>
              Done in {formatDuration(assignedAt.toMillis(), completedAt.toMillis())}
            </Text>
          ) : (
            <Text style={styles.meta}>Assigned {formatRelativeDate(assignedAt.toMillis())}</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  rowCompleted: { backgroundColor: colors.surfaceMuted, borderColor: colors.surfaceMuted },
  rowPressed: { opacity: 0.7 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: colors.success, borderColor: colors.success },
  body: { flex: 1 },
  title: { ...typography.bodyBold, color: colors.text },
  description: { ...typography.body, color: colors.textSecondary, marginTop: 2 },
  titleCompleted: { color: colors.textMuted, textDecorationLine: "line-through" },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm, flexWrap: "wrap" },
  meta: { ...typography.caption, color: colors.textMuted, marginRight: spacing.sm },
  metaDone: { ...typography.caption, color: colors.success, fontWeight: "700" },
});
