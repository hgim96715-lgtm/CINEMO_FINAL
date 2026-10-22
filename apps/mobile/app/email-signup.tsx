import { zodResolver } from "@hookform/resolvers/zod";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CINEMO_COLORS } from "@cinemo/shared";
import { registerEmailMobile } from "@/lib/api/auth";
import {
  emailSignupSchema,
  type EmailSignupFormValues,
} from "@/schemas/email-signup.schema";

export default function EmailSignupScreen() {
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const email = Array.isArray(params.email) ? params.email[0] : params.email;
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailSignupFormValues>({
    resolver: zodResolver(emailSignupSchema),
    defaultValues: {
      email: email ?? "",
      nickname: "",
      password: "",
      passwordConfirm: "",
      service: true,
      privacy: true,
      marketing: false,
    },
  });

  const onSubmit = async (values: EmailSignupFormValues) => {
    try {
      setSubmitError(null);

      await registerEmailMobile({
        email: values.email,
        password: values.password,
        nickname: values.nickname,
        terms: {
          service: true,
          privacy: true,
          marketing: values.marketing,
        },
      });

      Alert.alert(
        "인증 메일을 보냈어요",
        "이메일의 인증 링크를 확인한 뒤 로그인해주세요.",
        [{ text: "확인", onPress: () => router.replace("/login") }],
      );
    } catch {
      setSubmitError("회원가입 처리 중 오류가 발생했습니다.");
    }
  };

  const renderInput = (
    name:
      | "email"
      | "nickname"
      | "password"
      | "passwordConfirm",
    placeholder: string,
    secureTextEntry = false,
  ) => (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur } }) => (
        <View>
          <TextInput
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            editable={name !== "email"}
            secureTextEntry={secureTextEntry}
            keyboardType={name === "email" ? "email-address" : "default"}
            autoCapitalize={name === "email" ? "none" : "sentences"}
            placeholder={placeholder}
            placeholderTextColor={CINEMO_COLORS.borderMuted}
            className="rounded-xl px-4 py-4 text-base text-cinemo-text"
            style={{
              backgroundColor: "rgba(255,255,255,0.08)",
              borderWidth: 1,
              borderColor: errors[name]
                ? CINEMO_COLORS.danger
                : "rgba(255,255,255,0.14)",
            }}
          />

          {errors[name]?.message && (
            <Text className="mt-1 text-sm text-cinemo-danger">
              {errors[name]?.message}
            </Text>
          )}
        </View>
      )}
    />
  );

  return (
    <SafeAreaView className="flex-1 bg-cinemo-bg">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-5 py-8"
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-sm font-semibold tracking-[4px] text-cinemo-gold">
            CINEMO
          </Text>

          <Text className="mt-5 text-3xl font-bold text-cinemo-text">
            회원가입
          </Text>

          <Text className="mt-3 text-base leading-6 text-cinemo-muted">
            이메일로 CINEMO를 시작해보세요.
          </Text>

          <View className="mt-8 gap-4">
            {renderInput("email", "이메일")}
            {renderInput("nickname", "닉네임")}
            {renderInput("password", "비밀번호", true)}
            {renderInput("passwordConfirm", "비밀번호 확인", true)}

            <Controller
              control={control}
              name="marketing"
              render={({ field: { value, onChange } }) => (
                <Pressable
                  className="flex-row items-center gap-3"
                  onPress={() => onChange(!value)}
                >
                  <Text className="text-lg text-cinemo-gold">
                    {value ? "☑" : "□"}
                  </Text>
                  <Text className="text-sm text-cinemo-muted">
                    마케팅 정보 수신 동의 (선택)
                  </Text>
                </Pressable>
              )}
            />
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
            <Text className="text-base font-semibold text-white">
              {isSubmitting ? "가입 중..." : "회원가입"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
