import { Search } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";

import { CINEMO_COLORS } from "@cinemo/shared";
import type { MapPlace, Venue } from "@/lib/api/map";
import type {
  UpdateMovieRecordInput,
  ViewingPlaceType,
  ViewingPlatform,
} from "@/lib/api/movie-records";
import { mapSearchQueryOptions } from "@/lib/queries/map-search.query";
import { useSaveVenue } from "@/lib/queries/map-venue.mutation";

type Props = {
  visible: boolean;
  watchedDate: string;
  initialPlaceType: ViewingPlaceType | null;
  initialPlatform: ViewingPlatform | null;
  initialPlatformCustom: string | null;
  onClose: () => void;
  onSave: (input: UpdateMovieRecordInput, venue?: Venue) => void;
};

const platformOptions: Array<{ value: ViewingPlatform; label: string }> = [
  { value: "NETFLIX", label: "Netflix" },
  { value: "WATCHA", label: "왓챠" },
  { value: "TVING", label: "티빙" },
  { value: "DISNEY_PLUS", label: "Disney+" },
  { value: "WAVVE", label: "웨이브" },
  { value: "APPLE_TV", label: "Apple TV+" },
  { value: "PRIME_VIDEO", label: "Prime Video" },
  { value: "COUPANG_PLAY", label: "쿠팡플레이" },
  { value: "TV", label: "TV" },
  { value: "OTHER", label: "기타" },
];

