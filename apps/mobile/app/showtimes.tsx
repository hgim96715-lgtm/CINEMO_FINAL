import { useState } from "react";
import { Alert, Linking, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Clock3, ExternalLink, MapPin, Search } from "lucide-react-native";

import { CINEMO_COLORS } from "@cinemo/shared";
import { apiClient } from "@/lib/api/apiClient";

type Showtime = {
  chain: "CGV" | "LOTTE_CINEMA" | "MEGABOX";
  theaterName: string;
  address: string | null;
  distanceKm: number;
  startsAt: string;
  screenName: string | null;
  remainingSeats: number | null;
  bookingUrl: string;
};

type ShowtimeResponse = {
  movieTitle: string;
  date: string;
  items: Showtime[];
  unavailableChains: string[];
};

function chainLabel(chain: Showtime["chain"]) {
  return chain === "LOTTE_CINEMA" ? "롯데시네마" : chain;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function ShowtimesScreen() {
  const [movieTitle, setMovieTitle] = useState("");
  const [result, setResult] = useState<ShowtimeResponse>();
  const [isLoading, setIsLoading] = useState(false);

  async function findShowtimes() {
    const title = movieTitle.trim();
    if (!title) {
      Alert.alert("영화 제목", "보고 싶은 영화 제목을 입력해 주세요.");
      return;
    }

    setIsLoading(true);
    setResult(undefined);
    try {
      const location = await import("expo-location");
      const permission = await location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("현재 위치 필요", "가까운 상영시간을 비교하려면 위치 권한이 필요해요.");
        return;
      }
      const position = await location.getCurrentPositionAsync({ accuracy: location.Accuracy.Low });
      const { data } = await apiClient.get<ShowtimeResponse>("/cinema-showtimes", {
        params: {
          movieTitle: title,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
      });
      setResult(data);
    } catch {
      Alert.alert("상영시간표", "상영시간표를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-cinemo-bg">
      <ScrollView className="flex-1" contentContainerClassName="px-5 py-8 pb-32">
        <View className="rounded-[28px] border border-cinemo-gold/25 bg-cinemo-surface p-6">
          <Text className="text-xs font-semibold tracking-[3px] text-cinemo-gold">CINEMA TIME</Text>
          <Text className="mt-4 text-3xl font-semibold text-cinemo-text">가장 빠른 영화 보러가기</Text>
          <Text className="mt-3 leading-6 text-cinemo-muted">내 주변 CGV·롯데시네마·메가박스의 시작 시간을 한 번에 비교해요.</Text>

          <View className="mt-6 flex-row items-center rounded-2xl border border-cinemo-border bg-cinemo-bg px-4">
            <Search size={20} color={CINEMO_COLORS.accentLight} />
            <TextInput
              value={movieTitle}
              onChangeText={setMovieTitle}
              placeholder="보고 싶은 영화 제목"
              placeholderTextColor={CINEMO_COLORS.placeholder}
              className="ml-3 h-14 flex-1 text-base text-cinemo-text"
              returnKeyType="search"
              onSubmitEditing={findShowtimes}
            />
          </View>
          <Pressable
            disabled={isLoading}
            onPress={findShowtimes}
            className="mt-3 flex-row items-center justify-center gap-2 rounded-2xl bg-cinemo-gold px-5 py-4 disabled:opacity-60"
          >
            <MapPin size={20} color={CINEMO_COLORS.background} />
            <Text className="font-semibold text-cinemo-bg">{isLoading ? "가까운 회차를 찾는 중…" : "내 주변 회차 보기"}</Text>
          </Pressable>
        </View>

        {result?.unavailableChains.length ? (
          <Text className="mt-4 rounded-xl border border-cinemo-border bg-cinemo-surface px-4 py-3 text-sm text-cinemo-muted">일시적으로 확인하지 못한 체인: {result.unavailableChains.join(" · ")}</Text>
        ) : null}

        {result ? (
          <View className="mt-8">
            <Text className="text-xs font-semibold tracking-[3px] text-cinemo-gold">NEAREST SHOWTIMES</Text>
            <Text className="mt-2 text-2xl font-semibold text-cinemo-text">{result.movieTitle}</Text>
            <Text className="mt-1 text-sm text-cinemo-muted">{result.date} · 가장 빠른 시간 순</Text>

            {result.items.length === 0 ? (
              <Text className="mt-6 rounded-2xl bg-cinemo-surface p-5 text-cinemo-muted">상영 회차를 찾지 못했어요. 다른 영화 제목이나 날짜를 확인해 주세요.</Text>
            ) : (
              <View className="mt-4 gap-3">
                {result.items.map((showtime) => (
                  <View key={`${showtime.chain}-${showtime.theaterName}-${showtime.startsAt}`} className="rounded-2xl border border-cinemo-border bg-cinemo-surface p-5">
                    <View className="flex-row items-start justify-between gap-4">
                      <View className="flex-1">
                        <Text className="self-start rounded-full border border-cinemo-gold/30 px-2 py-1 text-xs font-semibold text-cinemo-gold-light">{chainLabel(showtime.chain)}</Text>
                        <Text className="mt-3 text-lg font-semibold text-cinemo-text">{showtime.theaterName}</Text>
                        <Text className="mt-1 text-sm text-cinemo-muted">{showtime.distanceKm}km · {showtime.address ?? "주소 정보 없음"}</Text>
                      </View>
                      <Pressable onPress={() => void Linking.openURL(showtime.bookingUrl)} className="rounded-xl bg-cinemo-gold/15 p-3">
                        <ExternalLink size={18} color={CINEMO_COLORS.accentLight} />
                      </Pressable>
                    </View>
                    <View className="mt-5 flex-row items-center gap-2">
                      <Clock3 size={17} color={CINEMO_COLORS.accentLight} />
                      <Text className="text-xl font-semibold text-cinemo-text">{formatTime(showtime.startsAt)}</Text>
                      <Text className="text-sm text-cinemo-muted">{showtime.screenName ?? "상영관 정보 없음"}{showtime.remainingSeats === null ? "" : ` · 잔여 ${showtime.remainingSeats}석`}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
