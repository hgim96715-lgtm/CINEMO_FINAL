import { z } from "zod/v4";

export const emailPasswordSetupSchema = z
  .object({
    email: z.email({
      error: "올바른 이메일 형식을 입력해주세요.",
    }),

    password: z.string().min(8, {
      error: "비밀번호는 8자 이상 입력해주세요.",
    }),

    passwordConfirm: z.string({
      error: "비밀번호를 다시 입력해주세요.",
    }),
  })
  .refine((values) => values.password === values.passwordConfirm, {
    path: ["passwordConfirm"],
    error: "비밀번호가 일치하지 않습니다.",
  });

export type EmailPasswordSetupFormValues = z.infer<
  typeof emailPasswordSetupSchema
>;
