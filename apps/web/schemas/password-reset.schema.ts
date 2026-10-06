import { z } from "zod/v4";

export const passwordResetSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, { error: "비밀번호는 8자 이상 입력해주세요." })
      .max(128, { error: "비밀번호는 128자 이하로 입력해주세요." }),

    newPasswordConfirm: z.string().min(1, {
      error: "비밀번호 확인을 입력해주세요.",
    }),
  })
  .refine((values) => values.newPassword === values.newPasswordConfirm, {
    path: ["newPasswordConfirm"],
    error: "비밀번호가 일치하지 않습니다.",
  });

export type PasswordResetFormValues = z.infer<typeof passwordResetSchema>;
