import { Image, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w185";

type PlatformLogoProps = {
  provider: string;
  logoPath?: string | null;
  size?: number;
  accessibilityLabel?: string;
};

function WatchaLogo({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <Rect width="60" height="60" rx="10.4" fill="black" />
      <Path
        d="M17.6633 50.8L26.1543 50.2371L29.4872 29.2033H30.3622L33.617 49.7411L42.6235 49.1419L49.8493 9H41.2107L37.9085 39.6255L36.8997 39.6923L33.408 17.6387H26.4413L22.8019 40.6287L21.7988 40.6955L18.6805 17.6387H10L17.6633 50.8Z"
        fill="#FF0558"
      />
    </Svg>
  );
}

export function PlatformLogo({
  provider,
  logoPath,
  size = 30,
  accessibilityLabel,
}: PlatformLogoProps) {
  if (provider !== "WATCHA" && !logoPath) return null;

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel ?? `${provider} 로고`}
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {provider === "WATCHA" ? (
        <WatchaLogo size={size} />
      ) : (
        <Image
          source={{ uri: `${TMDB_IMAGE_BASE_URL}${logoPath}` }}
          resizeMode="contain"
          style={{ width: size, height: size }}
        />
      )}
    </View>
  );
}
