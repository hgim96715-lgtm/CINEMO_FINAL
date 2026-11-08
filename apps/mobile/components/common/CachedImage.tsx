import { requireOptionalNativeModule } from "expo";
import { cssInterop } from "nativewind";
import {
  Image as NativeImage,
  type ImageProps,
  PixelRatio,
  Platform,
  StyleSheet,
} from "react-native";

import { CINEMO_COLORS } from "@cinemo/shared";

type CachedImageProps = Pick<ImageProps,
  "source" | "style" | "resizeMode" | "accessibilityLabel" | "accessible"
> & {
  className?: string;
  imageWidth?: number;
};

type ExpoImageComponent = typeof import("expo-image").Image;

// 이전 개발 빌드에서도 새 네이티브 모듈이 없으면 기존 이미지로 표시한다.
const ExpoImage: ExpoImageComponent | null =
  Platform.OS === "web" || requireOptionalNativeModule("ExpoImage")
    ? (require("expo-image") as typeof import("expo-image")).Image
    : null;

function thumbnailUri(uri: string, width: number, pixelRatio: number) {
  const secureUri = uri.replace(/^http:\/\//i, "https://");
  const match = secureUri.match(/^https:\/\/image\.tmdb\.org\/t\/p\/(original|w\d+)\/(.+)$/);
  if (!match) return secureUri;

  const requiredWidth = width * pixelRatio;
  const targetWidth = [185, 342, 500, 780].find((size) => size >= requiredWidth) ?? 780;
  const existingWidth = match[1] === "original" ? Infinity : Number(match[1].slice(1));
  return `https://image.tmdb.org/t/p/w${Math.min(existingWidth, targetWidth)}/${match[2]}`;
}

export function CachedImage({
  source,
  style,
  resizeMode = "cover",
  accessibilityLabel,
  accessible,
  imageWidth = 160,
}: CachedImageProps) {
  const flattenedStyle = StyleSheet.flatten(style);
  const width = typeof flattenedStyle?.width === "number" ? flattenedStyle.width : imageWidth;
  const remoteSource = source && typeof source === "object" && !Array.isArray(source) && "uri" in source
    ? source
    : null;
  const uri = remoteSource?.uri
    ? thumbnailUri(remoteSource.uri, width, PixelRatio.get())
    : undefined;
  const imageStyle = [{ backgroundColor: CINEMO_COLORS.surface }, style];

  if (!ExpoImage || !uri || resizeMode === "repeat") {
    return (
      <NativeImage
        source={uri ? { ...remoteSource, uri, cache: "force-cache" } : source}
        resizeMode={resizeMode}
        style={imageStyle}
        accessibilityLabel={accessibilityLabel}
        accessible={accessible}
        fadeDuration={0}
      />
    );
  }

  return (
    <ExpoImage
      source={{ uri, headers: remoteSource?.headers }}
      contentFit={resizeMode === "stretch" ? "fill" : resizeMode === "center" ? "none" : resizeMode}
      cachePolicy="memory-disk"
      recyclingKey={uri}
      transition={100}
      style={imageStyle}
      accessibilityLabel={accessibilityLabel}
      accessible={accessible}
    />
  );
}

cssInterop(CachedImage, { className: "style" });
