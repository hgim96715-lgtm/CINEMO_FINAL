import { z } from "zod/v4";

export const postcardCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, { error: "댓글 내용을 입력해주세요." })
    .max(500, { error: "댓글은 500자까지 작성할 수 있습니다." }),
});
export type PostcardCommentFormValues = z.infer<typeof postcardCommentSchema>;
