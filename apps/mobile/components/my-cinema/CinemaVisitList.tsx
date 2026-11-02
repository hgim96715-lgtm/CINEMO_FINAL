import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { CinemaVisit } from "@/lib/api/cinema-visits";
import { cinemaVisitsQueryOptions } from "@/lib/queries/cinema-visit.query";
import { Text, View } from "react-native";
import { CalendarDays, MapPin, Stamp } from "lucide-react-native";
import { CINEMO_COLORS } from "@cinemo/shared";

type CinemaVisitGroup = {
  venueId: string;
  venueName: string;
  address: string | null;
  visits: CinemaVisit[];
  latestVisitedAt: string;
};

export function CinemaVisitList() {
  const visitQuery = useQuery(cinemaVisitsQueryOptions());
  const groups = useMemo<CinemaVisitGroup[]>(() => {
    const grouped = new Map<string, CinemaVisit[]>();
    for (const visit of visitQuery.data ?? []) {
      const current = grouped.get(visit.venueId) ?? [];
      grouped.set(visit.venueId, [...current, visit]);
    }
    return Array.from(grouped.entries()).map(([venueId, visits]) => {
      const latestVisitedAt = visits.reduce(
        (latest, visit) =>
          visit.visitedAt > latest ? visit.visitedAt : latest,
        visits[0].visitedAt,
      );
      return {
        venueId,
        venueName: visits[0].venue?.name ?? "영화관",
        address: visits[0].venue?.address ?? null,
        visits,
        latestVisitedAt,
      };
    });
  }, [visitQuery.data]);

  if (visitQuery.isPending) {
    return (
      <Text className="text-sm text-cinemo-muted">
        방문한 영화관을 불러오는 중...
      </Text>
    );
  }
  if (visitQuery.isError) {
    return (
      <Text className="text-sm text-cinemo-muted">
        방문 기록을 불러오지 못했습니다.
      </Text>
    );
  }
  if (groups.length === 0) {
    return (
      <View className="items-center rounded-2xl border p-8" style={panelStyle}>
        <Stamp size={32} color={CINEMO_COLORS.textSecondary} />
        <Text className="mt-3 text-center text-sm text-cinemo-muted">
          아직 방문한 영화관이 없습니다.
        </Text>
      </View>
    );
  }
  return (
    <View className="gap-3">
      {groups.map((group) => (
        <View
          key={group.venueId}
          className="rounded-2xl border p-4"
          style={panelStyle}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-base font-semibold text-cinemo-text">
                {group.venueName}
              </Text>

              {group.address && (
                <Text
                  numberOfLines={1}
                  className="mt-1 text-xs text-cinemo-muted"
                >
                  {group.address}
                </Text>
              )}
            </View>

            <View className="ml-3 items-center">
              <Stamp size={22} color={CINEMO_COLORS.accentLight} />
              <Text className="mt-1 text-sm font-semibold text-cinemo-gold-light">
                {group.visits.length}회
              </Text>
            </View>
          </View>

          <View className="mt-4 flex-row items-center gap-4">
            <View className="flex-row items-center gap-1">
              <MapPin size={15} color={CINEMO_COLORS.textSecondary} />
              <Text className="text-xs text-cinemo-muted">
                방문 기록 {group.visits.length}개
              </Text>
            </View>

            <View className="flex-row items-center gap-1">
              <CalendarDays size={15} color={CINEMO_COLORS.textSecondary} />
              <Text className="text-xs text-cinemo-muted">
                {formatVisitedAt(group.latestVisitedAt)}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

function formatVisitedAt(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

const panelStyle = {
  borderColor: "rgba(255,255,255,0.1)",
  backgroundColor: "rgba(255,255,255,0.035)",
};
