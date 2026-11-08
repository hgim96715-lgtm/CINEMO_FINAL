import { isAxiosError } from "axios";
import type { ImagePickerAsset } from "expo-image-picker";
import { requireOptionalNativeModule } from "expo";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Image, Modal, Pressable, Text, TextInput, View } from "react-native";

import type { MobileLoginResponse } from "@/lib/api/auth";
import { apiClient } from "@/lib/api/apiClient";
import { myCinemaKeys } from "@/lib/queries/my-cinema.query";

export function ProfileEditor({ user }: { user: MobileLoginResponse["user"] }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [nickname, setNickname] = useState(user.nickname);
  const [photo, setPhoto] = useState<ImagePickerAsset>();
  const [picking, setPicking] = useState(false);
  const [photoError, setPhotoError] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      const form = new FormData();
      form.append("nickname", nickname.trim());
      if (photo) {
        const file = photo.file ?? {
          uri: photo.uri,
          name: photo.fileName ?? "profile.jpg",
          type: photo.mimeType ?? "image/jpeg",
        };
        // React Native FormData accepts a file URI descriptor.
        form.append("image", file as Blob);
      }
      const { data } = await apiClient.patch<MobileLoginResponse["user"]>(
        "/auth/me/profile", form, { headers: { "Content-Type": "multipart/form-data" } },
      );
      return data;
    },
    onSuccess: async (updatedUser) => {
      await queryClient.cancelQueries({ queryKey: myCinemaKeys.user() });
      queryClient.setQueryData(myCinemaKeys.user(), updatedUser);
      setOpen(false);
    },
  });

  async function choosePhoto() {
    setPicking(true);
    setPhotoError("");
    save.reset();
    try {
      if (!requireOptionalNativeModule("ExponentImagePicker")) {
        setPhotoError("사진을 선택하려면 최신 CINEMO 앱 빌드가 필요해요.");
        return;
      }
      const ImagePicker = await import("expo-image-picker");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        preferredAssetRepresentationMode:
          ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      });
      if (result.canceled) return;
      const [asset] = result.assets;
      if (asset.fileSize && asset.fileSize > 8 * 1024 * 1024) {
        setPhotoError("8MB 이하의 사진을 선택해주세요.");
        return;
      }
      setPhoto(asset);
    } catch {
      setPhotoError("사진 보관함을 열 수 없어요.");
    } finally {
      setPicking(false);
    }
  }

  const busy = save.isPending || picking;
  const preview = photo?.uri ?? user.profileImageUrl;
  const response = isAxiosError(save.error) ? save.error.response : undefined;
  const serverMessage = response?.data?.message;
  const saveErrorMessage = response?.status === 404
    ? "현재 연결된 서버에서 프로필 편집을 사용할 수 없어요."
    : typeof serverMessage === "string" && [400, 409, 413].includes(response?.status ?? 0)
      ? serverMessage
      : "프로필을 저장할 수 없어요. 잠시 후 다시 시도해주세요.";

  return (
    <>
      <Pressable
        accessibilityRole="button"
        className="shrink-0 rounded-lg border border-white/20 px-3 py-2"
        onPress={() => {
          setNickname(user.nickname);
          setPhoto(undefined);
          setPhotoError("");
          save.reset();
          setOpen(true);
        }}
      >
        <Text className="text-xs font-semibold text-cinemo-gold-light">프로필 편집</Text>
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => { if (!busy) setOpen(false); }}
      >
        <View className="flex-1 items-center justify-center bg-black/70 p-6">
          <View className="w-full max-w-sm gap-4 rounded-3xl bg-cinemo-bg p-6">
            <Text className="text-xl font-bold text-cinemo-text">프로필 편집</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="프로필 사진 선택"
              disabled={busy}
              onPress={() => void choosePhoto()}
              className="items-center gap-2 py-2"
            >
              {preview && <Image source={{ uri: preview }} className="h-20 w-20 rounded-full" />}
              <Text className="font-semibold text-cinemo-gold-light">
                {preview ? "사진 변경" : "사진 추가"}
              </Text>
            </Pressable>
            <Text className="text-cinemo-text">닉네임</Text>
            <TextInput
              accessibilityLabel="닉네임"
              value={nickname}
              onChangeText={setNickname}
              editable={!busy}
              maxLength={30}
              autoCorrect={false}
              autoCapitalize="none"
              className="rounded-xl border border-white/20 px-4 py-3 text-cinemo-text"
            />
            {(photoError || save.isError) && (
              <Text accessibilityRole="alert" className="text-red-400">
                {photoError || saveErrorMessage}
              </Text>
            )}
            <View className="flex-row justify-end gap-4">
              <Pressable accessibilityRole="button" disabled={busy} onPress={() => setOpen(false)} className="p-2">
                <Text className="text-cinemo-muted">취소</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={busy || nickname.trim().length < 2 || (!photo && nickname.trim() === user.nickname)}
                onPress={() => save.mutate()}
                className="p-2"
              >
                <Text className="font-semibold text-cinemo-gold-light">
                  {save.isPending ? "저장 중" : "저장"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
