const primary = "#00B4D8" as const;
const primaryDark = "#0096C7" as const;
const primaryLight = "#48CAE4" as const;
const background = "#F8FAFB" as const;
const surface = "#FFFFFF" as const;
const surfaceLight = "#F0F4F7" as const;
const text = "#1A2332" as const;
const textMuted = "#64748B" as const;
const textLight = "#94A3B8" as const;
const success = "#10B981" as const;
const warning = "#F59E0B" as const;
const error = "#EF4444" as const;
const border = "#E2E8F0" as const;
const borderLight = "#F1F5F9" as const;
const accent = "#06B6D4" as const;
const accentLight = "#22D3EE" as const;

export default {
  light: {
    text,
    background,
    tint: primary,
    tabIconDefault: textMuted,
    tabIconSelected: primary,
    primary,
    primaryDark,
    primaryLight,
    primaryBright: primaryLight,
    surface,
    surfaceLight,
    darkGray: surfaceLight,
    muted: textMuted,
    mutedLight: textLight,
    success,
    warning,
    danger: error,
    error,
    accent,
    accentLight,
    border,
    borderLight,
    cardBackground: surface,
  },
} as const;
