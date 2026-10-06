import { z } from "zod/v4";

export const loginSchema = z.object({
  email: z
    .email({ error: "올바른 이메일 형식을 입력해주세요." })
    .trim()
    .min(1, { error: "이메일을 입력해주세요." }),

  password: z.string().min(1, {
    error: "비밀번호를 입력해주세요.",
  }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
