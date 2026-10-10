"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  addPersonBookmark,
  removePersonBookmark,
} from "@/lib/api/people";
import {
  bookmarkedPeopleQueryOptions,
  personBookmarkQueryOptions,
} from "@/lib/queries/person-bookmark.query";
import { useAuthStore } from "@/stores/auth.store";

type PersonBookmarkButtonProps = {
  personId: string;
};

export function PersonBookmarkButton({ personId }: PersonBookmarkButtonProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const bookmarkQuery = useQuery({
    ...personBookmarkQueryOptions(personId),
    enabled: Boolean(user),
  });

  const addMutation = useMutation({
    mutationFn: () => addPersonBookmark(personId),
    onSuccess: (data) => {
      queryClient.setQueryData(
        personBookmarkQueryOptions(personId).queryKey,
        data,
      );
      queryClient.invalidateQueries({
        queryKey: bookmarkedPeopleQueryOptions().queryKey,
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => removePersonBookmark(personId),
    onSuccess: (data) => {
      queryClient.setQueryData(
        personBookmarkQueryOptions(personId).queryKey,
        data,
      );
      queryClient.invalidateQueries({
        queryKey: bookmarkedPeopleQueryOptions().queryKey,
      });
    },
  });

  const bookmarked = bookmarkQuery.data?.bookmarked ?? false;
  const isPending =
    bookmarkQuery.isLoading ||
    addMutation.isPending ||
    removeMutation.isPending;

  const toggleBookmark = () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (bookmarked) {
      removeMutation.mutate();
    } else {
      addMutation.mutate();
    }
  };

  return (
    <button
      type="button"
      onClick={toggleBookmark}
      disabled={isPending}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? "인물 저장 해제" : "인물 저장"}
      title={bookmarked ? "인물 저장 해제" : "인물 저장"}
      className="inline-flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:border-cinemo-gold/60 hover:text-cinemo-gold-light disabled:opacity-50"
    >
      {bookmarked ? (
        <Bookmark className="size-5 text-cinemo-gold fill-cinemo-gold" />
      ) : (
        <Bookmark className="size-5" />
      )}
    </button>
  );
}
