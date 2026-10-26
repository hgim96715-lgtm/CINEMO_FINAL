import { CINEMO_COLORS } from "@cinemo/shared";
import axios from "axios";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppleAuthenticationCredential } from "expo-apple-authentication";
import { AppleLoginButton } from "@/components/auth/AppleLoginButton";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import {
  loginAppleMobile,
  loginGoogleMobile,
  type MobileAppleLoginResponse,
} from "@/lib/api/auth";
import { NaverLoginButton } from "@/components/auth/NaverLoginButton";
import { CinemoBackground } from "@/components/common/CinemoBackground";

function getErrorMessage(error: unknown, fallback: string) {
  if (__DEV__) {
    if (axios.isAxiosError(error)) {
      console.error("[로그인 오류]", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
      });
    } else {
      console.error("[로그인 오류]", error);
    }
  }
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (!error.response) {
      return "네트워크 연결을 확인해주세요.";
    }
    if (status === 401) {
      return "로그인 인증에 실패했습니다. 다시 시도해주세요.";
    }

    if (status === 404) {
      return "로그인 기능을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.";
    }

    if (status === 409) {
      return "이미 가입된 계정입니다.";
    }
    if (typeof status === "number" && status >= 500) {
      return "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
    }
  }

  return fallback;
}

function moveAfterSocialLogin(result: MobileAppleLoginResponse) {
  if ("requiresRegistration" in result && result.requiresRegistration) {
    router.replace({
      pathname: "/oauth-signup",
      params: {
        ticket: result.signupToken,
      },
    });
    return;
  }
  router.replace("/lobby");
}

export default function LoginScreen() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { from } = useLocalSearchParams<{ from?: string }>();
  const isFromMyCinema = from === "my-cinema";

  const handleAppleLogin = async (
    credential: AppleAuthenticationCredential,
  ) => {
    if (!credential.identityToken) {
      setErrorMessage("Apple 인증 정보를 받을 수 없습니다.");
      return;
    }
    try {
      setErrorMessage(null);
      const result = await loginAppleMobile({
        identityToken: credential.identityToken,
        authorizationCode: credential.authorizationCode ?? undefined,
      });
      moveAfterSocialLogin(result);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Apple 로그인에 실패했습니다."));
    }
  };
  const handleGoogleLogin = async (identityToken: string) => {
    try {
      setErrorMessage(null);
      const result = await loginGoogleMobile({ identityToken });
      moveAfterSocialLogin(result);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Google 로그인에 실패했습니다."));
    }
  };
  return (
    <SafeAreaView
      edges={isFromMyCinema ? [] : undefined}
      className="flex-1 bg-cinemo-bg"
      style={{
        flex: 1,
        backgroundColor: CINEMO_COLORS.background,
      }}
    >
      <CinemoBackground />
      <View
        className="flex-1 items-center justify-center px-4"
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 448,
          alignSelf: "center",
        }}
      >
        <View
          className="w-full rounded-3xl p-6"
          style={{
            backgroundColor: "rgba(255,255,255,0.06)",
            borderColor: "rgba(255,255,255,0.12)",
            borderWidth: 1,
          }}
        >
          <Text className="text-sm font-semibold tracking-[4px] text-cinemo-gold">
            CINEMO
          </Text>

          <Text className="mt-4 text-3xl font-bold text-cinemo-text">
            오신 걸 환영해요
          </Text>

          <Text className="mt-3 text-sm leading-6 text-cinemo-muted">
            로그인하고 나만의 영화 기록을 이어가세요.
          </Text>

          <View className="mt-8 gap-5">
            {errorMessage && (
              <Text className="text-sm text-cinemo-danger">{errorMessage}</Text>
            )}

            <AppleLoginButton
              onSuccess={handleAppleLogin}
              onError={(error) => {
                const code =
                  error instanceof Error && "code" in error
                    ? String(error.code)
                    : undefined;

                if (code === "ERR_REQUEST_CANCELED") {
                  setErrorMessage("Apple 로그인을 취소했습니다.");
                  return;
                }

                setErrorMessage(
                  getErrorMessage(error, "Apple 로그인에 실패했습니다."),
                );
              }}
            />

            <GoogleLoginButton
              onSuccess={handleGoogleLogin}
              onError={(error) => {
                const code =
                  error instanceof Error && "code" in error
                    ? String(error.code)
                    : undefined;

                if (code === "SIGN_IN_CANCELLED" || code === "12501") {
                  return;
                }

                setErrorMessage(
                  getErrorMessage(error, "Google 로그인에 실패했습니다."),
                );
              }}
            />

            <NaverLoginButton
              onSuccess={moveAfterSocialLogin}
              onError={(error) => {
                setErrorMessage(
                  getErrorMessage(error, "네이버 로그인에 실패했습니다."),
                );
              }}
            />

            {/*<Pressable*/}
            {/*  onPress={() => {*/}
            {/*    setErrorMessage(null);*/}
            {/*    router.push("/email-login");*/}
            {/*  }}*/}
            {/*  className="mt-6 items-center rounded-xl py-4"*/}
            {/*  style={{*/}
            {/*    backgroundColor: CINEMO_COLORS.accent,*/}
            {/*  }}*/}
            {/*>*/}
            {/*  <Text className="text-base font-semibold text-white">*/}
            {/*    이메일로 로그인*/}
            {/*  </Text>*/}
            {/*</Pressable>*/}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
