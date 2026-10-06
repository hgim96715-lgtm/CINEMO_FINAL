"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPasswordReset } from "@/lib/api/auth";
import {
  passwordResetRequestSchema,
  type PasswordResetRequestFormValues,
} from "@/schemas/password-reset-request.schema";

export default function PasswordResetPage() {
  const [apiError, setApiError] = useState("");
  const [sentEmail, setSentEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordResetRequestFormValues>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: PasswordResetRequestFormValues) => {
    setApiError("");

    try {
      await requestPasswordReset(values.email);
      setSentEmail(values.email);
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : "비밀번호 재설정 요청에 실패했습니다.",
      );
    }
  };

  if (sentEmail) {
    return (
      <main className="flex min-h-[calc(100vh-11rem)] items-center justify-center px-4 py-16">
        <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/6 p-6 text-center shadow-2xl backdrop-blur-xl sm:p-8">
          <p className="text-sm font-semibold tracking-[0.3em] text-cinemo-gold">
            CINEMO
          </p>

          <h1 className="mt-5 text-3xl font-bold text-cinemo-text">
            재설정 메일이 발송되었습니다
          </h1>

          <p className="mt-4 text-sm leading-7 text-cinemo-muted">
            <strong className="font-medium text-cinemo-text">
              {sentEmail}
            </strong>
            로 발송된 메일을 확인해주세요.
          </p>

          <p className="mt-3 text-xs text-cinemo-muted/75">
            메일이 보이지 않으면 스팸 메일함을 확인해주세요.
          </p>

          <Link
            href="/login"
            className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-lg bg-cinemo-gold px-4 font-semibold text-cinemo-bg transition hover:bg-cinemo-gold-light"
          >
            로그인으로 돌아가기
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-11rem)] items-center justify-center px-4 py-16">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/6 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <div className="mb-8">
          <p className="text-sm font-semibold tracking-[0.3em] text-cinemo-gold">
            CINEMO
          </p>

          <h1 className="mt-4 text-3xl font-bold text-cinemo-text">
            비밀번호를 잊으셨나요?
          </h1>

          <p className="mt-3 text-sm leading-6 text-cinemo-muted">
            가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-cinemo-text">
              이메일
            </span>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cinemo-muted" />

              <Input
                {...register("email")}
                type="email"
                placeholder="email@example.com"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                className="h-12 border-white/15 bg-white/5 pl-10 text-cinemo-text placeholder:text-white/35"
              />
            </div>

            {errors.email && (
              <p className="mt-2 text-sm text-red-200/75">
                {errors.email.message}
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
                발송 중
              </>
            ) : (
              "재설정 메일 받기"
            )}
          </Button>
        </form>

        <Link
          href="/login"
          className="mt-6 block text-center text-sm text-cinemo-muted transition hover:text-cinemo-gold-light"
        >
          로그인으로 돌아가기
        </Link>
      </section>
    </main>
  );
}
