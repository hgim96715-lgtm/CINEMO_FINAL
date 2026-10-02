import { z } from "zod/v4";

export const moiveSearchSchema = z.object({
  query: z.string().trim().min(1, { error: "검색어를 입력해주세요." }),
});

export type MovieSearchFormValues = z.infer<typeof moiveSearchSchema>;
