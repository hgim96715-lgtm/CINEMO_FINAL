export const serviceEventTypes = [
  "movie_detail_open",
  "record_intent",
  "login_intent",
  "postcard_share_intent",
  "app_store_open",
  "cinema_search_intent",
] as const;

export type ServiceEventType = (typeof serviceEventTypes)[number];
