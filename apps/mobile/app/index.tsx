// apps/mobile/app/index.tsx
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

interface HealthResponse {
  status: string;
  timestamp: string;
}

export default function HomeScreen() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3050";

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
    <View className="flex-1 items-center justify-center bg-[#101014]">
      <Text className="text-3xl font-bold text-[#f3efe6]">CINEMO</Text>

      {health ? (
        <View className="mt-4 items-center">
          <Text className="text-[#f3efe6]">API 연결 성공</Text>
          <Text className="mt-2 text-[#958d82]">{health.timestamp}</Text>
        </View>
      ) : error ? (
        <Text className="mt-4 text-red-400">{error}</Text>
      ) : (
        <Text className="mt-4 text-[#958d82]">API 연결 확인 중...</Text>
      )}
    </View>
  );
}
