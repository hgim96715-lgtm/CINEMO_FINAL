import { useQuery } from "@tanstack/react-query";
import { UserRound } from "lucide-react-native";
import { Image, Pressable, Text, View } from "react-native";
import { router } from "expo-router";

import { CINEMO_COLORS } from "@cinemo/shared";
import type { PersonRole } from "@/lib/api/people";
import { bookmarkedPeopleQueryOptions } from "@/lib/queries/person-bookmark.query";
import { getImageUrl } from "@/lib/utils";

const roleLabels: Record<PersonRole, string> = {
  DIRECTOR: "감독",
  ACTOR: "배우",
};

export function BookmarkedPeopleList() {
  const peopleQuery = useQuery(bookmarkedPeopleQueryOptions());

  if (peopleQuery.isPending) {
    return (
      <Text className="text-sm text-cinemo-muted">
        저장한 인물을 불러오는 중...
      </Text>
    );
  }

  const people = peopleQuery.data ?? [];

  if (people.length === 0) {
    return (
      <View className="items-center rounded-2xl border p-8" style={panelStyle}>
        <UserRound size={30} color={CINEMO_COLORS.textSecondary} />
        <Text className="mt-3 text-center text-sm text-cinemo-muted">
          저장한 감독이나 배우가 없습니다.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap gap-3">
      {people.map(({ person }) => {
        const profileUrl = getImageUrl(person.profileUrl);

        return (
          <Pressable
            key={person.id}
            onPress={() => router.push(`/people/${person.id}`)}
            className="w-[48%] items-center rounded-2xl p-4"
            style={panelStyle}
          >
            <View
              className="items-center justify-center overflow-hidden rounded-full border"
              style={{
                width: 64,
                height: 64,
                borderColor: `${CINEMO_COLORS.accentLight}66`,
                backgroundColor: "rgba(255,255,255,0.05)",
              }}
            >
              {profileUrl ? (
                <Image
                  source={{ uri: profileUrl }}
                  resizeMode="cover"
                  style={{ width: 64, height: 64 }}
                />
              ) : (
                <UserRound size={26} color={CINEMO_COLORS.textSecondary} />
              )}
            </View>

            <Text
              numberOfLines={1}
              className="mt-3 w-full text-center text-sm font-semibold text-cinemo-text"
            >
              {person.name}
            </Text>
            {person.nameEn && (
              <Text
                numberOfLines={1}
                className="mt-1 w-full text-center text-xs text-cinemo-muted"
              >
                {person.nameEn}
              </Text>
            )}
            <View className="mt-2 flex-row flex-wrap justify-center gap-1">
              {person.roles.map((role) => (
                <Text
                  key={role}
                  className="rounded-md border border-cinemo-gold/30 px-2 py-0.5 text-[10px] text-cinemo-gold-light"
                  style={{ backgroundColor: "rgba(212,181,106,0.1)" }}
                >
                  {roleLabels[role]}
                </Text>
              ))}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const panelStyle = {
  borderColor: "rgba(255,255,255,0.1)",
  backgroundColor: "rgba(255,255,255,0.035)",
};
