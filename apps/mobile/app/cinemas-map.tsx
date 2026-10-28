import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronDown, MapPin, X } from "lucide-react-native";

import {
  CINEMA_REGION_LABELS,
  CINEMO_COLORS,
  INTEGRATED_GWANGJU_JEONNAM_CODE,
  normalizeCinemaRegionCode,
} from "@cinemo/shared";

import { type CinemaVenue, getCinemaVenues } from "@/lib/api/map";
import { CinemaRegionMap } from "@/components/lobby/CinemaRegionMap";
import { CinemaKakaoMap } from "@/components/map/CinemaKakaoMap";

const REGION_ORDER = [
  "41",
  "11",
  "29,46",
  "48",
  "26",
  "42",
  "47",
  "45",
  "44",
  "43",
  "30",
  "27",
  "28",
  "31",
  "36",
  "50",
];

function getDisplayRegionCode(venue: CinemaVenue) {
  const code = normalizeCinemaRegionCode(venue.region1Code, venue.region1Name);

  if (code === "29" || code === "46") {
    return INTEGRATED_GWANGJU_JEONNAM_CODE;
  }

  return code;
}

export default function CinemasMapScreen() {
  const [venues, setVenues] = useState<CinemaVenue[]>([]);
  const [selectedRegionCode, setSelectedRegionCode] = useState<string>();
  const [selectedRegion2Code, setSelectedRegion2Code] = useState<string>();
  const [selectedBrandName, setSelectedBrandName] = useState<string>();
  const [selectedVenueId, setSelectedVenueId] = useState<string>();
  const [isVenueListExpanded, setIsVenueListExpanded] = useState(false);
  const [regionPickerMode, setRegionPickerMode] = useState<
    "region1" | "region2"
  >();
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const pageScrollRef = useRef<ScrollView>(null);
  const [mapSectionY, setMapSectionY] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadVenues() {
      try {
        const data = await getCinemaVenues(controller.signal);

        setVenues(data);
      } catch {
        if (!controller.signal.aborted) {
          setIsError(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadVenues();

    return () => controller.abort();
  }, []);

  const counts = useMemo(() => {
    return venues.reduce<Record<string, number>>((result, venue) => {
      const regionCode = getDisplayRegionCode(venue);

      if (regionCode) {
        result[regionCode] = (result[regionCode] ?? 0) + 1;
      }

      return result;
    }, {});
  }, [venues]);

  const selectedVenues = useMemo(() => {
    const regionVenues = selectedRegionCode
      ? venues.filter(
          (venue) => getDisplayRegionCode(venue) === selectedRegionCode,
        )
      : venues;
    const districtVenues = selectedRegion2Code
      ? regionVenues.filter(
          (venue) => venue.region2Code === selectedRegion2Code,
        )
      : regionVenues;

    if (!selectedBrandName) {
      return districtVenues;
    }

    return districtVenues.filter((venue) =>
      selectedBrandName === "기타"
        ? !venue.brandName?.trim()
        : venue.brandName === selectedBrandName,
    );
  }, [selectedBrandName, selectedRegion2Code, selectedRegionCode, venues]);

  const regionVenues = useMemo(() => {
    if (!selectedRegionCode) {
      return venues;
    }

    return venues.filter(
      (venue) => getDisplayRegionCode(venue) === selectedRegionCode,
    );
  }, [selectedRegionCode, venues]);

  const selectedAreaVenues = useMemo(() => {
    if (!selectedRegion2Code) {
      return regionVenues;
    }

    return regionVenues.filter(
      (venue) => venue.region2Code === selectedRegion2Code,
    );
  }, [regionVenues, selectedRegion2Code]);

  const brandCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const venue of selectedAreaVenues) {
      const brand = venue.brandName?.trim() || "기타";
      counts.set(brand, (counts.get(brand) ?? 0) + 1);
    }

    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [selectedAreaVenues]);

  const region2Options = useMemo(() => {
    if (!selectedRegionCode) {
      return [];
    }

    const options = new Map<string, { name: string; count: number }>();

    for (const venue of regionVenues) {
      if (!venue.region2Code || !venue.region2Name) {
        continue;
      }

      const current = options.get(venue.region2Code);
      options.set(venue.region2Code, {
        name: venue.region2Name,
        count: (current?.count ?? 0) + 1,
      });
    }

    return [...options.entries()].sort(([, a], [, b]) =>
      a.name.localeCompare(b.name, "ko"),
    );
  }, [regionVenues]);

  const selectedRegionName = selectedRegionCode
    ? (selectedRegionCode === INTEGRATED_GWANGJU_JEONNAM_CODE
        ? CINEMA_REGION_LABELS["29"]
        : (CINEMA_REGION_LABELS[selectedRegionCode] ?? "선택 지역"))
    : "전국";

  function handleRegionSelect(regionCode: string) {
    setSelectedRegionCode(regionCode);
    setSelectedRegion2Code(undefined);
    setSelectedBrandName(undefined);
    setSelectedVenueId(undefined);
    setIsVenueListExpanded(false);
  }

  function handleRegion2Select(region2Code?: string) {
    setSelectedRegion2Code(region2Code);
    setSelectedBrandName(undefined);
    setSelectedVenueId(undefined);
    setIsVenueListExpanded(false);
  }

  function handleBrandSelect(brandName?: string) {
    setSelectedBrandName(brandName);
    setIsVenueListExpanded(false);
  }

  function handleVenueSelect(venueId: string) {
    setSelectedVenueId(venueId);

    requestAnimationFrame(() => {
      if (mapSectionY > 0) {
        pageScrollRef.current?.scrollTo({
          y: Math.max(mapSectionY - 12, 0),
          animated: true,
        });
      }
    });
  }

  const selectedRegion2Name = region2Options.find(
    ([code]) => code === selectedRegion2Code,
  )?.[1].name;

  const selectedAreaName = selectedRegion2Name
    ? `${selectedRegionName} ${selectedRegion2Name}`
    : selectedRegionName;

  function getKakaoDirectionsUrl(venue: CinemaVenue) {
    if (venue.latitude === null || venue.longitude === null) {
      return null;
    }

    return `https://map.kakao.com/link/to/${encodeURIComponent(venue.name)},${venue.latitude},${venue.longitude}`;
  }

  const venueCards = selectedVenues.map((venue) => (
    <View
      key={venue.id}
      className="flex-row items-center rounded-2xl bg-cinemo-surface px-4 py-4"
    >
      <MapPin size={20} color={CINEMO_COLORS.accentLight} />

      <View className="ml-3 flex-1">
        <Text className="text-base font-semibold text-cinemo-text">
          {venue.name}
        </Text>

        <Text className="mt-1 text-xs text-cinemo-muted">
          {venue.roadAddress ?? "주소 정보 없음"}
        </Text>
      </View>

      <View className="ml-2 gap-2">
        {venue.latitude !== null && venue.longitude !== null ? (
          <Pressable
            onPress={() => handleVenueSelect(venue.id)}
            className="rounded-lg border border-white/15 px-3 py-2"
          >
            <Text className="text-xs font-semibold text-cinemo-gold-light">
              지도에서 보기
            </Text>
          </Pressable>
        ) : null}

        {getKakaoDirectionsUrl(venue) ? (
          <Pressable
            onPress={() => {
              const url = getKakaoDirectionsUrl(venue);
              if (url) {
                void Linking.openURL(url);
              }
            }}
            className="flex-row items-center gap-1 rounded-lg bg-cinemo-gold/15 px-3 py-2"
          >
            <MapPin size={14} color={CINEMO_COLORS.accentLight} />
            <Text className="text-xs font-semibold text-cinemo-gold-light">
              길찾기
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  ));
  const visibleVenueCards = isVenueListExpanded
    ? venueCards
    : venueCards.slice(0, 3);

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-cinemo-bg">
      <ScrollView
        ref={pageScrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 40,
        }}
      >
        <View className="px-5 pb-5 pt-6">
          <Text className="text-xs font-semibold tracking-[4px] text-cinemo-gold-light">
            CINEMO MAP
          </Text>

          <Text className="mt-2 text-2xl font-bold text-cinemo-text">
            전국 영화관 찾기
          </Text>

          <Text className="mt-2 text-sm text-cinemo-muted">
            지도에서 지역을 선택하면 영화관 목록을 확인할 수 있음
          </Text>

          <Pressable
            onPress={() => setRegionPickerMode("region1")}
            className="mt-5 flex-row items-center justify-between rounded-2xl px-4 py-3.5"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderColor: "rgba(212, 181, 106, 0.45)",
              borderWidth: 1,
            }}
          >
            <View>
              <Text className="text-xs text-cinemo-muted">지역 선택</Text>
              <Text className="mt-1 text-base font-semibold text-cinemo-text">
                {selectedRegionName}
              </Text>
            </View>

            <ChevronDown size={21} color={CINEMO_COLORS.accentLight} />
          </Pressable>

          {selectedRegionCode && region2Options.length > 0 ? (
            <Pressable
              onPress={() => setRegionPickerMode("region2")}
              className="mt-3 flex-row items-center justify-between rounded-2xl px-4 py-3.5"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderColor: "rgba(255, 255, 255, 0.12)",
                borderWidth: 1,
              }}
            >
              <View>
                <Text className="text-xs text-cinemo-muted">시·군·구 선택</Text>
                <Text className="mt-1 text-base font-semibold text-cinemo-text">
                  {selectedRegion2Name ?? "전체 지역"}
                </Text>
              </View>

              <ChevronDown size={21} color={CINEMO_COLORS.accentLight} />
            </Pressable>
          ) : null}
        </View>

        <View className="mx-5 overflow-hidden rounded-3xl bg-cinemo-bg-deep">
          {isLoading ? (
            <View className="h-[420px] items-center justify-center">
              <ActivityIndicator color={CINEMO_COLORS.accentLight} />
            </View>
          ) : isError ? (
            <View className="h-[420px] items-center justify-center px-6">
              <Text className="text-center text-sm text-cinemo-muted">
                영화관 정보를 불러오지 못했음
              </Text>
            </View>
          ) : (
            <CinemaRegionMap
              selectedRegionCode={selectedRegionCode}
              onRegionSelect={handleRegionSelect}
            />
          )}
        </View>

        <View className="mt-8 px-5">
          <Text className="text-xs font-semibold tracking-[3px] text-cinemo-gold-light">
            REGION CINEMAS
          </Text>

          <Text className="mt-2 text-xl font-bold text-cinemo-text">
            {selectedAreaName} 영화관 {selectedAreaVenues.length}곳
          </Text>
        </View>

        {selectedRegionCode && brandCounts.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}
            className="mt-4"
          >
            <Pressable
              onPress={() => handleBrandSelect(undefined)}
              className={`rounded-full border px-4 py-3 ${
                !selectedBrandName
                  ? "border-cinemo-gold bg-cinemo-gold/15"
                  : "border-white/10 bg-cinemo-surface"
              }`}
            >
              <Text className="text-sm font-semibold text-cinemo-text">
                전체 {selectedAreaVenues.length}곳
              </Text>
            </Pressable>

            {brandCounts.map(([brand, count]) => (
              <Pressable
                key={brand}
                onPress={() => handleBrandSelect(brand)}
                className={`rounded-full border px-4 py-3 ${
                  selectedBrandName === brand
                    ? "border-cinemo-gold bg-cinemo-gold/15"
                    : "border-white/10 bg-cinemo-surface"
                }`}
              >
                <Text className="text-sm font-semibold text-cinemo-text">
                  {brand} {count}곳
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <View
          className="mx-5 mt-6 overflow-hidden rounded-3xl bg-cinemo-surface"
          onLayout={(event) => setMapSectionY(event.nativeEvent.layout.y)}
        >
          <View className="px-4 pb-3 pt-4">
            <Text className="text-xs font-semibold tracking-[3px] text-cinemo-gold-light">
              KAKAO MAP
            </Text>

            <Text className="mt-2 text-lg font-bold text-cinemo-text">
              {selectedAreaName} 영화관 위치
            </Text>
          </View>

          <CinemaKakaoMap
            venues={selectedVenues}
            selectedVenueId={selectedVenueId}
            onVenueSelect={setSelectedVenueId}
          />
        </View>

        {selectedRegionCode ? (
          <View className="mt-8 px-5">
            <Text className="text-xl font-bold text-cinemo-text">
              {selectedAreaName} 영화관
            </Text>

            <View className="mt-4 gap-3">{visibleVenueCards}</View>

            {selectedVenues.length === 0 ? (
              <Text className="mt-4 text-sm text-cinemo-muted">
                등록된 영화관이 없음
              </Text>
            ) : null}

            {selectedVenues.length > 3 ? (
              <Pressable
                onPress={() => setIsVenueListExpanded((expanded) => !expanded)}
                className="mt-4 items-center rounded-xl border border-white/15 py-3"
              >
                <Text className="text-sm font-semibold text-cinemo-gold-light">
                  {isVenueListExpanded
                    ? "목록 접기"
                    : `전체 ${selectedVenues.length}곳 보기`}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <Modal
        transparent
        visible={regionPickerMode !== undefined}
        animationType="slide"
        onRequestClose={() => setRegionPickerMode(undefined)}
      >
        <View className="flex-1 justify-end">
          <Pressable
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.62)" }}
            onPress={() => setRegionPickerMode(undefined)}
          />

          <View
            className="max-h-[78%] rounded-t-3xl px-5 pb-8 pt-4"
            style={{
              backgroundColor: CINEMO_COLORS.backgroundDeep,
              borderColor: "rgba(255, 255, 255, 0.12)",
              borderTopWidth: 1,
            }}
          >
            <View className="mb-4 flex-row items-center justify-between">
              <View>
                <Text className="text-xs font-semibold tracking-[3px] text-cinemo-gold-light">
                  {regionPickerMode === "region1" ? "REGION" : "DISTRICT"}
                </Text>
                <Text className="mt-1 text-xl font-bold text-cinemo-text">
                  {regionPickerMode === "region1"
                    ? "지역 선택"
                    : "시·군·구 선택"}
                </Text>
              </View>

              <Pressable
                onPress={() => setRegionPickerMode(undefined)}
                className="rounded-full p-2"
                hitSlop={8}
              >
                <X size={22} color={CINEMO_COLORS.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingBottom: 8 }}
            >
              {regionPickerMode === "region1" ? (
                <>
                  <Pressable
                    onPress={() => {
                      setSelectedRegionCode(undefined);
                      setSelectedRegion2Code(undefined);
                      setSelectedBrandName(undefined);
                      setSelectedVenueId(undefined);
                      setIsVenueListExpanded(false);
                      setRegionPickerMode(undefined);
                    }}
                    className="flex-row items-center justify-between rounded-2xl px-4 py-4"
                    style={{
                      backgroundColor: selectedRegionCode
                        ? "rgba(255, 255, 255, 0.05)"
                        : CINEMO_COLORS.teal,
                    }}
                  >
                    <Text className="text-base font-semibold text-cinemo-text">
                      전국
                    </Text>
                    <Text className="text-base font-bold text-cinemo-gold-light">
                      {venues.length}곳
                    </Text>
                  </Pressable>

                  {REGION_ORDER.map((regionCode) => {
                    const isSelected = selectedRegionCode === regionCode;

                    return (
                      <Pressable
                        key={regionCode}
                        onPress={() => {
                          handleRegionSelect(regionCode);
                          setRegionPickerMode(undefined);
                        }}
                        className="flex-row items-center justify-between rounded-2xl px-4 py-4"
                        style={{
                          backgroundColor: isSelected
                            ? CINEMO_COLORS.teal
                            : "rgba(255, 255, 255, 0.05)",
                        }}
                      >
                        <Text className="text-base font-semibold text-cinemo-text">
                          {CINEMA_REGION_LABELS[regionCode]}
                        </Text>

                        <Text className="text-base font-bold text-cinemo-gold-light">
                          {counts[regionCode] ?? 0}곳
                        </Text>
                      </Pressable>
                    );
                  })}
                </>
              ) : (
                <>
                  <Pressable
                    onPress={() => {
                      handleRegion2Select(undefined);
                      setRegionPickerMode(undefined);
                    }}
                    className="flex-row items-center justify-between rounded-2xl px-4 py-4"
                    style={{
                      backgroundColor: selectedRegion2Code
                        ? "rgba(255, 255, 255, 0.05)"
                        : CINEMO_COLORS.teal,
                    }}
                  >
                    <Text className="text-base font-semibold text-cinemo-text">
                      전체 지역
                    </Text>
                    <Text className="text-base font-bold text-cinemo-gold-light">
                      {regionVenues.length}곳
                    </Text>
                  </Pressable>

                  {region2Options.map(([region2Code, option]) => {
                    const isSelected = selectedRegion2Code === region2Code;

                    return (
                      <Pressable
                        key={region2Code}
                        onPress={() => {
                          handleRegion2Select(region2Code);
                          setRegionPickerMode(undefined);
                        }}
                        className="flex-row items-center justify-between rounded-2xl px-4 py-4"
                        style={{
                          backgroundColor: isSelected
                            ? CINEMO_COLORS.teal
                            : "rgba(255, 255, 255, 0.05)",
                        }}
                      >
                        <Text className="text-base font-semibold text-cinemo-text">
                          {option.name}
                        </Text>

                        <Text className="text-base font-bold text-cinemo-gold-light">
                          {option.count}곳
                        </Text>
                      </Pressable>
                    );
                  })}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
