import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import type { MovieResponse } from "@cinemo/api-contract";
import { movieDetailQueryOptions } from "@/lib/queries/movie-detail.query";
import {
  enrichMovieFromKmdb,
  enrichMovieFromTmdb,
} from "@/lib/api/movies";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { CINEMO_COLORS } from "@cinemo/shared";
import { getImageUrl } from "@/lib/utils";
import { CalendarDays, Clock3, Star } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { MovieTrailerDialog } from "@/components/lobby/MovieTrailerDialog";
import { MovieTrailerButton } from "@/components/movies/MovieTrailerButton";
import { MovieNotificationButton } from "@/components/movies/MovieNotificationButton";
import { MovieRecordActions } from "@/components/movies/MovieRecordActions";

function formatReleaseDate(date: string | null) {
  if (!date) return "개봉일 미정";
  const targetDate = new Date(`${date}T00:00:00`);
  const currentYear = new Date().getFullYear();
  const dateLabel = `${targetDate.getMonth() + 1}월 ${targetDate.getDate()}일`;

  return targetDate.getFullYear() === currentYear
    ? dateLabel
    : `${targetDate.getFullYear()}년 ${dateLabel}`;
}

function formatRuntime(runtime: number | null) {
  if (!runtime) return "정보 없음";
  const hours = Math.floor(runtime / 60);
  const minutes = Math.floor(runtime % 60);

  return `${hours > 0 ? `${hours}시간 ` : ""}${minutes}분`;
}

function getPersonName(person: { name: string; nameEn: string | null }) {
  return person.name.trim() || person.nameEn?.trim() || "정보 없음";
}

function needsMovieEnrichment(movie: MovieResponse) {
  const hasOverview = Boolean(movie.overview?.trim());
  const hasDirector = movie.credits.some(
    (credit) => credit.creditType.trim().toUpperCase() === "DIRECTOR",
  );

  return !hasOverview || !hasDirector;
}

