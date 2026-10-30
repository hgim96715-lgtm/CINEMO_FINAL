"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LockKeyhole, Mail, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api/apiClient";
import { adminLogin } from "@/lib/api/auth";
import { loginSchema, type LoginFormValues } from "@/schemas/login.schema";
import { useAuthStore } from "@/stores/auth.store";

export default function AdminLoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [apiError, setApiError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setApiError("");

    try {
      const result = await adminLogin(values);
      setUser(result.user);
      router.replace("/admin/users");
      router.refresh();
    } catch (error) {
      setApiError(getApiErrorMessage(error, "관리자 계정만 로그인할 수 있습니다."));
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-11rem)] items-center justify-center px-4 py-16">
      <section className="w-full max-w-md rounded-3xl border border-cinemo-gold/25 bg-white/6 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <p className="text-sm font-semibold tracking-[0.3em] text-cinemo-gold">CINEMO ADMIN</p>
        <h1 className="mt-4 text-3xl font-bold text-cinemo-text">관리자 로그인</h1>
        <p className="mt-3 text-sm leading-6 text-cinemo-muted">관리자 계정으로만 접근할 수 있는 공간</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-cinemo-text">이메일</span>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cinemo-muted" />
              <Input {...register("email")} type="email" autoComplete="username" className="h-12 border-white/15 bg-white/5 pl-10 text-cinemo-text" />
            </div>
            {errors.email && <p className="mt-2 text-sm text-red-300">{errors.email.message}</p>}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-cinemo-text">비밀번호</span>
            <div className="relative">
              <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cinemo-muted" />
              <Input {...register("password")} type={showPassword ? "text" : "password"} autoComplete="current-password" className="h-12 border-white/15 bg-white/5 pl-10 pr-12 text-cinemo-text" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-cinemo-muted">
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-2 text-sm text-red-300">{errors.password.message}</p>}
          </label>

          {apiError && <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300">{apiError}</p>}

          <Button type="submit" variant="cinemo-primary" size="lg" disabled={isSubmitting} className="h-12 w-full">
            {isSubmitting ? <><LoaderCircle className="animate-spin" /> 로그인 중</> : "관리자 로그인"}
          </Button>
        </form>
      </section>
    </main>
  );
}
