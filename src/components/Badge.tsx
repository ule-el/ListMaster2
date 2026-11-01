import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { radius, spacing, typography } from "../theme";

interface BadgeProps {
  label: string;
  color: string;
  backgroundColor: string;
}

export function Badge({ label, color, backgroundColor }: BadgeProps) {
  return (
    <View style={[styles.base, { backgroundColor }]}>
      <Text style={[typography.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
});
