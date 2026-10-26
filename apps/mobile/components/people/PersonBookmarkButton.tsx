import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable } from "react-native";
import { router } from "expo-router";

import { CINEMO_COLORS } from "@cinemo/shared";
import {
  addPersonBookmark,
  removePersonBookmark,
} from "@/lib/api/people";
import { getRefreshToken } from "@/lib/api/auth";
import {
  bookmarkedPeopleQueryOptions,
  personBookmarkQueryOptions,
} from "@/lib/queries/person-bookmark.query";

type Props = {
  personId: string;
};

export function PersonBookmarkButton({ personId }: Props) {
  const queryClient = useQueryClient();
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadAuthState() {
      try {
        const refreshToken = await getRefreshToken();

        if (mounted) {
          setHasActiveSession(Boolean(refreshToken));
        }
      } catch {
        if (mounted) {
          setHasActiveSession(false);
        }
      } finally {
        if (mounted) {
          setIsAuthReady(true);
        }
      }
    }

    void loadAuthState();

    return () => {
      mounted = false;
    };
  }, []);

  const bookmarkQuery = useQuery(
    personBookmarkQueryOptions(personId, isAuthReady && hasActiveSession),
  );
  const addMutation = useMutation({
    mutationFn: () => addPersonBookmark(personId),
    onSuccess: (data) => {
      queryClient.setQueryData(
        personBookmarkQueryOptions(personId).queryKey,
        data,
      );
      void queryClient.invalidateQueries({
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
      void queryClient.invalidateQueries({
        queryKey: bookmarkedPeopleQueryOptions().queryKey,
      });
    },
  });

  const isBookmarked = bookmarkQuery.data?.bookmarked ?? false;
  const isPending =
    (isAuthReady && hasActiveSession && bookmarkQuery.isFetching) ||
    addMutation.isPending ||
    removeMutation.isPending;

  const toggleBookmark = () => {
    if (!hasActiveSession) {
      router.push("/login");
      return;
    }

    if (isBookmarked) {
      removeMutation.mutate();
    } else {
      addMutation.mutate();
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isBookmarked ? "인물 저장 해제" : "인물 저장"}
      accessibilityState={{ disabled: isPending, selected: isBookmarked }}
      disabled={isPending}
      onPress={toggleBookmark}
      className="h-10 w-10 items-center justify-center rounded-full border"
      style={{
        borderColor: isBookmarked
          ? `${CINEMO_COLORS.accentLight}99`
          : "rgba(255,255,255,0.15)",
        backgroundColor: isBookmarked
          ? "rgba(212,181,106,0.14)"
          : "rgba(255,255,255,0.05)",
        opacity: isPending ? 0.5 : 1,
      }}
    >
      <Bookmark
        size={19}
        color={
          isBookmarked
            ? CINEMO_COLORS.accentLight
            : CINEMO_COLORS.textSecondary
        }
        fill={isBookmarked ? CINEMO_COLORS.accentLight : "transparent"}
      />
    </Pressable>
  );
}
