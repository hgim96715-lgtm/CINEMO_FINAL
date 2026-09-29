export const EnvKeys = {
  DATABASE_URL: "DATABASE_URL",
  API_PORT: "API_PORT",
};

export type EnvKey = (typeof EnvKeys)[keyof typeof EnvKeys];
