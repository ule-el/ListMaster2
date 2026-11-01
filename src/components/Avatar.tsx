import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, typography } from "../theme";

interface AvatarProps {
  name: string;
  size?: number;
  color?: string;
}

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, size = 40, color = colors.primary }: AvatarProps) {
  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: `${color}1A` },
      ]}
    >
      <Text style={[typography.subheading, { color, fontSize: size * 0.38 }]}>
        {initialsFor(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: "center", justifyContent: "center" },
});

export { initialsFor };
