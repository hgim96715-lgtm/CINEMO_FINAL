import { zodResolver } from "@hookform/resolvers/zod";
import { CINEMO_COLORS } from "@cinemo/shared";
import { router } from "expo-router";
import { useState } from "react";
import {
  Keyboard,
  Pressable,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";

import { CinemoBackground } from "@/components/common/CinemoBackground";
import { Header } from "@/components/common/Header";
import { checkEmailMobile, loginEmailMobile } from "@/lib/api/auth";
import {
  emailLoginSchema,
  type EmailLoginFormValues,
} from "@/schemas/email-login.schema";

export default function EmailLoginScreen() {
  const [step, setStep] = useState<"email" | "password">("email");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    control,
    getValues,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<EmailLoginFormValues>({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleContinue = async () => {
    const isEmailValid = await trigger("email");

    if (!isEmailValid) {
      return;
    }

    const email = getValues("email").trim().toLowerCase();

    try {
      setErrorMessage(null);

      const result = await checkEmailMobile(email);

      if (result.available) {
        router.push({
          pathname: "/email-signup",
          params: { email },
        });
        return;
      }

      setStep("password");
    } catch {
      setErrorMessage("이메일 확인 중 오류가 발생했습니다.");
    }
  };

  const handleLogin = async (values: EmailLoginFormValues) => {
    try {
      setErrorMessage(null);

      await loginEmailMobile({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });

      router.replace("/lobby");
    } catch {
      setErrorMessage("이메일 또는 비밀번호가 올바르지 않습니다.");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView
        className="flex-1 bg-cinemo-bg"
        style={{ backgroundColor: CINEMO_COLORS.background }}
      >
        <CinemoBackground />
        <Header onSearchPress={() => router.push("/search")} />

        <View
          className="flex-1 items-center justify-center px-4 py-16"
          style={{
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="로그인 화면으로 돌아가기"
              onPress={() => router.back()}
              className="self-start"
            >
              <Text className="text-sm text-cinemo-muted">← 로그인 선택</Text>
            </Pressable>

            <Text className="mt-6 text-sm font-semibold tracking-[4px] text-cinemo-gold">
              CINEMO
            </Text>
            <Text className="mt-4 text-3xl font-bold text-cinemo-text">
              이메일로 로그인
            </Text>
            <Text className="mt-3 text-sm leading-6 text-cinemo-muted">
              이메일을 확인한 뒤 로그인하거나 회원가입을 진행하세요.
            </Text>

            <View className="mt-8 gap-4">
              <Controller
                control={control}
                name="email"
                render={({ field: { value, onChange, onBlur } }) => (
                  <View>
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={step === "email"}
                      placeholder="이메일"
                      placeholderTextColor={CINEMO_COLORS.borderMuted}
                      className="rounded-xl px-4 py-4 text-base text-cinemo-text"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.08)",
                        borderWidth: 1,
                        borderColor: errors.email
                          ? CINEMO_COLORS.danger
                          : "rgba(255,255,255,0.14)",
                        opacity: step === "password" ? 0.7 : 1,
                      }}
                    />

                    {errors.email?.message && (
                      <Text className="mt-1 text-sm text-cinemo-danger">
                        {errors.email.message}
                      </Text>
                    )}
                  </View>
                )}
              />

              {step === "password" && (
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <View>
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        secureTextEntry
                        placeholder="비밀번호"
                        placeholderTextColor={CINEMO_COLORS.borderMuted}
                        className="rounded-xl px-4 py-4 text-base text-cinemo-text"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.08)",
                          borderWidth: 1,
                          borderColor: errors.password
                            ? CINEMO_COLORS.danger
                            : "rgba(255,255,255,0.14)",
                        }}
                      />

                      {errors.password?.message && (
                        <Text className="mt-1 text-sm text-cinemo-danger">
                          {errors.password.message}
                        </Text>
                      )}
                    </View>
                  )}
                />
              )}

              {errorMessage && (
                <Text className="text-sm text-cinemo-danger">
                  {errorMessage}
                </Text>
              )}

              <Pressable
                onPress={
                  step === "email"
                    ? handleContinue
                    : handleSubmit(handleLogin)
                }
                disabled={isSubmitting}
                className="items-center rounded-xl py-4"
                style={{
                  backgroundColor: CINEMO_COLORS.accent,
                  opacity: isSubmitting ? 0.6 : 1,
                }}
              >
                <Text className="text-base font-semibold text-white">
                  {isSubmitting
                    ? "확인 중..."
                    : step === "email"
                      ? "계속하기"
                      : "이메일로 로그인"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
