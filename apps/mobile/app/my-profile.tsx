import { Ionicons } from "@expo/vector-icons";
import { CINEMO_COLORS } from "@cinemo/shared";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { apiClient } from "@/lib/api/apiClient";
import { logoutMobile, type MobileLoginResponse } from "@/lib/api/auth";

export default function MyProfileScreen() {
  const [user, setUser] = useState<MobileLoginResponse["user"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await logoutMobile();
    } finally {
      router.replace("/login");
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        const response = await apiClient.get<MobileLoginResponse["user"]>(
          "/auth/me",
        );

        if (mounted) {
          setUser(response.data);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-cinemo-bg px-5">
      <View className="flex-row items-center py-4">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center"
        >
          <Ionicons
            name="arrow-back"
            size={26}
            color={CINEMO_COLORS.textSecondary}
          />
        </Pressable>

        <Text className="ml-2 text-xl font-bold text-cinemo-text">
          내 프로필
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={CINEMO_COLORS.accentLight} />
        </View>
      ) : user ? (
        <View className="items-center pt-12">
          <View
            className="items-center justify-center overflow-hidden rounded-full"
            style={{
              width: 96,
              height: 96,
              borderWidth: 1,
              borderColor: `${CINEMO_COLORS.accentLight}80`,
              backgroundColor: "rgba(255,255,255,0.08)",
            }}
          >
            {user.profileImageUrl ? (
              <Image
                source={{ uri: user.profileImageUrl }}
                accessibilityLabel="프로필 이미지"
                resizeMode="cover"
                style={{ width: 96, height: 96 }}
              />
            ) : (
              <Ionicons
                name="person-outline"
                size={42}
                color={CINEMO_COLORS.textSecondary}
              />
            )}
          </View>

          <Text className="mt-6 text-2xl font-bold text-cinemo-text">
            {user.nickname}
          </Text>
          <Text className="mt-2 text-base text-cinemo-muted">
            {user.email}
          </Text>
        </View>
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-base text-cinemo-muted">
            프로필 정보를 불러오지 못했습니다.
          </Text>
        </View>
      )}

      {user && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="로그아웃"
          onPress={handleLogout}
          disabled={isLoggingOut}
          className="mb-8 mt-auto items-center rounded-xl py-4"
          style={{
            backgroundColor: "rgba(255,255,255,0.08)",
            borderColor: "rgba(255,255,255,0.14)",
            borderWidth: 1,
            opacity: isLoggingOut ? 0.6 : 1,
          }}
        >
          {isLoggingOut ? (
            <ActivityIndicator color={CINEMO_COLORS.textSecondary} />
          ) : (
            <Text className="text-base font-semibold text-cinemo-muted">
              로그아웃
            </Text>
          )}
        </Pressable>
      )}
    </SafeAreaView>
  );
}
