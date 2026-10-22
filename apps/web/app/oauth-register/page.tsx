"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { completeOauthSignup } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/api/apiClient";
import {
  oauthSignupSchema,
  type OauthSignupFormValues,
} from "@/schemas/oauth-signup.schema";
import { useAuthStore } from "@/stores/auth.store";

const providerNames = {
  apple: "Apple",
  google: "Google",
  naver: "네이버",
} as const;

type Provider = keyof typeof providerNames;

export default function OauthRegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [ticket, setTicket] = useState("");
  const [provider, setProvider] = useState<Provider | null>(null);
  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OauthSignupFormValues>({
    resolver: zodResolver(oauthSignupSchema),
    defaultValues: {
      nickname: "",
      terms: {
        service: false,
        privacy: false,
        marketing: false,
      },
    },
  });

  const terms = watch("terms");
  const requiredTermsChecked = terms.service && terms.privacy;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauth = params.get("oauth");

    setTicket(params.get("ticket") ?? "");
    setProvider(
      oauth === "apple" || oauth === "google" || oauth === "naver"
        ? oauth
        : null,
    );
  }, []);

  const onSubmit = async (values: OauthSignupFormValues) => {
    if (!ticket) {
      setApiError("가입 정보를 확인할 수 없습니다. 다시 로그인해주세요.");
      return;
    }

    setApiError("");

    try {
      const result = await completeOauthSignup({
        ticket,
        nickname: values.nickname,
        terms: {
          service: true,
          privacy: true,
          marketing: values.terms.marketing,
        },
      });

      setUser(result.user);
      router.replace("/lobby");
      router.refresh();
    } catch (error) {
      setApiError(
        getApiErrorMessage(error, "소셜 회원가입을 완료할 수 없습니다."),
      );
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
            가입을 완료해주세요
          </h1>
          <p className="mt-3 text-sm leading-6 text-cinemo-muted">
            {provider ? `${providerNames[provider]} 계정` : "소셜 계정"}으로
            사용할 닉네임과 약관을 설정하세요.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-cinemo-text">
              닉네임
            </span>
            <div className="relative">
              <UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cinemo-muted" />
              <Input
                {...register("nickname")}
                placeholder="시네마광"
                autoComplete="nickname"
                aria-invalid={Boolean(errors.nickname)}
                className="h-12 border-white/15 bg-white/5 pl-10 text-cinemo-text placeholder:text-white/35"
              />
            </div>
            {errors.nickname && (
              <p className="mt-2 text-sm text-red-200/75">
                {errors.nickname.message}
              </p>
            )}
          </label>

          <fieldset className="space-y-3 rounded-2xl border border-white/10 bg-white/3 p-4">
            <legend className="px-1 text-sm font-medium text-cinemo-text">
              약관 동의
            </legend>

            <label className="flex items-start gap-3 border-b border-white/10 pb-3 text-sm font-semibold text-cinemo-text">
              <input
                type="checkbox"
                checked={requiredTermsChecked}
                onChange={(event) => {
                  setValue("terms.service", event.target.checked, {
                    shouldValidate: true,
                  });
                  setValue("terms.privacy", event.target.checked, {
                    shouldValidate: true,
                  });
                }}
                className="mt-0.5 accent-cinemo-gold"
              />
              <span>필수 약관에 모두 동의합니다.</span>
            </label>

            <label className="flex items-start gap-3 text-sm text-cinemo-muted">
              <input
                type="checkbox"
                {...register("terms.service")}
                className="mt-0.5 accent-cinemo-gold"
              />
              <span>서비스 이용약관에 동의합니다. (필수)</span>
            </label>
            {errors.terms?.service && (
              <p className="text-sm text-red-200/75">
                {errors.terms.service.message}
              </p>
            )}

            <label className="flex items-start gap-3 text-sm text-cinemo-muted">
              <input
                type="checkbox"
                {...register("terms.privacy")}
                className="mt-0.5 accent-cinemo-gold"
              />
              <span>개인정보 처리방침에 동의합니다. (필수)</span>
            </label>
            {errors.terms?.privacy && (
              <p className="text-sm text-red-200/75">
                {errors.terms.privacy.message}
              </p>
            )}

            <label className="flex items-start gap-3 text-sm text-cinemo-muted">
              <input
                type="checkbox"
                {...register("terms.marketing")}
                className="mt-0.5 accent-cinemo-gold"
              />
              <span>마케팅 정보 수신에 동의합니다. (선택)</span>
            </label>
          </fieldset>

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
            disabled={isSubmitting || !ticket}
            className="h-12 w-full"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="animate-spin" />
                가입 처리 중
              </>
            ) : (
              "가입 완료"
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
