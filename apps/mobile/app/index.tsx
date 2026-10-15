import { CINEMO_BRAND } from "@cinemo/shared";
import { CinemoBackground } from "@/components/common/CinemoBackground";
import { useEffect } from "react";
import { router } from "expo-router";
import { Text, View } from "react-native";

export default function IntroScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/lobby");
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View
      className="flex-1 items-center justify-center bg-cinemo-bg"
    >
      <CinemoBackground />
      <Text className="text-5xl font-bold tracking-[6px] text-cinemo-gold">
        {CINEMO_BRAND.name}
      </Text>

      <Text className="mt-5 text-center text-base text-cinemo-muted">
        {CINEMO_BRAND.slogan}
      </Text>
    </View>
  );
}
