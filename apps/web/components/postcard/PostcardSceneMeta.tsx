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
        장면 위치 {metadata.sceneTime}
      </p>
    );
  }

  return (
    <div className="border-y border-white/10 py-4">
      <p className="text-xs font-medium text-cinemo-gold">장면 위치</p>
      <p className="mt-1 text-sm text-white/85">{metadata.sceneTime}</p>
    </div>
  );
}
