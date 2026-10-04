import axios from "axios";

export const apiClient = axios.create({
  baseURL: `${process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3050"}/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});
