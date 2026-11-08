import { CachedImage as Image } from "@/components/common/CachedImage";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router } from "expo-router";

import { CINEMO_COLORS } from "@cinemo/shared";
import type { MyMovieNotification } from "@/lib/api/my-cinema";
import { getImageUrl } from "@/lib/utils";

type MyNotificationsSectionProps = {
  notifications: MyMovieNotification[];
  isLoadingMovieId?: string;
  onUnsubscribe: (movieId: string) => void;
};

export function MyNotificationsSection({
  notifications,
  isLoadingMovieId,
  onUnsubscribe,
}: MyNotificationsSectionProps) {
  return (
    <View className="mt-5">
      <Text className="mb-4 text-lg font-bold text-cinemo-text">
        개봉 알림
      </Text>

      {notifications.length === 0 ? (
        <View
          className="items-center rounded-2xl border p-8"
          style={panelStyle}
        >
          <Text className="text-center text-sm text-cinemo-muted">
            신청한 개봉 알림이 없음
          </Text>
        </View>
      ) : (
        <View className="gap-3">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              isLoading={isLoadingMovieId === notification.movieId}
              onUnsubscribe={() => onUnsubscribe(notification.movieId)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function NotificationCard({
  notification,
  isLoading,
  onUnsubscribe,
}: {
  notification: MyMovieNotification;
  isLoading: boolean;
  onUnsubscribe: () => void;
}) {
  const title = notification.movie.titles[0]?.title ?? "제목 없음";
  const posterUrl = getImageUrl(notification.movie.media[0]?.url ?? null);
  const releaseDate = notification.release?.releaseDate ?? null;

  return (
    <View className="rounded-2xl border p-3" style={panelStyle}>
      <View className="flex-row items-center">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${title} 상세 보기`}
          onPress={() => router.push(`/movies/${notification.movieId}`)}
          className="min-w-0 flex-1 flex-row items-center"
        >
          <View
            className="overflow-hidden rounded-xl"
            style={{ width: 56, height: 84, backgroundColor: "#243235" }}
          >
            {posterUrl ? (
              <Image
                source={{ uri: posterUrl }}
                resizeMode="cover"
                style={{ width: 56, height: 84 }}
              />
            ) : (
              <View className="flex-1 items-center justify-center px-1">
                <Text className="text-center text-[10px] text-cinemo-muted">
                  포스터 없음
                </Text>
              </View>
            )}
          </View>

          <View className="min-w-0 flex-1 pl-3">
            <Text
              numberOfLines={2}
              className="text-base font-semibold text-cinemo-text"
            >
              {title}
            </Text>
            <Text className="mt-2 text-xs text-cinemo-gold-light">
              개봉 알림 신청 중
            </Text>
            <Text className="mt-1 text-xs text-cinemo-muted">
              {formatReleaseDate(releaseDate)}
            </Text>
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${title} 개봉 알림 해제`}
          disabled={isLoading}
          onPress={onUnsubscribe}
          className="ml-2 flex-row items-center gap-1 rounded-lg border px-2.5 py-2"
          style={{
            borderColor: "rgba(255,255,255,0.12)",
            backgroundColor: "rgba(255,255,255,0.05)",
            opacity: isLoading ? 0.5 : 1,
          }}
        >
          {isLoading ? (
            <ActivityIndicator
              size="small"
              color={CINEMO_COLORS.textSecondary}
            />
          ) : (
            <Ionicons
              name="notifications-off-outline"
              size={14}
              color={CINEMO_COLORS.textSecondary}
            />
          )}
          <Text className="text-[11px] font-semibold text-cinemo-muted">
            {isLoading ? "해제 중..." : "알림 해제"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function formatReleaseDate(releaseDate: string | null) {
  if (!releaseDate) {
    return "개봉일 미정";
  }

  return `개봉일 ${releaseDate.slice(0, 10).replaceAll("-", ".")}`;
}

const panelStyle = {
  borderColor: "rgba(255,255,255,0.1)",
  backgroundColor: "rgba(255,255,255,0.035)",
};