export function MovieViewingDetailsModal({
  visible,
  watchedDate,
  initialPlaceType,
  initialPlatform,
  initialPlatformCustom,
  onClose,
  onSave,
}: Props) {
  const [placeType, setPlaceType] = useState<ViewingPlaceType>(
    initialPlaceType ?? "HOME",
  );
  const [platform, setPlatform] = useState<ViewingPlatform>(
    initialPlatform ?? "NETFLIX",
  );
  const [customPlatform, setCustomPlatform] = useState(
    initialPlatformCustom ?? "",
  );
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [query, setQuery] = useState("");
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const searchQuery = useQuery(
    mapSearchQueryOptions({ query: submittedQuery }),
  );
  const saveVenueMutation = useSaveVenue();

  useEffect(() => {
    if (!visible) {
      return;
    }

    setPlaceType(initialPlaceType ?? "HOME");
    setPlatform(initialPlatform ?? "NETFLIX");
    setCustomPlatform(initialPlatformCustom ?? "");
    setSubmittedQuery("");
    setQuery("");
    setSelectedVenue(null);
  }, [
    initialPlaceType,
    initialPlatform,
    initialPlatformCustom,
    visible,
  ]);

  const selectPlaceType = (nextType: ViewingPlaceType) => {
    setPlaceType(nextType);
    if (nextType === "HOME") {
      setSelectedVenue(null);
    }
  };

  const submitSearch = () => {
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      setSubmittedQuery(trimmedQuery);
    }
  };

  const selectVenue = (place: MapPlace) => {
    saveVenueMutation.mutate(place, {
      onSuccess: (venue) => {
        setSelectedVenue(venue);
        setSubmittedQuery("");
      },
    });
  };

  const save = () => {
    if (placeType === "VENUE" && !selectedVenue) {
      return;
    }

    if (placeType === "HOME") {
      onSave({
        isWatched: true,
        watchedAt: watchedDate,
        venueId: null,
        viewingPlaceType: "HOME",
        viewingPlatform: platform,
        viewingPlatformCustom:
          platform === "OTHER" ? customPlatform.trim() : null,
      });
      return;
    }

    onSave({
      isWatched: true,
      watchedAt: watchedDate,
      venueId: selectedVenue?.id ?? null,
      viewingPlaceType: "VENUE",
      viewingPlatform: null,
      viewingPlatformCustom: null,
    }, selectedVenue ?? undefined);
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: "rgba(0,0,0,0.68)" }}
      >
        <View
          className="max-h-[88%] w-full max-w-md overflow-hidden rounded-3xl border"
          style={{
            borderColor: "rgba(212,181,106,0.42)",
            backgroundColor: "#102022",
          }}
        >
          <ScrollView keyboardShouldPersistTaps="handled">
            <View className="px-6 pb-5 pt-7">
              <Text className="text-center text-xl font-bold text-cinemo-gold-light">
                어디서 봤나요?
              </Text>
              <Text className="mt-3 text-center text-sm text-cinemo-muted">
                관람 정보를 저장하면 마이 시네마에서 다시 볼 수 있어요.
              </Text>
            </View>

            <View className="border-t border-white/10 px-6 py-5">
              <View className="flex-row gap-2">
                {(["HOME", "VENUE"] as const).map((type) => {
                  const selected = placeType === type;
                  return (
                    <Pressable
                      key={type}
                      onPress={() => selectPlaceType(type)}
                      className="flex-1 items-center rounded-xl border py-3"
                      style={{
                        borderColor: selected
                          ? "rgba(212,181,106,0.7)"
                          : "rgba(255,255,255,0.15)",
                        backgroundColor: selected
                          ? "rgba(212,181,106,0.18)"
                          : "rgba(255,255,255,0.05)",
                      }}
                    >
                      <Text
                        className="font-semibold"
                        style={{
                          color: selected
                            ? CINEMO_COLORS.accentLight
                            : CINEMO_COLORS.textSecondary,
                        }}
                      >
                        {type === "HOME" ? "집에서" : "극장에서"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {placeType === "HOME" ? (
                <View className="mt-5">
                  <Text className="mb-3 text-sm font-semibold text-cinemo-muted">
                    시청 플랫폼
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {platformOptions.map((option) => {
                      const selected = platform === option.value;
                      return (
                        <Pressable
                          key={option.value}
                          onPress={() => setPlatform(option.value)}
                          className="rounded-xl border px-3 py-2.5"
                          style={{
                            borderColor: selected
                              ? "rgba(212,181,106,0.7)"
                              : "rgba(255,255,255,0.15)",
                            backgroundColor: selected
                              ? "rgba(212,181,106,0.18)"
                              : "rgba(255,255,255,0.05)",
                          }}
                        >
                          <Text
                            className="text-sm"
                            style={{
                              color: selected
                                ? CINEMO_COLORS.accentLight
                                : CINEMO_COLORS.textSecondary,
                            }}
                          >
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {platform === "OTHER" && (
                    <TextInput
                      value={customPlatform}
                      onChangeText={setCustomPlatform}
                      placeholder="플랫폼 이름을 입력하세요"
                      placeholderTextColor="rgba(255,255,255,0.38)"
                      className="mt-3 rounded-xl border border-white/15 px-4 py-3 text-white"
                    />
                  )}
                </View>
              ) : (
                <View className="mt-5">
                  {selectedVenue ? (
                    <View className="rounded-xl border border-cinemo-gold/40 bg-cinemo-gold/10 p-4">
                      <Text className="font-semibold text-white">
                        {selectedVenue.brandName
                          ? `${selectedVenue.brandName} · ${selectedVenue.name}`
                          : selectedVenue.name}
                      </Text>
                      <Text className="mt-1 text-sm text-cinemo-muted">
                        {selectedVenue.roadAddress ??
                          selectedVenue.jibunAddress}
                      </Text>
                      <Pressable
                        onPress={() => {
                          setSelectedVenue(null);
                          setQuery("");
                        }}
                        className="mt-3 self-start"
                      >
                        <Text className="text-sm text-cinemo-gold-light">
                          장소 변경
                        </Text>
                      </Pressable>
                    </View>
                  ) : (
                    <>
                      <View className="flex-row gap-2">
                        <TextInput
                          value={query}
                          onChangeText={setQuery}
                          onSubmitEditing={submitSearch}
                          returnKeyType="search"
                          placeholder="관람 장소 검색"
                          placeholderTextColor="rgba(255,255,255,0.38)"
                          className="min-w-0 flex-1 rounded-xl border border-white/15 px-4 py-3 text-white"
                        />
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="관람 장소 검색"
                          onPress={submitSearch}
                          className="items-center justify-center rounded-xl border border-cinemo-gold/60 px-4"
                          style={{ backgroundColor: "rgba(212,181,106,0.15)" }}
                        >
                          <Search size={18} color={CINEMO_COLORS.accentLight} />
                        </Pressable>
                      </View>
                      {searchQuery.isFetching && (
                        <Text className="mt-3 text-sm text-cinemo-muted">
                          검색 중...
                        </Text>
                      )}
                      <ScrollView
                        className="mt-3"
                        style={{ maxHeight: 192 }}
                        nestedScrollEnabled
                        keyboardShouldPersistTaps="handled"
                      >
                        <View className="gap-2">
                          {searchQuery.data?.documents.map((place) => (
                            <Pressable
                              key={place.id}
                              disabled={saveVenueMutation.isPending}
                              onPress={() => selectVenue(place)}
                              className="rounded-xl border border-white/10 px-4 py-3"
                            >
                              <Text className="font-semibold text-white">
                                {place.place_name}
                              </Text>
                              <Text className="mt-1 text-sm text-cinemo-muted">
                                {place.road_address_name || place.address_name}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      </ScrollView>
                    </>
                  )}
                </View>
              )}
            </View>

            <View className="flex-row justify-end gap-3 border-t border-white/10 px-6 py-5">
              <Pressable
                onPress={onClose}
                className="rounded-xl border border-white/15 px-5 py-3"
              >
                <Text className="font-semibold text-cinemo-muted">닫기</Text>
              </Pressable>
              <Pressable
                disabled={placeType === "VENUE" && !selectedVenue}
                onPress={save}
                className="rounded-xl px-5 py-3"
                style={{
                  backgroundColor: CINEMO_COLORS.accent,
                  opacity: placeType === "VENUE" && !selectedVenue ? 0.45 : 1,
                }}
              >
                <Text className="font-semibold text-cinemo-bg">저장하기</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
