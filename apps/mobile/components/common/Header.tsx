import { Ionicons } from "@expo/vector-icons";
import { CINEMO_COLORS } from "@cinemo/shared";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

import { apiClient } from "@/lib/api/apiClient";
import { getRefreshToken, type MobileLoginResponse } from "@/lib/api/auth";

type HeaderProps = {
  onSearchPress?: () => void;
  showSearch?: boolean;
  showAccount?: boolean;
};

const CINEMO_LOGO = require("../../assets/icon.png");

export function Header({
  onSearchPress,
  showSearch = true,
  showAccount = true,
}: HeaderProps) {
  const [user, setUser] = useState<MobileLoginResponse["user"] | null>(null);

  useEffect(() => {
    if (!showAccount) {
      setUser(null);
      return;
    }

    let mounted = true;

    const loadUser = async () => {
      const refreshToken = await getRefreshToken();

      if (!refreshToken) {
        return;
      }

      try {
        const response = await apiClient.get<MobileLoginResponse["user"]>(
          "/auth/me",
        );

        if (mounted) {
          setUser(response.data);
        }
      } catch {
        if (mounted) {
          setUser(null);
        }
      }
    };

    void loadUser();

    return () => {
      mounted = false;
    };
  }, [showAccount]);

  return (
    <View className="flex-row items-center justify-between px-5 py-4">
      <Pressable
        className="flex-col items-center"
        onPress={() => router.replace("/lobby")}
      >
        <Image
          source={CINEMO_LOGO}
          resizeMode="contain"
          fadeDuration={0}
          style={{ width: 36, height: 36 }}
        />
      </Pressable>

      <View className="flex-row items-center gap-3">
        {showSearch && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="영화 검색"
            className="h-11 w-11 items-center justify-center rounded-full"
            onPress={onSearchPress}
          >
            <Ionicons
              name="search-outline"
              size={26}
              color={CINEMO_COLORS.accentLight}
              style={{ fontSize: 26 }}
            />
          </Pressable>
        )}

        {showAccount && (
          user ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${user.nickname} 프로필`}
              className="flex-row items-center gap-2 rounded-full px-1 py-1"
              onPress={() => router.push("/my-cinema")}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  overflow: "hidden",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 18,
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
                    style={{ width: 36, height: 36 }}
                  />
                ) : (
                  <Ionicons
                    name="person-outline"
                    size={19}
                    color={CINEMO_COLORS.textSecondary}
                  />
                )}
              </View>

              <Text
                numberOfLines={1}
                style={{
                  maxWidth: 90,
                  color: CINEMO_COLORS.textSecondary,
                  fontSize: 14,
                }}
              >
                {user.nickname}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="로그인"
              className="rounded-full px-3 py-2"
              onPress={() => router.push("/login")}
            >
              <Text
                className="text-sm text-cinemo-muted"
                style={{ color: CINEMO_COLORS.textSecondary }}
              >
                로그인
              </Text>
            </Pressable>
          )
        )}
      </View>
    </View>
  );
}
