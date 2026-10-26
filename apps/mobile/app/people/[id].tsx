import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { CalendarDays, ChevronLeft, Film } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CINEMO_COLORS } from "@cinemo/shared";
import { PersonBookmarkButton } from "@/components/people/PersonBookmarkButton";
import { getImageUrl } from "@/lib/utils";
import { personDetailQueryOptions } from "@/lib/queries/person-detail.query";

function formatDate(date: string | null) {
  if (!date) {
    return null;
  }

  return date.slice(0, 10).replaceAll("-", ".");
}

function getCreditLabel(
  creditType: "DIRECTOR" | "ACTOR",
  characterName: string | null,
) {
  if (creditType === "DIRECTOR") {
    return "감독";
  }

  return characterName ? `배우 · ${characterName}` : "배우";
}

export default function PersonDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const personId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [showFullBiography, setShowFullBiography] = useState(false);
  const [showFullCredits, setShowFullCredits] = useState(false);
  const personQuery = useQuery(personDetailQueryOptions(personId ?? ""));

  if (personQuery.isPending) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-cinemo-bg">
        <ActivityIndicator color={CINEMO_COLORS.accentLight} />
      </SafeAreaView>
    );
  }

  if (personQuery.isError || !personQuery.data) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-cinemo-bg px-5">
        <Text className="text-center text-base text-cinemo-text">
          인물 정보를 불러오지 못했습니다.
        </Text>
        <Pressable
          className="mt-4 rounded-xl bg-cinemo-gold px-5 py-3"
          onPress={() => personQuery.refetch()}
        >
          <Text className="font-semibold text-cinemo-bg">다시 시도</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const person = personQuery.data;
  const biography = person.biography?.trim() ?? "";
  const isLongBiography = biography.length > 240;
  const visibleBiography =
    isLongBiography && !showFullBiography
      ? `${biography.slice(0, 240)}...`
      : biography;
  const visibleCredits = showFullCredits
    ? person.credits
    : person.credits.slice(0, 3);
  const profileUrl = getImageUrl(person.profileUrl);

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-cinemo-bg">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        <View className="px-5 pb-6 pt-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="뒤로 가기"
            onPress={() => router.back()}
            className="mb-5 flex-row items-center gap-1 self-start"
          >
            <ChevronLeft size={20} color={CINEMO_COLORS.textSecondary} />
            <Text className="text-sm text-cinemo-muted">뒤로 가기</Text>
          </Pressable>

          <View
            className="rounded-3xl border p-5"
            style={{
              borderColor: "rgba(255,255,255,0.12)",
              backgroundColor: "rgba(255,255,255,0.035)",
            }}
          >
            <View className="flex-row gap-4">
              <View
                className="overflow-hidden rounded-2xl"
                style={{
                  width: 112,
                  height: 168,
                  backgroundColor: "rgba(255,255,255,0.08)",
                }}
              >
                {profileUrl ? (
                  <Image
                    source={{ uri: profileUrl }}
                    resizeMode="cover"
                    style={{ width: 112, height: 168 }}
                    accessibilityLabel={`${person.name} 프로필`}
                  />
                ) : (
                  <View className="flex-1 items-center justify-center px-3">
                    <Text className="text-center text-xs text-cinemo-muted">
                      프로필 이미지 없음
                    </Text>
                  </View>
                )}
              </View>

              <View className="min-w-0 flex-1 justify-center">
                <View className="flex-row items-center gap-2">
                  <Text className="min-w-0 flex-1 text-2xl font-bold text-cinemo-text">
                    {person.name || "이름 없음"}
                  </Text>
                  <PersonBookmarkButton personId={person.id} />
                </View>

                {person.nameEn && (
                  <Text className="mt-2 text-sm text-cinemo-muted">
                    {person.nameEn}
                  </Text>
                )}

                <View className="mt-4 gap-2">
                  {person.nationality && (
                    <Text className="self-start rounded-full bg-white/10 px-3 py-1 text-xs text-cinemo-muted">
                      {person.nationality}
                    </Text>
                  )}
                  {formatDate(person.birthDate) && (
                    <View className="flex-row items-center gap-1">
                      <CalendarDays
                        size={14}
                        color={CINEMO_COLORS.textSecondary}
                      />
                      <Text className="text-xs text-cinemo-muted">
                        {formatDate(person.birthDate)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {person.birthPlace && (
              <Text className="mt-4 border-t border-white/10 pt-4 text-sm text-cinemo-muted">
                출생지 · {person.birthPlace}
              </Text>
            )}
          </View>
        </View>

        <View className="gap-7 px-5">
          {biography && (
            <View>
              <Text className="text-xl font-bold text-cinemo-text">
                인물 소개
              </Text>
              <Text className="mt-3 leading-6 text-cinemo-muted">
                {visibleBiography}
              </Text>
              {isLongBiography && (
                <Pressable
                  onPress={() => setShowFullBiography((previous) => !previous)}
                  className="mt-3 self-start"
                >
                  <Text className="text-sm font-semibold text-cinemo-gold-light">
                    {showFullBiography ? "접기" : "더보기"}
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          <View>
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-bold text-cinemo-text">
                필모그래피
              </Text>
              <Text className="text-xs text-cinemo-muted">
                {person.credits.length}편
              </Text>
            </View>

            {person.credits.length === 0 ? (
              <View className="mt-3 items-center rounded-2xl border border-white/10 bg-white/3 p-8">
                <Film size={28} color={CINEMO_COLORS.textSecondary} />
                <Text className="mt-3 text-sm text-cinemo-muted">
                  필모그래피 정보가 없습니다.
                </Text>
              </View>
            ) : (
              <View className="mt-3 gap-3">
                {visibleCredits.map((credit) => {
                  const posterUrl = getImageUrl(credit.movie.posterUrl);

                  return (
                    <Pressable
                      key={credit.id}
                      onPress={() => router.push(`/movies/${credit.movie.id}`)}
                      className="flex-row rounded-2xl border border-white/10 bg-white/3 p-3"
                    >
                      <View
                        className="overflow-hidden rounded-xl"
                        style={{
                          width: 64,
                          height: 96,
                          backgroundColor: "rgba(255,255,255,0.08)",
                        }}
                      >
                        {posterUrl ? (
                          <Image
                            source={{ uri: posterUrl }}
                            resizeMode="cover"
                            style={{ width: 64, height: 96 }}
                          />
                        ) : (
                          <View className="flex-1 items-center justify-center px-1">
                            <Text className="text-center text-[10px] text-cinemo-muted">
                              포스터 없음
                            </Text>
                          </View>
                        )}
                      </View>

                      <View className="min-w-0 flex-1 justify-center pl-3">
                        <Text
                          numberOfLines={2}
                          className="text-base font-semibold text-cinemo-text"
                        >
                          {credit.movie.title}
                        </Text>
                        <Text className="mt-2 text-xs text-cinemo-gold-light">
                          {getCreditLabel(
                            credit.creditType,
                            credit.characterName,
                          )}
                        </Text>
                        {credit.movie.releaseDate && (
                          <Text className="mt-1 text-xs text-cinemo-muted">
                            개봉일 {formatDate(credit.movie.releaseDate)}
                          </Text>
                        )}
                      </View>
                    </Pressable>
                  );
                })}

                {person.credits.length > 3 && (
                  <Pressable
                    onPress={() => setShowFullCredits((previous) => !previous)}
                    className="items-center rounded-xl border border-white/10 py-3"
                  >
                    <Text className="text-sm font-semibold text-cinemo-gold-light">
                      {showFullCredits ? "접기" : "필모그래피 더보기"}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
