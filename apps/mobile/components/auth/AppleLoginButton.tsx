import type { AppleAuthenticationCredential } from "expo-apple-authentication";
import { Ionicons } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import { Platform, Pressable, Text } from "react-native";

type AppleLoginButtonProps = {
  onSuccess: (
    credential: AppleAuthenticationCredential,
  ) => void | Promise<void>;
  onError?: (error: unknown) => void;
};

export function AppleLoginButton({
  onSuccess,
  onError,
}: AppleLoginButtonProps) {
  const handlePress = async () => {
    try {
      if (Platform.OS !== "ios") {
        throw new Error("Apple 로그인은 iOS에서만 사용할 수 있습니다.");
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      await onSuccess(credential);
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ERR_REQUEST_CANCELED"
      ) {
        return;
      }
      onError?.(error);
    }
  };

  if (Platform.OS !== "ios") {
    return null;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Apple로 로그인"
      onPress={handlePress}
      style={{
        width: "100%",
        height: 48,
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        backgroundColor: "#000000",
      }}
    >
      <Ionicons name="logo-apple" size={18} color="#ffffff" />
      <Text
        style={{
          color: "#ffffff",
          fontSize: 14,
          fontWeight: "600",
        }}
      >
        Apple로 로그인
      </Text>
    </Pressable>
  );
}
