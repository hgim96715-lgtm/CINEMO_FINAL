import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useState } from "react";
import { Pressable, Text } from "react-native";
import Svg, { Path } from "react-native-svg";

type GoogleLoginButtonProps = {
  disabled?: boolean;
  onSuccess: (identityToken: string) => void | Promise<void>;
  onError?: (error: unknown) => void;
};

export function GoogleLoginButton({
  disabled = false,
  onSuccess,
  onError,
}: GoogleLoginButtonProps) {
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handlePress = async () => {
    if (disabled || isSigningIn) {
      return;
    }

    setIsSigningIn(true);

    try {
      const result = await GoogleSignin.signIn();

      if (result.type !== "success") return;

      const identityToken = result.data.idToken;

      if (!identityToken) {
        throw new Error("Google 인증 토큰을 받을 수 없습니다.");
      }

      await onSuccess(identityToken);
    } catch (error) {
      const code =
        error instanceof Error && "code" in error
          ? String(error.code)
          : undefined;

      if (code === "SIGN_IN_CANCELLED" || code === "12501") {
        return;
      }

      onError?.(error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const isDisabled = disabled || isSigningIn;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Google로 로그인"
      onPress={handlePress}
      disabled={isDisabled}
      style={{
        width: "100%",
        height: 48,
        flexDirection: "row",
        gap: 6,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        backgroundColor: "#F2F2F2",
        opacity: isDisabled ? 0.6 : 1,
      }}
    >
      <Svg width={22} height={22} viewBox="0 0 48 48">
        <Path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        />
        <Path
          fill="#4285F4"
          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        />
        <Path
          fill="#FBBC05"
          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        />
        <Path
          fill="#34A853"
          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        />
      </Svg>

      <Text
        style={{
          color: "#1F1F1F",
          fontSize: 14,
          fontWeight: "600",
        }}
      >
        {isSigningIn ? "로그인 중..." : "Google로 로그인"}
      </Text>
    </Pressable>
  );
}
