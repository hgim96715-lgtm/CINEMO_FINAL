import { StyleSheet, View } from "react-native";

export function CinemoBackground() {
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: "#0d1b1e" }]}
    />
  );
}
