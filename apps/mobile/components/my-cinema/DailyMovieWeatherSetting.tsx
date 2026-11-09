import { toDailyMovieWeatherGrid } from "@cinemo/shared/daily-movie-push";
import { useQueryClient } from "@tanstack/react-query";
import { requireOptionalNativeModule } from "expo";
import { useEffect, useRef } from "react";
import { Alert, AppState, Linking, Platform } from "react-native";

import { apiClient } from "@/lib/api/apiClient";

export function useCinemoPermissions(userId?: string) {
  const queryClient = useQueryClient();
  const previousPermission = useRef<boolean | null>(null);

  async function saveRegion(location: typeof import("expo-location"), granted: boolean) {
    if (!granted) {
      await apiClient.delete("/daily-movie/weather-region");
    } else {
      const { coords } = await location.getCurrentPositionAsync({ accuracy: location.Accuracy.Low });
      const grid = toDailyMovieWeatherGrid(coords.latitude, coords.longitude);
      if (grid.nx < 1 || grid.nx > 149 || grid.ny < 1 || grid.ny > 253) {
        throw new Error("현재 위치의 날씨는 지원하지 않아요.");
      }
      await apiClient.patch("/daily-movie/weather-region", grid);
    }
    await queryClient.invalidateQueries({ queryKey: ["daily-movie", userId] });
  }

  useEffect(() => {
    if (!userId) return;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active" || previousPermission.current === null) return;
      const previous = previousPermission.current;
      previousPermission.current = null;
      void (async () => {
        const location = await import("expo-location");
        const { granted } = await location.getForegroundPermissionsAsync();
        if (previous !== granted) await saveRegion(location, granted);
      })().catch(() => Alert.alert("추천 지역", "위치 권한 변경을 추천에 반영하지 못했어요."));
    });
    return () => {
      subscription.remove();
      previousPermission.current = null;
    };
  }, [userId, queryClient]);

  return async () => {
    try {
      if (userId && Platform.OS !== "web" && requireOptionalNativeModule("ExpoLocation")) {
        const location = await import("expo-location");
        const permission = await location.getForegroundPermissionsAsync();
        if (permission.status === "undetermined" && permission.canAskAgain) {
          const requested = await location.requestForegroundPermissionsAsync();
          if (requested.granted) await saveRegion(location, true);
          return;
        }
        previousPermission.current = permission.granted;
      }
      await Linking.openSettings();
    } catch {
      previousPermission.current = null;
      Alert.alert("CINEMO 권한", "권한 설정을 열거나 추천 지역을 저장하지 못했어요.");
    }
  };
}
