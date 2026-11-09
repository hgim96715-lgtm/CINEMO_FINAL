import { Ionicons } from "@expo/vector-icons";
import { CINEMO_COLORS } from "@cinemo/shared";
import { isAxiosError } from "axios";
import type { ImagePickerAsset } from "expo-image-picker";
import { requireOptionalNativeModule } from "expo";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import type { MobileLoginResponse } from "@/lib/api/auth";
import { useUpdateMyProfile } from "@/lib/queries/my-cinema.mutation";

export function ProfileEditor({ user }: { user: MobileLoginResponse["user"] }) {
  const [open, setOpen] = useState(false);
  const [nickname, setNickname] = useState(user.nickname);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [photo, setPhoto] = useState<ImagePickerAsset>();
  const pickerInFlight = useRef(false);
  const [picking, setPicking] = useState(false);
  const [photoError, setPhotoError] = useState("");

  const save = useUpdateMyProfile();

  async function choosePhoto() {
    if (pickerInFlight.current || save.isPending) return;
    pickerInFlight.current = true;
    Keyboard.dismiss();
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
      setRemovePhoto(false);
      setPhoto(asset);
    } catch {
      setPhotoError("사진 보관함을 열 수 없어요.");
    } finally {
      pickerInFlight.current = false;
      setPicking(false);
    }
  }

  const busy = save.isPending || picking;
  const preview = photo?.uri ?? (removePhoto ? null : user.profileImageUrl);
  const response = isAxiosError(save.error) ? save.error.response : undefined;
  const serverMessage = response?.data?.message;
  const saveErrorMessage =
    response?.status === 404
      ? "현재 연결된 서버에서 프로필 편집을 사용할 수 없어요."
      : typeof serverMessage === "string" &&
          [400, 409, 413].includes(response?.status ?? 0)
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
          setRemovePhoto(false);
          setPhotoError("");
          save.reset();
          setOpen(true);
        }}
      >
        <Text className="text-xs font-semibold text-cinemo-gold-light">
          프로필 편집
        </Text>
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!busy) setOpen(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 items-center justify-center bg-black/70 p-5"
        >
          <View className="w-full max-w-sm gap-4 rounded-3xl bg-cinemo-bg p-6">
            <Text className="text-xl font-bold text-cinemo-text">
              프로필 편집
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                preview ? "프로필 사진 변경" : "프로필 사진 추가"
              }
              accessibilityState={{ disabled: busy, busy: picking }}
              disabled={busy}
              onPress={() => void choosePhoto()}
              className="min-h-20 flex-row items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 active:bg-white/10"
            >
              <View className="size-14 items-center justify-center overflow-hidden rounded-full bg-white/10">
                {preview ? (
                  <Image
                    source={{ uri: preview }}
                    className="size-full"
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons
                    name="person-outline"
                    size={24}
                    color={CINEMO_COLORS.textSecondary}
                  />
                )}
              </View>
              <View className="flex-1 gap-1">
                <Text className="font-semibold text-cinemo-gold-light">
                  {picking
                    ? "사진 보관함 여는 중…"
                    : preview
                      ? "사진 변경"
                      : "사진 추가"}
                </Text>
                <Text className="text-xs text-cinemo-muted">
                  사진 보관함에서 한 장 선택
                </Text>
              </View>
              {picking ? (
                <ActivityIndicator
                  size="small"
                  color={CINEMO_COLORS.accentLight}
                />
              ) : (
                <Ionicons
                  name="images-outline"
                  size={20}
                  color={CINEMO_COLORS.accentLight}
                />
              )}
            </Pressable>
            {preview && (
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={() => {
                  setPhoto(undefined);
                  setRemovePhoto(Boolean(user.profileImageUrl));
                  setPhotoError("");
                  save.reset();
                }}
                className="min-h-11 self-start justify-center px-2"
              >
                <Text className="text-sm text-cinemo-muted">
                  기본 프로필 사용
                </Text>
              </Pressable>
            )}
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
            <View className="flex-row gap-2">
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={() => setOpen(false)}
                className="min-h-11 flex-1 items-center justify-center rounded-xl border border-white/10"
              >
                <Text className="text-cinemo-muted">취소</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={
                  busy ||
                  nickname.trim().length < 2 ||
                  (!photo && !removePhoto && nickname.trim() === user.nickname)
                }
                onPress={() =>
                  save.mutate(
                    {
                      nickname: nickname.trim(),
                      removeImage: removePhoto,
                      photo,
                    },
                    { onSuccess: () => setOpen(false) },
                  )
                }
                className="min-h-11 flex-1 items-center justify-center rounded-xl bg-cinemo-gold disabled:opacity-40"
              >
                <Text className="font-semibold text-cinemo-bg">
                  {save.isPending ? "저장 중" : "저장"}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
