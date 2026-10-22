import { z } from "zod/v4";

export const oauthSignupSchema = z.object({
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
});

export type OauthSignupFormValues = z.infer<typeof oauthSignupSchema>;
