import type { PostcardMetadata } from "@cinemo/api-contract";

type PostcardSceneMetaProps = {
  metadata: PostcardMetadata | null | undefined;
  compact?: boolean;
};

export function PostcardSceneMeta({
  metadata,
  compact = false,
}: PostcardSceneMetaProps) {
  if (metadata?.type !== "SCENE" || !metadata.sceneTime) {
    return null;
  }

  if (compact) {
    return (
      <p className="mt-2 truncate text-xs text-cinemo-muted">
        시점 {metadata.sceneTime}
      </p>
    );
  }

  return (
    <dl className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-3 text-sm">
      <dt className="text-xs font-medium text-cinemo-muted">시점</dt>
      <dd className="min-w-0 truncate text-white/85">{metadata.sceneTime}</dd>
    </dl>
  );
}
