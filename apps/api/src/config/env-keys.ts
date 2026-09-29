export const EnvKeys = {
  DATABASE_URL: "DATABASE_URL",
  API_PORT: "API_PORT",
  FRONTEND_URL: "FRONTEND_URL",
};

export type EnvKey = (typeof EnvKeys)[keyof typeof EnvKeys];
