export const SESSION_COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Host-cinemo_session"
    : "cinemo_session";
