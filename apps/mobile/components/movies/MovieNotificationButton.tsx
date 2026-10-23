import { useQuery } from "@tanstack/react-query";
import { Bell, BellRing } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { CINEMO_COLORS } from "@cinemo/shared";
import { getRefreshToken } from "@/lib/api/auth";
import { movieNotificationQueryOptions } from "@/lib/queries/movie-notification.query";
import { useMovieNotificationMutation } from "@/lib/queries/movie-notification.mutation";

type Props = {
  movieId: string;
  isReleased: boolean;
};
export function MovieNotificationButton({ movieId, isReleased }: Props) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isResultModalVisible, setIsResultModalVisible] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadAuthState() {
      try {
        const refreshToken = await getRefreshToken();

        if (mounted) {
          setIsLoggedIn(Boolean(refreshToken));
        }
      } catch {
        if (mounted) {
          setIsLoggedIn(false);
        }
      }
    }

    void loadAuthState();

    return () => {
      mounted = false;
    };
  }, []);

  const notificationQuery = useQuery(
    movieNotificationQueryOptions(movieId, isLoggedIn === true),
  );

  const notificationMutation = useMovieNotificationMutation(movieId);

  if (isLoggedIn !== true) {
    return null;
  }
  if (isReleased) {
    return null;
  }

  const isEnabled = notificationQuery.data?.enabled ?? false;
  const isLoading =
    notificationQuery.isPending || notificationMutation.isPending;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isEnabled ? "개봉 알림 해제" : "개봉 알림 신청"}
        disabled={isLoading}
        onPress={() => {
          notificationMutation.mutate(isEnabled, {
            onSuccess: () => {
              setResultMessage(
                isEnabled
                  ? "개봉 알림이 해제되었습니다."
                  : "알림이 설정되었습니다.",
              );
              setIsResultModalVisible(true);
            },
          });
        }}
        className="flex-row items-center gap-2 self-start rounded-xl border px-4 py-3"
        style={{
          borderColor: isEnabled
            ? CINEMO_COLORS.accentLight
            : "rgba(255,255,255,0.2)",
          backgroundColor: isEnabled
            ? "rgba(212,166,76,0.16)"
            : "rgba(255,255,255,0.05)",
          opacity: isLoading ? 0.5 : 1,
        }}
      >
        {isEnabled ? (
          <BellRing size={17} color={CINEMO_COLORS.accentLight} />
        ) : (
          <Bell size={17} color={CINEMO_COLORS.textSecondary} />
        )}
      </Pressable>

      <Modal
        transparent
        visible={isResultModalVisible}
        animationType="fade"
        onRequestClose={() => setIsResultModalVisible(false)}
      >
        <View
          className="flex-1 items-center justify-center px-6"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.72)" }}
        >
          <View
            className="w-full rounded-2xl p-6"
            style={{
              backgroundColor: "#1b2a2d",
              borderColor: "rgba(212, 181, 106, 0.45)",
              borderWidth: 1,
              elevation: 12,
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 18,
            }}
          >
            <Text
              className="text-center text-lg font-semibold"
              style={{ color: CINEMO_COLORS.textPrimary }}
            >
              {resultMessage}
            </Text>

            <Pressable
              className="mt-6 items-center rounded-xl py-3"
              style={{ backgroundColor: CINEMO_COLORS.accentLight }}
              onPress={() => setIsResultModalVisible(false)}
            >
              <Text
                className="font-semibold"
                style={{ color: CINEMO_COLORS.background }}
              >
                확인
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}
