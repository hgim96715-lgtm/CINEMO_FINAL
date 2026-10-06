import { z } from "zod/v4";

export const passwordResetRequestSchema = z.object({
  email: z
    .email({ error: "올바른 이메일 형식을 입력해주세요." })
    .trim()
    .min(1, { error: "이메일을 입력해주세요." }),
});

export type PasswordResetRequestFormValues = z.infer<
  typeof passwordResetRequestSchema
>;
