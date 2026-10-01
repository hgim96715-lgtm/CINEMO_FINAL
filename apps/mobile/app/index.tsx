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
    <View>
      <Text className="text-5xl font-bold tracking-[6px] text-[#f3efe6]">
        CINEMO
      </Text>
      <Text className="mt-5 text-center text-base text-[#958d82]">
        영화의 순간을 모으다
      </Text>
    </View>
  );
}
