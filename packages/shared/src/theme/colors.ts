export const CINEMO_COLORS = {
  background: "#0e1014",
  surface: "#17171a",

  textPrimary: "#f3efe6",
  textSecondary: "#958d82",

  accent: "#d4b56a",
  danger: "#ad4f59",

  borderSubtle: "rgba(243, 239, 230, 0.16)",
  borderMuted: "rgba(243, 239, 230, 0.24)",
  borderAccent: "rgba(212, 181, 106, 0.45)",
} as const;

export type CinemoColor = (typeof CINEMO_COLORS)[keyof typeof CINEMO_COLORS];
