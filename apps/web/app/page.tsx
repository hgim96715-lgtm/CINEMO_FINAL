"use client";

import { useEffect, useState } from "react";

interface HealthResponse {
  status: string;
  timestamp: string;
}

export default function HomePage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3050";

      try {
        const response = await fetch(`${apiUrl}/v1/health`);

        if (!response.ok) {
          throw new Error("API 요청에 실패했습니다.");
        }

        const data = (await response.json()) as HealthResponse;

        setHealth(data);
        setError(null);
      } catch {
        setError("API 연결에 실패했습니다.");
        setHealth(null);
      }
    };

    void checkHealth();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#101014] text-[#f3efe6]">
      <section className="text-center">
        <h1 className="text-3xl font-bold">CINEMO</h1>

        {health ? (
          <div className="mt-4">
            <p>API 연결 성공</p>
            <p className="text-sm text-[#958d82]">{health.timestamp}</p>
          </div>
        ) : error ? (
          <p className="mt-4 text-red-400">{error}</p>
        ) : (
          <p className="mt-4 text-[#958d82]">API 연결 확인 중...</p>
        )}
      </section>
    </main>
  );
}
