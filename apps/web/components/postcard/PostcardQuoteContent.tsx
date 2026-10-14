import type { PostcardMetadata } from "@cinemo/api-contract";

type PostcardQuoteContentProps = {
  content: string;
  metadata: PostcardMetadata | null | undefined;
  className?: string;
  compact?: boolean;
};

export function PostcardQuoteContent({
  content,
  metadata,
  className,
  compact = false,
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
          compact ? "line-clamp-2" : ""
        }`}
      >
        “{content}”
      </p>

      {translation && (
        <p
          className={`mt-2 whitespace-pre-wrap wrap-break-word border-t border-white/10 pt-2 font-sans text-sm font-normal leading-6 text-cinemo-muted ${
            compact ? "line-clamp-1" : ""
          }`}
        >
          {translation}
        </p>
      )}
    </div>
  );
}
