import axios from "axios";

export const apiClient = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3050"}/v1`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

type ApiErrorResponse = {
  message?: string | string[];
};

export function getApiErrorMessage(
  error: unknown,
  fallbackMessage: string,
) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const message = error.response?.data?.message;

    if (Array.isArray(message)) {
      return message[0] ?? fallbackMessage;
    }

    if (message) {
      return message;
    }
  }

  return fallbackMessage;
}
