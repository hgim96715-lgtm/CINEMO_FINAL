import type { PostcardMetadata } from "@/lib/api/postcards";
import { Text, View } from "react-native";

type PostcardQuoteContentProps = {
  content: string;
  metadata: PostcardMetadata | null | undefined;
  compact?: boolean;
};

export function PostcardQuoteContent({
  content,
  metadata,
  compact = false,
}: PostcardQuoteContentProps) {
  const translation =
    metadata?.type === "QUOTE"
      ? metadata.translations?.find(
          (item) => item.language.toLowerCase() === "ko",
        )?.content
      : undefined;

  return (
    <View>
      <Text
        numberOfLines={compact ? 3 : undefined}
        className="whitespace-pre-wrap text-sm leading-6 text-cinemo-text"
      >
        “{content}”
      </Text>

      {translation && (
        <Text
          numberOfLines={compact ? 3 : undefined}
          className="mt-2 border-t border-white/10 pt-2 text-sm leading-6 text-cinemo-muted"
        >
          {translation}
        </Text>
      )}
    </View>
  );
}
