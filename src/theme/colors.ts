export const colors = {
  // Brand
  primary: "#4F46E5",
  primaryDark: "#3730A3",
  primaryLight: "#EEF2FF",

  // Roles
  master: "#4F46E5",
  client: "#0D9488",

  // Status
  success: "#0D9488",
  successLight: "#CCFBF1",
  warning: "#D97706",
  warningLight: "#FEF3C7",
  danger: "#DC2626",
  dangerLight: "#FEE2E2",

  // Neutrals
  background: "#F7F7FB",
  surface: "#FFFFFF",
  surfaceMuted: "#F1F1F6",
  border: "#E6E6EF",

  text: "#16161E",
  textSecondary: "#63636F",
  textMuted: "#9797A6",
  textInverse: "#FFFFFF",

  overlay: "rgba(22, 22, 30, 0.5)",
} as const;

export type ColorName = keyof typeof colors;
