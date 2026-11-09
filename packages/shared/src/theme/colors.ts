export const CINEMO_COLORS = {
  background: "#0b181b",
  backgroundDeep: "#081113",
  surface: "rgba(255, 255, 255, 0.05)",

  teal: "#176b68",
  tealDeep: "#0f514f",
  tealLight: "#9ad8d1",

  textPrimary: "#f3efe6",
  textSecondary: "#b0b8b4",
  placeholder: "#8fb8b3",

  accent: "#c6a15b",
  accentLight: "#d4b56a",
  danger: "#ad4f59",

  borderSubtle: "rgba(255, 255, 255, 0.12)",
  borderMuted: "rgba(255, 255, 255, 0.15)",
  borderAccent: "rgba(198, 161, 91, 0.45)",
} as const;

export type CinemoColor = (typeof CINEMO_COLORS)[keyof typeof CINEMO_COLORS];
