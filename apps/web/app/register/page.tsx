"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  LoaderCircle,
  LockKeyhole,
  Mail,
  X,
  UserRound,
  Eye,
  EyeOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  checkEmail,
  checkNickname,
  register as registerUser,
} from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/api/apiClient";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/schemas/register.schema";

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

export default function RegisterPage() {
  const [apiError, setApiError] = useState("");
  const [activeTerms, setActiveTerms] = useState<TermsType | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const [nicknameCheckMessage, setNicknameCheckMessage] = useState("");
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(
    null,
  );
  const [checkedNickname, setCheckedNickname] = useState("");
  const [emailCheckMessage, setEmailCheckMessage] = useState("");
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [checkedEmail, setCheckedEmail] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    trigger,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      passwordConfirm: "",
      nickname: "",
      terms: {
        service: false,
        privacy: false,
        marketing: false,
      },
    },
  });

  const nicknameField = register("nickname");
  const emailField = register("email");
  const terms = watch("terms");

  const allRequiredTermsChecked = terms.service && terms.privacy;

  const handleRequiredTermsChange = (checked: boolean) => {
    setValue("terms.service", checked, { shouldValidate: true });
    setValue("terms.privacy", checked, { shouldValidate: true });
  };

  const handleEmailCheck = async () => {
    const isValid = await trigger("email");

    if (!isValid) {
      setEmailAvailable(null);
      setCheckedEmail("");
      setEmailCheckMessage("");
      return;
    }

    const email = getValues("email").trim().toLowerCase();

    setEmailCheckMessage("");
    setEmailAvailable(null);
    clearErrors("email");

    try {
      const result = await checkEmail(email);

      setEmailAvailable(result.available);
      setEmailCheckMessage(
        result.available
          ? "사용 가능한 이메일입니다."
          : "이미 가입된 이메일입니다.",
      );

      if (result.available) {
        setCheckedEmail(email);
        clearErrors("email");
      } else {
        setCheckedEmail("");
        setError("email", {
          type: "manual",
          message: "이미 가입된 이메일입니다.",
        });
      }
    } catch (error) {
      setEmailAvailable(false);
      setEmailCheckMessage(
        getApiErrorMessage(error, "이메일을 확인할 수 없습니다."),
      );
    }
  };

  const handleNicknameCheck = async () => {
    const isValid = await trigger("nickname");

    if (!isValid) {
      setNicknameAvailable(null);
      setCheckedNickname("");
      setNicknameCheckMessage("");
      return;
    }

    const nickname = getValues("nickname").trim();

    setNicknameCheckMessage("");
    setNicknameAvailable(null);
    clearErrors("nickname");

    try {
      const result = await checkNickname(nickname);

      setNicknameAvailable(result.available);
      setNicknameCheckMessage(
        result.available
          ? "사용 가능한 닉네임입니다."
          : "이미 사용 중인 닉네임입니다.",
      );

      if (result.available) {
        setCheckedNickname(nickname);
        clearErrors("nickname");
      } else {
        setCheckedNickname("");

        setError("nickname", {
          type: "manual",
          message: "이미 사용 중인 닉네임입니다.",
        });
      }
    } catch (error) {
      setNicknameAvailable(false);
      setNicknameCheckMessage(
        getApiErrorMessage(error, "닉네임을 확인할 수 없습니다."),
      );
    }
  };

  const onSubmit = async (values: RegisterFormValues) => {
    setApiError("");
    const email = values.email.trim().toLowerCase();
    const nickname = values.nickname.trim();
    let hasCheckError = false;

    if (emailAvailable !== true || checkedEmail !== email) {
      setError("email", {
        type: "manual",
        message: "이메일 중복 확인을 완료해주세요.",
      });
      hasCheckError = true;
    }

    if (nicknameAvailable !== true || checkedNickname !== nickname) {
      setError("nickname", {
        type: "manual",
        message: "닉네임 중복 확인을 완료해주세요.",
      });
      hasCheckError = true;
    }

    if (hasCheckError) {
      return;
    }

    try {
      const { passwordConfirm: _passwordConfirm, ...input } = values;

      await registerUser({
        ...input,
        terms: {
          service: true,
          privacy: true,
          marketing: values.terms.marketing,
        },
      });

      setRegisteredEmail(values.email);
      setRegistered(true);
    } catch (error) {
      const message = getApiErrorMessage(error, "회원가입에 실패했습니다.");
      if (message === "이미 가입된 이메일입니다.") {
        setError("email", {
          type: "server",
          message,
        });
        return;
      }
      setApiError(getApiErrorMessage(error, "회원가입에 실패했습니다."));
    }
  };

  if (registered) {
    return (
      <main className="flex min-h-[calc(100vh-11rem)] items-center justify-center px-4 py-16">
        <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/6 p-6 text-center shadow-2xl backdrop-blur-xl sm:p-8">
          <p className="text-sm font-semibold tracking-[0.3em] text-cinemo-gold">
            CINEMO
          </p>

          <h1 className="mt-5 text-3xl font-bold text-cinemo-text">
            인증 메일이 발송되었습니다
          </h1>

          <p className="mt-4 text-sm leading-7 text-cinemo-muted">
            <strong className="font-medium text-cinemo-text">
              {registeredEmail}
            </strong>
            로 발송된 메일을 확인해 회원가입을 완료해주세요.
          </p>

          <p className="mt-3 text-xs leading-6 text-cinemo-muted/75">
            메일이 보이지 않으면 스팸 메일함을 확인해주세요.
          </p>

          <Link
            href="/login"
            className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-lg bg-cinemo-gold px-4 font-semibold text-cinemo-bg transition hover:bg-cinemo-gold-light"
          >
            로그인 페이지로 이동
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
            CINEMO에 오신 걸 환영해요
          </h1>
          <p className="mt-3 text-sm leading-6 text-cinemo-muted">
            계정을 만들고 나만의 영화 기록을 시작하세요.
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
                {...emailField}
                onChange={(event) => {
                  emailField.onChange(event);

                  setEmailAvailable(null);
                  setCheckedEmail("");
                  setEmailCheckMessage("");
                  clearErrors("email");
                }}
                onBlur={async (event) => {
                  emailField.onBlur(event);
                  await handleEmailCheck();
                }}
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
            {!errors.email && emailCheckMessage && (
              <p
                className={`mt-2 text-sm ${
                  emailAvailable ? "text-emerald-200/80" : "text-red-200/75"
                }`}
              >
                {emailCheckMessage}
              </p>
            )}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-cinemo-text">
              닉네임
            </span>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cinemo-muted" />
                <Input
                  {...nicknameField}
                  onChange={(event) => {
                    nicknameField.onChange(event);

                    setNicknameAvailable(null);
                    setCheckedNickname("");
                    setNicknameCheckMessage("");
                    clearErrors("nickname");
                  }}
                  placeholder="시네마광"
                  autoComplete="nickname"
                  aria-invalid={Boolean(errors.nickname)}
                  className="h-12 border-white/15 bg-white/5 pl-10 text-cinemo-text placeholder:text-white/35"
                />
              </div>

              <button
                type="button"
                onClick={handleNicknameCheck}
                className="h-12 shrink-0 rounded-lg border border-cinemo-gold/40 px-4 text-sm font-semibold text-cinemo-gold transition hover:bg-cinemo-gold/10"
              >
                중복확인
              </button>
            </div>
            {errors.nickname && (
              <p className="mt-2 text-sm text-red-200/75">
                {errors.nickname.message}
              </p>
            )}
            {!errors.nickname && nicknameCheckMessage && (
              <p
                className={`mt-2 text-sm ${
                  nicknameAvailable ? "text-emerald-200/80" : "text-red-200/75"
                }`}
              >
                {nicknameCheckMessage}
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
                type={showPasswordConfirm ? "text" : "password"}
                placeholder="8자 이상 입력하세요"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.password)}
                className="h-12 border-white/15 bg-white/5 pl-10 text-cinemo-text placeholder:text-white/35"
              />
              <button
                type="button"
                aria-label={
                  showPasswordConfirm ? "비밀번호 숨기기" : "비밀번호 보기"
                }
                onClick={() => setShowPasswordConfirm((visible) => !visible)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cinemo-muted hover:text-cinemo-text"
              >
                {showPasswordConfirm ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-2 text-sm text-red-200/75">
                {errors.password.message}
              </p>
            )}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-cinemo-text">
              비밀번호 확인
            </span>
            <div className="relative">
              <Check className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cinemo-muted" />
              <Input
                {...register("passwordConfirm")}
                type={showPassword ? "text" : "password"}
                placeholder="비밀번호를 한 번 더 입력하세요"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.passwordConfirm)}
                className="h-12 border-white/15 bg-white/5 pl-10 text-cinemo-text placeholder:text-white/35"
              />
              <button
                type="button"
                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cinemo-muted hover:text-cinemo-text"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.passwordConfirm && (
              <p className="mt-2 text-sm text-red-200/75">
                {errors.passwordConfirm.message}
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
                checked={allRequiredTermsChecked}
                onChange={(event) =>
                  handleRequiredTermsChange(event.target.checked)
                }
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
              <span className="flex flex-1 items-center justify-between gap-3">
                <span>서비스 이용약관에 동의합니다. (필수)</span>
                <button
                  type="button"
                  onClick={() => setActiveTerms("service")}
                  className="shrink-0 text-xs text-cinemo-gold-light underline underline-offset-4 transition hover:text-cinemo-gold"
                >
                  자세히 보기
                </button>
              </span>
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
              <span className="flex flex-1 items-center justify-between gap-3">
                <span>개인정보 처리방침에 동의합니다. (필수)</span>
                <button
                  type="button"
                  onClick={() => setActiveTerms("privacy")}
                  className="shrink-0 text-xs text-cinemo-gold-light underline underline-offset-4 transition hover:text-cinemo-gold"
                >
                  자세히 보기
                </button>
              </span>
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
              <span className="flex flex-1 items-center justify-between gap-3">
                <span>마케팅 정보 수신에 동의합니다. (선택)</span>
                <button
                  type="button"
                  onClick={() => setActiveTerms("marketing")}
                  className="shrink-0 text-xs text-cinemo-gold-light underline underline-offset-4 transition hover:text-cinemo-gold"
                >
                  자세히 보기
                </button>
              </span>
            </label>
          </fieldset>

          {activeTerms && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="terms-dialog-title"
              className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
              onClick={() => setActiveTerms(null)}
            >
              <section
                className="w-full max-w-lg rounded-3xl border border-white/15 bg-cinemo-bg p-6 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-4">
                  <h2
                    id="terms-dialog-title"
                    className="text-xl font-bold text-cinemo-text"
                  >
                    {termsDetails[activeTerms].title}
                  </h2>
                  <button
                    type="button"
                    aria-label="약관 자세히 보기 닫기"
                    onClick={() => setActiveTerms(null)}
                    className="flex size-9 items-center justify-center rounded-full text-cinemo-muted transition hover:bg-white/10 hover:text-cinemo-text"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <p className="mt-5 text-sm leading-7 text-cinemo-muted">
                  {termsDetails[activeTerms].content}
                </p>
              </section>
            </div>
          )}

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
                가입 중
              </>
            ) : (
              "회원가입"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-cinemo-muted">
          이미 계정이 있나요?
          <Link
            href="/login"
            className="ml-1 font-semibold text-cinemo-gold-light transition hover:text-cinemo-gold"
          >
            로그인
          </Link>
        </p>
      </section>
    </main>
  );
}
