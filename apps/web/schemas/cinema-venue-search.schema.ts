import {z} from "zod/v4";

export const venueSearchSchema=z.object({
    query:z.string().trim().min(1,{error:'관람 장소 이름을 입력해주세요.'})
});

export type VenueSearchFormValues=z.infer<typeof venueSearchSchema>;
