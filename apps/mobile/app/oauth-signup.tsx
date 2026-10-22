import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
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
import { CINEMO_COLORS } from "@cinemo/shared";
import { Controller, useForm } from "react-hook-form";
import {
  OauthSignupFormValues,
  oauthSignupSchema,
} from "@/schemas/oauth-signup.schema";
import { zodResolver } from "@hookform/resolvers/zod";

type TermsType = "service" | "privacy" | "marketing";

const termsDetails: Record<TermsType, { title: string; content: string }> = {
  service: {
    title: "서비스 이용약관",
    content:
      "CINEMO의 영화 정보와 개인 영화 기록 서비스를 이용하기 위한 기본 약관입니다.",
  },
  privacy: {
    title: "개인정보 처리방침",
    content:
      "회원가입과 서비스 이용에 필요한 개인정보의 수집·이용·보관 기준을 안내합니다.",
  },
  marketing: {
    title: "마케팅 정보 수신 동의",
    content:
      "CINEMO의 새로운 기능과 영화 관련 소식을 이메일로 받아보는 선택 동의 항목입니다.",
  },
};

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

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeTerms, setActiveTerms] = useState<TermsType | null>(null);
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
      service: true,
      privacy: true,
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
      setSubmitError("소셜 로그인 정보가 없습니다.");
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
          marketing: values.marketing,
        },
      });
      router.replace("/lobby");
    } catch {
      setSubmitError("가입 처리 중 오류가 발생했습니다.");
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
                    개인정보 처리방침 동의 (필수)
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

            <Controller
              control={control}
              name="marketing"
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
                    마케팅 정보 수신 동의 (선택)
                  </Text>

                  <Pressable
                    onPress={() => setActiveTerms("marketing")}
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
            onPress={handleSubmit(onSubmit)}
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
                동의하고 시작하기
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={activeTerms !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveTerms(null)}
      >
        <Pressable
          className="flex-1 justify-center bg-black/70 px-5"
          onPress={() => setActiveTerms(null)}
        >
          <Pressable
            className="rounded-3xl p-6"
            style={{
              backgroundColor: CINEMO_COLORS.background,
              borderColor: "rgba(255,255,255,0.14)",
              borderWidth: 1,
            }}
            onPress={(event) => event.stopPropagation()}
          >
            <View className="flex-row items-center justify-between gap-4">
              <Text className="flex-1 text-xl font-bold text-cinemo-text">
                {activeTerms ? termsDetails[activeTerms].title : ""}
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="약관 닫기"
                onPress={() => setActiveTerms(null)}
                hitSlop={8}
              >
                <Text className="text-2xl text-cinemo-muted">×</Text>
              </Pressable>
            </View>

            <Text className="mt-5 text-sm leading-6 text-cinemo-muted">
              {activeTerms ? termsDetails[activeTerms].content : ""}
            </Text>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
