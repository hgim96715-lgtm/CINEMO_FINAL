import axios from "axios";

const serverApiBaseUrl = `${
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3050"
}/v1`;

export const apiClient = axios.create({
  // 브라우저 요청은 웹 출처의 BFF를 거쳐 HttpOnly 세션 쿠키를 유지함
  baseURL: typeof window === "undefined" ? serverApiBaseUrl : "/api/v1",
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
