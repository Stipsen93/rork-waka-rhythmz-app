const red = "#DC2626" as const;
const redDark = "#B91C1C" as const;
const redBright = "#EF4444" as const;
const black = "#000000" as const;
const darkGray = "#0A0A0A" as const;
const surface = "#121212" as const;
const surfaceLight = "#1A1A1A" as const;
const text = "#FFFFFF" as const;
const textMuted = "#9CA3AF" as const;
const success = "#10B981" as const;
const warning = "#F59E0B" as const;
const accent = "#FF0000" as const;

export default {
  light: {
    text,
    background: black,
    tint: red,
    tabIconDefault: textMuted,
    tabIconSelected: red,
    primary: red,
    primaryDark: redDark,
    primaryBright: redBright,
    surface,
    surfaceLight,
    darkGray,
    muted: textMuted,
    success,
    warning,
    danger: redBright,
    accent,
  },
} as const;
