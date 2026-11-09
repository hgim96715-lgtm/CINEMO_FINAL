import { isAxiosError } from "axios";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  checkNicknameMobile,
  completeMobileOauthSignup,
} from "@/lib/api/auth";
import { LegalDocumentModal } from "@/components/auth/LegalDocumentModal";
import { CINEMO_COLORS, type CinemoLegalDocument } from "@cinemo/shared";
import { Controller, useForm } from "react-hook-form";
import {
  OauthSignupFormValues,
  oauthSignupSchema,
} from "@/schemas/oauth-signup.schema";
import { zodResolver } from "@hookform/resolvers/zod";

type NicknameStatus =
  | "idle"
  | "checking"
  | "available"
  | "unavailable"
  | "error";

export default function OauthSignupScreen() {
  const params = useLocalSearchParams<{
    ticket?: string | string[];
  }>();

  const ticket = Array.isArray(params.ticket)
    ? params.ticket[0]
    : params.ticket;

  const [needsNewLogin, setNeedsNewLogin] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeTerms, setActiveTerms] = useState<CinemoLegalDocument | null>(null);
  const [nicknameStatus, setNicknameStatus] =
    useState<NicknameStatus>("idle");

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OauthSignupFormValues>({
    resolver: zodResolver(oauthSignupSchema),
    defaultValues: {
      nickname: "",
      service: false,
      privacy: false,
      marketing: false,
    },
  });

  const nickname = watch("nickname");

  useEffect(() => {
    const normalizedNickname = nickname.trim();

    if (normalizedNickname.length < 2 || normalizedNickname.length > 30) {
      setNicknameStatus("idle");
      return;
    }

    let active = true;
    setNicknameStatus("checking");

    const timer = setTimeout(async () => {
      try {
        const result = await checkNicknameMobile(normalizedNickname);

        if (active) {
          setNicknameStatus(result.available ? "available" : "unavailable");
        }
      } catch {
        if (active) {
          setNicknameStatus("error");
        }
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [nickname]);

  const onSubmit = async (values: OauthSignupFormValues) => {
    if (!ticket) {
      setNeedsNewLogin(true);
      setSubmitError("소셜 로그인 정보가 없어요. 다시 로그인해 주세요.");
      return;
    }
    try {
      setSubmitError(null);
      const nicknameCheck = await checkNicknameMobile(values.nickname);

      if (!nicknameCheck.available) {
        setNicknameStatus("unavailable");
        setSubmitError("이미 사용 중인 닉네임입니다.");
        return;
      }

      await completeMobileOauthSignup({
        ticket,
        nickname: values.nickname.trim(),
        terms: {
          service: true,
          privacy: true,
          marketing: false,
        },
      });
      router.replace("/lobby");
    } catch (error) {
      const response = isAxiosError(error) ? error.response : undefined;
      const message = response?.data?.message;
      if (response?.status === 400 && typeof message === "string" && message.includes("가입 티켓")) {
        setNeedsNewLogin(true);
        setSubmitError("가입 인증이 만료되었거나 이미 사용됐어요. 다시 로그인해 주세요.");
      } else if (response?.status === 409) {
        setSubmitError(typeof message === "string" ? message : "이미 사용 중인 계정 또는 닉네임이에요.");
      } else if (response?.status === 400 && typeof message === "string") {
        setSubmitError(message);
      } else {
        setSubmitError("가입을 완료하지 못했어요. 연결을 확인하고 다시 시도해 주세요.");
      }
    }
  };
  return (
    <SafeAreaView className="flex-1 bg-cinemo-bg">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerClassName="flex-grow px-5 py-8"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-sm font-semibold tracking-[4px] text-cinemo-gold">
            CINEMO
          </Text>

          <Text className="mt-5 text-3xl font-bold text-cinemo-text">
            CINEMO를 시작해요
          </Text>

          <Text className="mt-3 text-base leading-6 text-cinemo-muted">
            서비스 이용을 위해 아래 내용을 확인해주세요.
          </Text>

          <Controller
            control={control}
            name="nickname"
            render={({ field: { value, onChange, onBlur } }) => (
              <View className="mt-8" style={{ minHeight: 88 }}>
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="닉네임을 입력해주세요"
                  placeholderTextColor={CINEMO_COLORS.borderMuted}
                  maxLength={30}
                  className="rounded-xl text-base text-cinemo-text"
                  style={{
                    height: 56,
                    paddingHorizontal: 16,
                    paddingVertical: 0,
                    lineHeight: 22,
                    backgroundColor: "rgba(255,255,255,0.08)",
                    borderWidth: 1,
                    borderColor: errors.nickname
                      ? CINEMO_COLORS.danger
                      : "rgba(255,255,255,0.14)",
                  }}
                />

                <View style={{ height: 24, marginTop: 8 }}>
                  {errors.nickname?.message && (
                    <Text className="text-sm text-cinemo-danger">
                      {errors.nickname.message}
                    </Text>
                  )}

                  {!errors.nickname && nicknameStatus === "checking" && (
                    <Text className="text-sm text-cinemo-muted">
                      닉네임 중복 확인 중...
                    </Text>
                  )}

                  {!errors.nickname && nicknameStatus === "available" && (
                    <Text className="text-sm text-green-400">
                      사용할 수 있는 닉네임입니다.
                    </Text>
                  )}

                  {!errors.nickname && nicknameStatus === "unavailable" && (
                    <Text className="text-sm text-cinemo-danger">
                      이미 사용 중인 닉네임입니다.
                    </Text>
                  )}
                </View>
              </View>
            )}
          />

          <View className="mt-8 gap-4">
            <Text className="text-base font-semibold text-cinemo-text">
              약관 동의
            </Text>

            <Controller
              control={control}
              name="service"
              render={({ field: { value, onChange } }) => (
                <View className="flex-row items-center gap-3">
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: value }}
                    onPress={() => onChange(!value)}
                  >
                    <Text className="text-lg text-cinemo-gold">
                      {value ? "☑" : "□"}
                    </Text>
                  </Pressable>

                  <Text className="flex-1 text-sm text-cinemo-muted">
                    서비스 이용약관 동의 (필수)
                  </Text>

                  <Pressable
                    onPress={() => setActiveTerms("service")}
                    hitSlop={8}
                  >
                    <Text className="text-xs text-cinemo-gold underline">
                      자세히 보기
                    </Text>
                  </Pressable>
                </View>
              )}
            />

            <Controller
              control={control}
              name="privacy"
              render={({ field: { value, onChange } }) => (
                <View className="flex-row items-center gap-3">
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: value }}
                    onPress={() => onChange(!value)}
                  >
                    <Text className="text-lg text-cinemo-gold">
                      {value ? "☑" : "□"}
                    </Text>
                  </Pressable>

                  <Text className="flex-1 text-sm text-cinemo-muted">
                    개인정보 수집·이용 동의 (필수)
                  </Text>

                  <Pressable
                    onPress={() => setActiveTerms("privacy")}
                    hitSlop={8}
                  >
                    <Text className="text-xs text-cinemo-gold underline">
                      자세히 보기
                    </Text>
                  </Pressable>
                </View>
              )}
            />

            {(errors.service?.message || errors.privacy?.message) && (
              <Text className="text-sm text-cinemo-danger">
                {errors.service?.message ?? errors.privacy?.message}
              </Text>
            )}
          </View>

          {submitError && (
            <Text className="mt-5 text-sm text-cinemo-danger">
              {submitError}
            </Text>
          )}

          <Pressable
            onPress={needsNewLogin ? () => router.replace("/login") : handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="mt-8 items-center rounded-xl py-4"
            style={{
              backgroundColor: CINEMO_COLORS.accent,
              opacity: isSubmitting ? 0.6 : 1,
            }}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-base font-semibold text-white">
                {needsNewLogin ? "다시 로그인" : "동의하고 시작하기"}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <LegalDocumentModal document={activeTerms} onClose={() => setActiveTerms(null)} />
    </SafeAreaView>
  );
}
