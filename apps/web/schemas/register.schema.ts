import { z } from "zod/v4";

export const registerSchema = z
  .object({
    email: z
      .email({ error: "올바른 이메일 형식을 입력해주세요." })
      .trim()
      .min(1, { error: "이메일을 입력해주세요." }),

    password: z
      .string()
      .min(8, { error: "비밀번호는 8자 이상 입력해주세요." })
      .max(128, { error: "비밀번호는 128자 이하로 입력해주세요." }),

    passwordConfirm: z.string().min(1, {
      error: "비밀번호 확인을 입력해주세요.",
    }),

    nickname: z
      .string()
      .trim()
      .min(2, { error: "닉네임은 2자 이상 입력해주세요." })
      .max(30, { error: "닉네임은 30자 이하로 입력해주세요." }),

    terms: z.object({
      service: z.boolean().refine((value) => value, {
        error: "서비스 이용약관 동의가 필요합니다.",
      }),

      privacy: z.boolean().refine((value) => value, {
        error: "개인정보 처리방침 동의가 필요합니다.",
      }),

      marketing: z.boolean(),
    }),
  })
  .refine((values) => values.password === values.passwordConfirm, {
    path: ["passwordConfirm"],
    error: "비밀번호가 일치하지 않습니다.",
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
