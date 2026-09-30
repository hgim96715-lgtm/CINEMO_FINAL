export const EnvKeys = {
  DATABASE_URL: "DATABASE_URL",
  API_PORT: "API_PORT",
  FRONTEND_URL: "FRONTEND_URL",
  KOBIS_API_KEY: "KOBIS_API_KEY",
  KOBIS_BASE_URL: "KOBIS_BASE_URL",
};

export type EnvKey = (typeof EnvKeys)[keyof typeof EnvKeys];
