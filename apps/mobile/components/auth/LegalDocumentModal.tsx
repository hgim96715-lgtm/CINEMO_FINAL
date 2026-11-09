import { CINEMO_LEGAL_DOCUMENTS, type CinemoLegalDocument } from "@cinemo/shared";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export function LegalDocumentModal({ document, onClose }: {
  document: CinemoLegalDocument | null;
  onClose: () => void;
}) {
  if (!document) return null;
  const { title, sections } = CINEMO_LEGAL_DOCUMENTS[document];

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaProvider style={{ flex: 1 }}>
        <SafeAreaView className="flex-1 bg-cinemo-bg">
          <View className="flex-row items-center justify-between gap-4 border-b border-white/10 px-5 py-3">
            <Text accessibilityRole="header" className="flex-1 text-xl font-bold text-cinemo-text">{title}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="문서 닫기" onPress={onClose} className="px-3 py-2">
              <Text className="text-2xl text-cinemo-muted">×</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerClassName="gap-6 px-5 py-6">
            <Text className="text-sm text-cinemo-muted">CINEMO</Text>
            {sections.map((section) => (
              <View key={section.title} className="gap-2">
                <Text accessibilityRole="header" className="text-base font-bold text-cinemo-text">{section.title}</Text>
                <Text className="text-sm leading-6 text-cinemo-muted">{section.body}</Text>
              </View>
            ))}
            <Text className="text-sm text-cinemo-muted">운영자 gong (CINEMO) · 대한민국 · hello_cinemo@icloud.com</Text>
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}
