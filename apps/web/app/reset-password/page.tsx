"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPassword } from "@/lib/api/auth";
import {
  passwordResetSchema,
  type PasswordResetFormValues,
} from "@/schemas/password-reset.schema";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [apiError, setApiError] = useState("");
  const [completed, setCompleted] = useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewPasswordConfirm, setShowNewPasswordConfirm] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") ?? "");
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordResetFormValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      newPassword: "",
      newPasswordConfirm: "",
    },
  });

  const onSubmit = async (values: PasswordResetFormValues) => {
    if (!token) {
      setApiError("유효하지 않은 재설정 링크입니다.");
      return;
    }

    setApiError("");

    try {
      await resetPassword({
        token,
        newPassword: values.newPassword,
      });

      setCompleted(true);
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : "비밀번호 재설정에 실패했습니다.",
      );
    }
  };

  if (completed) {
    return (
      <main className="flex min-h-[calc(100vh-11rem)] items-center justify-center px-4 py-16">
        <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/6 p-6 text-center shadow-2xl backdrop-blur-xl sm:p-8">
          <h1 className="text-3xl font-bold text-cinemo-text">
            비밀번호가 변경되었습니다
          </h1>

          <p className="mt-4 text-sm leading-7 text-cinemo-muted">
            새로운 비밀번호로 로그인해주세요.
          </p>

          <Link
            href="/login"
            className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-lg bg-cinemo-gold px-4 font-semibold text-cinemo-bg transition hover:bg-cinemo-gold-light"
          >
            로그인하러 가기
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-11rem)] items-center justify-center px-4 py-16">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/6 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <h1 className="text-3xl font-bold text-cinemo-text">비밀번호 재설정</h1>

        <p className="mt-3 text-sm leading-6 text-cinemo-muted">
          새로운 비밀번호를 입력해주세요.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-cinemo-text">
              비밀번호
            </span>
            <div className="relative">
              <Input
                {...register("newPassword")}
                type={showNewPassword ? "text" : "password"}
                placeholder="8자 이상 입력하세요"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.newPassword)}
                className="h-12 border-white/15 bg-white/5 pr-10 text-cinemo-text placeholder:text-white/35"
              />

              <button
                type="button"
                aria-label={
                  showNewPassword ? "비밀번호 숨기기" : "비밀번호 보기"
                }
                onClick={() => setShowNewPassword((visible) => !visible)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cinemo-muted"
              >
                {showNewPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-2 text-sm text-red-200/75">
                {errors.newPassword.message}
              </p>
            )}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-cinemo-text">
              새 비밀번호 확인
            </span>

            <div className="relative">
              <Input
                {...register("newPasswordConfirm")}
                type={showNewPasswordConfirm ? "text" : "password"}
                placeholder="비밀번호를 한 번 더 입력하세요"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.newPasswordConfirm)}
                className="h-12 border-white/15 bg-white/5 text-cinemo-text placeholder:text-white/35"
              />
              <button
                type="button"
                aria-label={
                  showNewPasswordConfirm ? "비밀번호 숨기기" : "비밀번호 보기"
                }
                onClick={() => setShowNewPasswordConfirm((visible) => !visible)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cinemo-muted"
              >
                {showNewPasswordConfirm ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.newPasswordConfirm && (
              <p className="mt-2 text-sm text-red-200/75">
                {errors.newPasswordConfirm.message}
              </p>
            )}
          </label>

          {apiError && (
            <p
              role="alert"
              className="rounded-lg border border-red-300/15 bg-red-300/6 px-3 py-2 text-sm text-red-200/80"
            >
              {apiError}
            </p>
          )}

          <Button
            type="submit"
            variant="cinemo-primary"
            size="lg"
            disabled={isSubmitting}
            className="h-12 w-full"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="animate-spin" />
                변경 중
              </>
            ) : (
              "비밀번호 변경"
            )}
          </Button>
        </form>
      </section>
    </main>
  );
}