export default function MovieDetailScreen() {
  const params = useLocalSearchParams<{ id: string; edit?: string }>();
  const movieId = Array.isArray(params.id) ? params.id[0] : params.id;
  const shouldEditRecord =
    (Array.isArray(params.edit) ? params.edit[0] : params.edit) === "record";
  const movieQuery = useQuery(movieDetailQueryOptions(movieId ?? ""));
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const enrichmentAttemptedRef = useRef<string | null>(null);

  useEffect(() => {
    const movie = movieQuery.data;

    if (
      movieQuery.isPending ||
      !movie ||
      !movieId ||
      enrichmentAttemptedRef.current === movieId ||
      !needsMovieEnrichment(movie)
    ) {
      return;
    }

    const tmdbLink = movie.providerLinks.find(
      (link) => link.sourceProvider.trim().toUpperCase() === "TMDB",
    );
    const tmdbMovieId = Number(tmdbLink?.externalId);
    enrichmentAttemptedRef.current = movieId;

    void (async () => {
      try {
        if (Number.isInteger(tmdbMovieId)) {
          await enrichMovieFromTmdb(movieId, tmdbMovieId);
        } else {
          await enrichMovieFromKmdb(movieId);
        }
        await movieQuery.refetch();
      } catch (error) {
        console.warn("[모바일 영화 정보 보강 실패]", error);
      }
    })();
  }, [movieId, movieQuery.data, movieQuery.isPending, movieQuery.refetch]);

  if (movieQuery.isPending) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-cinemo-bg">
        <ActivityIndicator color={CINEMO_COLORS.accentLight} />
      </SafeAreaView>
    );
  }
  if (movieQuery.isError || !movieQuery.data) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-cinemo-bg px-5">
        <Text style={{ color: CINEMO_COLORS.textPrimary }}>
          영화 정보를 불러오지 못했습니다.
        </Text>

        <Pressable
          className="mt-4 rounded-xl bg-cinemo-gold px-5 py-3"
          onPress={() => movieQuery.refetch()}
        >
          <Text className="font-semibold text-cinemo-bg">다시 시도</Text>
        </Pressable>
      </SafeAreaView>
    );
  }
  const movie = movieQuery.data;

  const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w185";

  const providerSearchUrls: Record<string, string> = {
    NETFLIX: "https://www.netflix.com/kr/search?q=",
    WATCHA: "https://pedia.watcha.com/ko/search?query=",
    TVING: "https://www.tving.com/search?query=",
    DISNEY_PLUS: "https://www.disneyplus.com/ko-kr/search?q=",
    WAVVE: "https://www.wavve.com/search?searchWord=",
    APPLE_TV: "https://tv.apple.com/kr/search?term=",
    PRIME_VIDEO: "https://www.primevideo.com/search/ref=atv_nb_sr?phrase=",
  };

  function getProviderUrl(
    provider: string,
    movieTitle: string,
    fallbackUrl: string,
  ) {
    const searchUrl = providerSearchUrls[provider];
    return searchUrl
      ? `${searchUrl}${encodeURIComponent(movieTitle)}`
      : fallbackUrl;
  }

  const primaryTitle =
    movie.titles.find((title) => title.titleType === "PRIMARY") ??
    movie.titles[0];

  const originalTitle = movie.titles.find(
    (title) => title.titleType === "ORIGINAL",
  );

  const activeReleases = movie.releases.filter(
    (release) => release.status !== "CANCELLED" && release.releaseDate,
  );

  const primaryRelease =
    activeReleases.find((release) => release.isPrimary) ?? activeReleases[0];

  const poster =
    movie.media.find(
      (media) => media.mediaType === "POSTER" && media.isPrimary,
    ) ?? movie.media.find((media) => media.mediaType === "POSTER");

  const backdrop =
    movie.media.find(
      (media) => media.mediaType === "BACKDROP" && media.isPrimary,
    ) ?? movie.media.find((media) => media.mediaType === "BACKDROP");

  const posterUrl = getImageUrl(poster?.url);
  const backdropUrl = getImageUrl(backdrop?.url ?? poster?.url);

  const directors = movie.credits.filter(
    (credit) => credit.creditType.trim().toUpperCase() === "DIRECTOR",
  );

  const actors = movie.credits
    .filter((credit) => credit.creditType.trim().toUpperCase() === "ACTOR")
    .slice(0, 10);

  const providers = Array.from(
    new Map(
      movie.watchOptions.map((option) => [
        option.tmdbProviderId ?? option.watchProvider,
        option,
      ]),
    ).values(),
  );

  const trailer =
    movie.media.find(
      (media) =>
        media.mediaType.toUpperCase() === "TRAILER" &&
        media.sourceProvider.toUpperCase() === "YOUTUBE",
    ) ?? null;

  const movieTitle = primaryTitle.title ?? "영화";

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-cinemo-bg">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/*<View className="px-5 pb-4">*/}
        {/*  <Pressable*/}
        {/*    className="flex-row items-center gap-1"*/}
        {/*    onPress={() => router.back()}*/}
        {/*  >*/}
        {/*    <ChevronLeft size={20} color={CINEMO_COLORS.textSecondary} />*/}
        {/*    <Text style={{ color: CINEMO_COLORS.textSecondary }}>*/}
        {/*      뒤로 가기*/}
        {/*    </Text>*/}
        {/*  </Pressable>*/}
        {/*</View>*/}

        {backdropUrl ? (
          <ImageBackground
            source={{ uri: backdropUrl }}
            resizeMode="cover"
            style={{ minHeight: 320 }}
          >
            <View
              className="flex-1 items-center px-5 pb-8 pt-16"
              style={{ backgroundColor: "rgba(7, 22, 25, 0.78)" }}
            >
              {posterUrl ? (
                <Image
                  source={{ uri: posterUrl }}
                  resizeMode="cover"
                  className="rounded-2xl"
                  style={{
                    width: 180,
                    aspectRatio: 2 / 3,
                  }}
                />
              ) : (
                <View
                  className="items-center justify-center rounded-2xl"
                  style={{
                    width: 180,
                    aspectRatio: 2 / 3,
                    backgroundColor: CINEMO_COLORS.surface,
                  }}
                >
                  <Text style={{ color: CINEMO_COLORS.textSecondary }}>
                    포스터 준비중
                  </Text>
                </View>
              )}
            </View>
          </ImageBackground>
        ) : null}

        <View className="gap-6 px-5 pt-6">
          <View>
            <View className="mb-3 flex-row flex-wrap gap-2">
              {movie.genres.map((genre) => (
                <View
                  key={genre.id}
                  className="rounded-full border px-3 py-1"
                  style={{
                    borderColor: "rgba(212, 166, 76, 0.45)",
                    backgroundColor: "rgba(212, 166, 76, 0.12)",
                  }}
                >
                  <Text
                    className="text-xs"
                    style={{ color: CINEMO_COLORS.accentLight }}
                  >
                    {genre.name}
                  </Text>
                </View>
              ))}
            </View>

            <Text
              className="text-3xl font-bold"
              style={{ color: CINEMO_COLORS.textPrimary }}
            >
              {primaryTitle?.title ?? "제목 없음"}
            </Text>

            {originalTitle && (
              <Text
                className="mt-2 text-base"
                style={{ color: CINEMO_COLORS.textSecondary }}
              >
                {originalTitle.title}
              </Text>
            )}
          </View>

          <View className="flex-row flex-wrap items-center gap-2">
            {trailer?.externalId && (
              <MovieTrailerButton onPress={() => setIsTrailerOpen(true)} />
            )}

            <MovieNotificationButton
              movieId={movieId ?? ""}
              isReleased={primaryRelease?.status === "RELEASED"}
            />
          </View>

          <MovieRecordActions
            movieId={movieId ?? ""}
            openEdit={shouldEditRecord}
          />

          <View className="flex-row flex-wrap gap-4">
            <View className="flex-row items-center gap-1">
              <CalendarDays size={15} color={CINEMO_COLORS.textSecondary} />
              <Text style={{ color: CINEMO_COLORS.textSecondary }}>
                {formatReleaseDate(primaryRelease?.releaseDate ?? null)}
              </Text>
            </View>

            <View className="flex-row items-center gap-1">
              <Clock3 size={15} color={CINEMO_COLORS.textSecondary} />
              <Text style={{ color: CINEMO_COLORS.textSecondary }}>
                {formatRuntime(movie.runtime)}
              </Text>
            </View>

            {movie.tmdbVoteAverage !== null && (
              <View className="flex-row items-center gap-1">
                <Star size={15} color={CINEMO_COLORS.accentLight} />
                <Text style={{ color: CINEMO_COLORS.accentLight }}>
                  {movie.tmdbVoteAverage.toFixed(1)}
                </Text>
              </View>
            )}
          </View>

          {providers.length > 0 && (
            <View>
              <View className="flex-row items-end justify-between">
                <View>
                  <Text
                    className="text-xl font-bold"
                    style={{ color: CINEMO_COLORS.textPrimary }}
                  >
                    어디서 볼 수 있나요?
                  </Text>

                  <Text
                    className="mt-1 text-xs"
                    style={{ color: CINEMO_COLORS.textSecondary }}
                  >
                    대한민국에서 이용 가능한 플랫폼
                  </Text>
                </View>

                <Text
                  className="text-xs"
                  style={{ color: CINEMO_COLORS.textSecondary }}
                >
                  {providers.length}개 플랫폼
                </Text>
              </View>

              <View className="mt-4 flex-row flex-wrap gap-6">
                {providers.map((provider) => (
                  <Pressable
                    key={`${provider.tmdbProviderId ?? provider.watchProvider}`}
                    className="h-12 px-0"
                    onPress={() =>
                      Linking.openURL(
                        getProviderUrl(
                          provider.watchProvider,
                          movieTitle,
                          provider.url,
                        ),
                      )
                    }
                  >
                    {provider.logoPath ? (
                      <Image
                        source={{
                          uri: `${TMDB_IMAGE_BASE_URL}${provider.logoPath}`,
                        }}
                        resizeMode="contain"
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                        }}
                        accessibilityLabel={`${provider.watchProvider} 로고`}
                      />
                    ) : (
                      <Text style={{ color: CINEMO_COLORS.textPrimary }}>
                        {provider.watchProvider}
                      </Text>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <View>
            <Text
              className="text-xl font-bold"
              style={{ color: CINEMO_COLORS.textPrimary }}
            >
              영화 소개
            </Text>

            <Text
              className="mt-3 leading-6"
              style={{ color: CINEMO_COLORS.textSecondary }}
            >
              {movie.overview || "줄거리 정보가 없습니다."}
            </Text>
          </View>

          <View>
            <Text
              className="text-xl font-bold"
              style={{ color: CINEMO_COLORS.textPrimary }}
            >
              감독
            </Text>

            <View className="mt-3 flex-row flex-wrap gap-2">
              {directors.length > 0 ? (
                directors.map((credit) => (
                  <Pressable
                    key={credit.id}
                    className="rounded-lg px-3 py-2"
                    style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                    onPress={() => router.push(`/people/${credit.person.id}`)}
                  >
                    <Text style={{ color: CINEMO_COLORS.textPrimary }}>
                      {getPersonName(credit.person)}
                    </Text>
                  </Pressable>
                ))
              ) : (
                <Text style={{ color: CINEMO_COLORS.textSecondary }}>
                  정보 없음
                </Text>
              )}
            </View>
          </View>

          <View>
            <Text
              className="text-xl font-bold"
              style={{ color: CINEMO_COLORS.textPrimary }}
            >
              등장인물
            </Text>

            <View className="mt-3 flex-row flex-wrap gap-2">
              {actors.length > 0 ? (
                actors.map((credit) => (
                  <Pressable
                    key={credit.id}
                    className="rounded-lg px-3 py-2"
                    style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                    onPress={() => router.push(`/people/${credit.person.id}`)}
                  >
                    <Text style={{ color: CINEMO_COLORS.textPrimary }}>
                      {getPersonName(credit.person)}
                    </Text>
                  </Pressable>
                ))
              ) : (
                <Text style={{ color: CINEMO_COLORS.textSecondary }}>
                  정보 없음
                </Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
      <MovieTrailerDialog
        open={isTrailerOpen}
        videoKey={trailer?.externalId ?? null}
        title={movieTitle}
        onOpenChange={setIsTrailerOpen}
      />
    </SafeAreaView>
  );
}
