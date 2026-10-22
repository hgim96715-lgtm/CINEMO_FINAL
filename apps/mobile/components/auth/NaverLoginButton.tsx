import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Image, Pressable, Text } from "react-native";

import {
  getNaverMobileAuthorizationUrl,
  loginNaverMobile,
  type MobileNaverLoginResponse,
} from "@/lib/api/auth";

WebBrowser.maybeCompleteAuthSession();

type NaverLoginButtonProps = {
  disabled?: boolean;
  onSuccess: (result: MobileNaverLoginResponse) => void | Promise<void>;
  onError?: (error: unknown) => void;
};

function getQueryString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

async function createOAuthState() {
  const bytes = await Crypto.getRandomBytesAsync(32);

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

export function NaverLoginButton({
  disabled = false,
  onSuccess,
  onError,
}: NaverLoginButtonProps) {
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handlePress = async () => {
    if (disabled || isSigningIn) {
      return;
    }

    try {
      setIsSigningIn(true);

      const state = await createOAuthState();
      const { authorizationUrl } = await getNaverMobileAuthorizationUrl(state);

      const result = await WebBrowser.openAuthSessionAsync(
        authorizationUrl,
        "cinemo://oauth/naver",
      );

      if (result.type !== "success") {
        return;
      }

      const { queryParams } = Linking.parse(result.url);
      const code = getQueryString(queryParams?.code);
      const returnedState = getQueryString(queryParams?.state);
      const error = getQueryString(queryParams?.error);

      if (error) {
        throw new Error("네이버 로그인을 취소했습니다.");
      }

      if (!code || !returnedState) {
        throw new Error("네이버 인증 정보를 받을 수 없습니다.");
      }

      if (returnedState !== state) {
        throw new Error("네이버 인증 상태가 유효하지 않습니다.");
      }

      const loginResult = await loginNaverMobile({
        code,
        state: returnedState,
      });

      await onSuccess(loginResult);
    } catch (error) {
      onError?.(error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const isDisabled = disabled || isSigningIn;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="네이버로 로그인"
      onPress={() => {
        void handlePress();
      }}
      disabled={isDisabled}
      style={{
        width: "100%",
        height: 48,
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        backgroundColor: "#03A94D",
        opacity: isDisabled ? 0.6 : 1,
      }}
    >
      <Image
        source={require("../../assets/auth/naver-login-icon.png")}
        accessibilityLabel="네이버 로고"
        resizeMode="contain"
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
        }}
      />

      <Text
        style={{
          color: "#FFFFFF",
          fontSize: 14,
          fontWeight: "600",
        }}
      >
        {isSigningIn ? "로그인 중..." : "네이버로 로그인"}
      </Text>
    </Pressable>
  );
}
