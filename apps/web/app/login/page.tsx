"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, LockKeyhole, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/api/auth";
import { loginSchema, type LoginFormValues } from "@/schemas/login.schema";
import { useAuthStore } from "@/stores/auth.store";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [apiError, setApiError] = useState("");
  const [registered, setRegistered] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRegistered(params.get("registered") === "true");
    setVerified(params.get("verified") === "true");
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setApiError("");
    try {
      const result = await login({
        email: values.email,
        password: values.password,
      });
      setUser(result.user);
      router.replace("/lobby");
      router.refresh();
    } catch {
      setApiError("이메일 또는 비밀번호가 올바르지 않습니다.");
    }
  };
  return (
    <main className="flex min-h-[calc(100vh-11rem)] items-center justify-center px-4 py-16">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/6 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <div className="mb-8">
          <p className="text-sm font-semibold tracking-[0.3em] text-cinemo-gold">
            CINEMO
          </p>

          <h1 className="mt-4 text-3xl font-bold text-cinemo-text">
            오신 걸 환영해요
          </h1>

          <p className="mt-3 text-sm leading-6 text-cinemo-muted">
            로그인하고 나만의 영화 기록을 이어가세요.
          </p>

          {registered && (
            <p
              role="status"
              className="mt-5 rounded-lg border border-cinemo-gold/20 bg-cinemo-gold/6 px-3 py-2 text-sm leading-6 text-cinemo-gold-light"
            >
              인증 메일이 발송되었습니다. 이메일을 확인해 회원가입을
              완료해주세요.
            </p>
          )}

          {verified && (
            <p
              role="status"
              className="mt-5 rounded-lg border border-cinemo-gold/20 bg-cinemo-gold/6 px-3 py-2 text-sm leading-6 text-cinemo-gold-light"
            >
              이메일 인증이 완료되었습니다. 로그인해주세요.
            </p>
          )}

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
              <p className="mt-2 text-sm text-red-300">
                {errors.email.message}
              </p>
            )}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-cinemo-text">
              비밀번호
            </span>

            <div className="relative">
              <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cinemo-muted" />

              <Input
                {...register("password")}
                type="password"
                placeholder="비밀번호를 입력하세요"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                className="h-12 border-white/15 bg-white/5 pl-10 text-cinemo-text placeholder:text-white/35"
              />
            </div>

            {errors.password && (
              <p className="mt-2 text-sm text-red-300">
                {errors.password.message}
              </p>
            )}
          </label>

          {apiError && (
            <p
              role="alert"
              className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300"
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
                로그인 중
              </>
            ) : (
              "로그인"
            )}
          </Button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm">
          <Link
            href="/password-reset"
            className="text-cinemo-muted transition hover:text-cinemo-gold-light"
          >
            비밀번호 찾기
          </Link>

          <Link
            href="/register"
            className="font-semibold text-cinemo-gold-light transition hover:text-cinemo-gold"
          >
            회원가입
          </Link>
        </div>
      </section>
    </main>
  );
}
