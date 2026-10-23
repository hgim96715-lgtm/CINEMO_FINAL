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
  const [modalContent, setModalContent] = useState({
    title: "",
    description: "",
  });

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
              setModalContent(
                isEnabled
                  ? {
                      title: "개봉 알림을 해제했어요",
                      description: "더 이상 개봉 알림을 보내지 않아요.",
                    }
                  : {
                      title: "개봉 알림을 신청했어요",
                      description: "개봉일에 알려드릴게요.",
                    },
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
          style={{ backgroundColor: "rgba(0, 0, 0, 0.62)" }}
        >
          <View
            className="w-full max-w-md overflow-hidden rounded-3xl"
            style={{
              backgroundColor: "rgba(16, 31, 33, 0.97)",
              borderColor: "rgba(212, 181, 106, 0.35)",
              borderWidth: 1,
              elevation: 12,
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 18,
            }}
          >
            <View className="items-center px-6 pb-6 pt-7">
              <Text
                className="text-center text-xl font-bold"
                style={{ color: CINEMO_COLORS.accentLight }}
              >
                {modalContent.title}
              </Text>

              <Text
                className="mt-4 text-center text-base"
                style={{ color: CINEMO_COLORS.textSecondary }}
              >
                {modalContent.description}
              </Text>
            </View>

            <View
              className="items-center border-t px-6 py-5"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            >
              <Pressable
                className="min-w-24 items-center rounded-2xl px-7 py-3"
                style={{ backgroundColor: CINEMO_COLORS.accentLight }}
                onPress={() => setIsResultModalVisible(false)}
              >
                <Text
                  className="text-base font-bold"
                  style={{ color: CINEMO_COLORS.background }}
                >
                  확인
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
