export const CINEMO_COLORS = {
  background: "#0b181b",
  backgroundDeep: "#081113",
  surface: "rgb(255 255 255 / 5%)",

  teal: "#176b68",
  tealDeep: "#0f514f",
  tealLight: "#9ad8d1",

  textPrimary: "#f3efe6",
  textSecondary: "#b0b8b4",
  placeholder: "#8fb8b3",

  accent: "#c6a15b",
  accentLight: "#d4b56a",
  danger: "#ad4f59",

  borderSubtle: "rgb(255 255 255 / 12%)",
  borderMuted: "rgb(255 255 255 / 15%)",
  borderAccent: "rgb(198 161 91 / 45%)",
} as const;

export type CinemoColor = (typeof CINEMO_COLORS)[keyof typeof CINEMO_COLORS];
