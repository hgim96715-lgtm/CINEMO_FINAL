import { CINEMO_COLORS } from "@cinemo/shared";
import axios from "axios";
import { router } from "expo-router";
import { useState } from "react";
import {
  Keyboard,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { loginAppleMobile } from "@/lib/api/auth";
import { CinemoBackground } from "@/components/common/CinemoBackground";
import { Header } from "@/components/common/Header";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppleAuthenticationCredential } from "expo-apple-authentication";
import { AppleLoginButton } from "@/components/auth/AppleLoginButton";

export default function LoginScreen() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAppleLogin = async (
    credential: AppleAuthenticationCredential,
  ) => {
    if (!credential.identityToken) {
      setErrorMessage("Apple 인증 정보를 받을 수 없습니다.");
      return;
    }

    const result = await loginAppleMobile({
      identityToken: credential.identityToken,
      authorizationCode: credential.authorizationCode ?? undefined,
    });

    if ("requiresRegistration" in result) {
      setErrorMessage("Apple 최초 로그인은 약관 동의 후 이용할 수 있습니다.");
      return;
    }

    router.replace("/lobby");
  };
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView
        className="flex-1 bg-cinemo-bg"
        style={{ flex: 1, backgroundColor: CINEMO_COLORS.background }}
      >
        <CinemoBackground />
        <Header onSearchPress={() => router.push("/search")} />
        <View
          className="flex-1 items-center justify-center px-4 py-16"
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
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              borderColor: "rgba(255, 255, 255, 0.12)",
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
                <Text className="text-sm text-cinemo-danger">
                  {errorMessage}
                </Text>
              )}
              <AppleLoginButton
                onSuccess={handleAppleLogin}
                onError={(error) => {
                  const responseMessage = axios.isAxiosError(error)
                    ? error.response?.data?.message
                    : undefined;
                  const code =
                    error instanceof Error && "code" in error
                      ? String(error.code)
                      : undefined;

                  setErrorMessage(
                    code === "ERR_REQUEST_CANCELED"
                      ? "Apple 로그인을 취소했습니다."
                      : typeof responseMessage === "string"
                        ? responseMessage
                      : code
                        ? `Apple 로그인에 실패했습니다. (${code})`
                        : error instanceof Error
                          ? error.message
                          : "이 환경에서는 Apple 로그인을 사용할 수 없습니다.",
                  );
                }}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
