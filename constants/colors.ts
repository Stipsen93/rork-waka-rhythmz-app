const primary = "#FF5A5F" as const;
const primaryDark = "#E6474C" as const;
const primaryLight = "#FF7B7F" as const;
const background = "#F9FAFB" as const;
const surface = "#FFFFFF" as const;
const surfaceLight = "#F3F4F6" as const;
const text = "#111827" as const;
const textMuted = "#6B7280" as const;
const textLight = "#9CA3AF" as const;
const success = "#10B981" as const;
const warning = "#F59E0B" as const;
const error = "#EF4444" as const;
const border = "#E5E7EB" as const;
const borderLight = "#F3F4F6" as const;
const accent = "#8B5CF6" as const;
const accentLight = "#A78BFA" as const;

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
