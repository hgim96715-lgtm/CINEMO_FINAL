import type { PostcardMetadata } from "@cinemo/api-contract";

type PostcardQuoteContentProps = {
  content: string;
  metadata: PostcardMetadata | null | undefined;
  className?: string;
  compact?: boolean;
  compactQuoteLines?: 2 | 3;
  compactTranslationLines?: 1 | 2 | 3;
};

export function PostcardQuoteContent({
  content,
  metadata,
  className,
  compact = false,
  compactQuoteLines = 2,
  compactTranslationLines = 1,
}: PostcardQuoteContentProps) {
  const translation =
    metadata?.type === "QUOTE"
      ? metadata.translations?.find(
          (item) => item.language.toLowerCase() === "ko",
        )?.content
      : undefined;

  return (
    <div className={className}>
      <p
        className={`whitespace-pre-wrap wrap-break-word ${
          compact
            ? compactQuoteLines === 3
              ? "line-clamp-3"
              : "line-clamp-2"
            : ""
        }`}
      >
        “{content}”
      </p>

      {translation && (
        <p
          className={`mt-2 whitespace-pre-wrap wrap-break-word border-t border-white/10 pt-2 font-sans text-sm font-normal leading-6 text-cinemo-muted ${
            compact
              ? compactTranslationLines === 3
                ? "line-clamp-3"
                : compactTranslationLines === 2
                  ? "line-clamp-2"
                  : "line-clamp-1"
              : ""
          }`}
        >
          {translation}
        </p>
      )}
    </div>
  );
}
