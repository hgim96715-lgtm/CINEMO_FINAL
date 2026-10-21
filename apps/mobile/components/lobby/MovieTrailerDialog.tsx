import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pressable, useWindowDimensions, View } from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";

type MovieTrailerDialogProps = {
  open: boolean;
  videoKey: string | null;
  title: string;
  onOpenChange: (open: boolean) => void;
};

export function MovieTrailerDialog({
  open,
  videoKey,
  title,
  onOpenChange,
}: MovieTrailerDialogProps) {
  const { width: viewportWidth, height: viewportHeight } =
    useWindowDimensions();
  const insets = useSafeAreaInsets();
  const videoHeight = viewportWidth * (9 / 16);

  if (!videoKey) return null;

  const origin = encodeURIComponent("https://site.cinemo.app");

  const embedUrl =
    `https://www.youtube.com/embed/${videoKey}` +
    `?autoplay=1&playsinline=1&rel=0` +
    `&enablejsapi=1&origin=${origin}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!m-0 !h-full !w-full !max-w-none gap-0 overflow-hidden rounded-none border-0 p-0"
        hideClose
        style={{
          width: viewportWidth,
          height: viewportHeight,
          minWidth: viewportWidth,
          maxWidth: viewportWidth,
          minHeight: viewportHeight,
          maxHeight: viewportHeight,
          borderRadius: 0,
          backgroundColor: "#0B181B",
        }}
      >
        <DialogClose asChild>
          <Pressable
            hitSlop={12}
            className="absolute z-50 h-11 w-11 items-center justify-center"
            style={{
              top: insets.top + 8,
              right: 16,
            }}
          >
            <X size={24} color="#F3EFE6" strokeWidth={2} />
          </Pressable>
        </DialogClose>

        <View
          className="border-b border-[#C6A15B]/20"
          style={{
            paddingHorizontal: 20,
            paddingTop: insets.top + 20,
            paddingBottom: 18,
          }}
        >
          <DialogTitle className="pr-10 text-center text-lg font-bold text-[#F3EFE6]">
            {title} 예고편
          </DialogTitle>

          <DialogDescription className="mt-2 text-center text-sm text-[#A9B0AE]">
            {title} 공식 예고편
          </DialogDescription>
        </View>

        <View className="flex-1 justify-center bg-black">
          <View
            className="w-full overflow-hidden"
            style={{ height: videoHeight }}
          >
            <WebView
              source={{
                uri: embedUrl,
                headers: {
                  Referer: "https://site.cinemo.app/",
                },
              }}
              originWhitelist={["https://*.youtube.com"]}
              javaScriptEnabled
              domStorageEnabled
              allowsInlineMediaPlayback
              allowsFullscreenVideo
              mediaPlaybackRequiresUserAction={false}
            />
          </View>
        </View>
      </DialogContent>
    </Dialog>
  );
}
