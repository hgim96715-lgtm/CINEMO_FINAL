import { z } from "zod/v4";

export const emailLoginSchema = z.object({
  email: z.email({
    error: "올바른 이메일 형식을 입력해주세요.",
  }),

  password: z.string().min(1, {
    error: "비밀번호를 입력해주세요.",
  }),
});

export type EmailLoginFormValues = z.infer<typeof emailLoginSchema>;
