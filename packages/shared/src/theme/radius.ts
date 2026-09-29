export const CINEMO_RADIUS = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export type CinemoRadius =
  (typeof CINEMO_RADIUS)[keyof typeof CINEMO_RADIUS];
