import { useEffect, useState } from "react";
import { Alert, Image, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CircleCheck, CircleX, Crown, HelpCircle, Sparkles, Ticket, Trophy } from "lucide-react-native";

import { CINEMO_COLORS } from "@cinemo/shared";
import { apiClient } from "@/lib/api/apiClient";

type QuizRound = {
  roundId: string;
  prompt: string;
  choices: string[];
  posterUrl: string | null;
  attemptsRemaining: number;
  status: "ACTIVE" | "CORRECT" | "FAILED";
  scoreAwarded: number;
  answer?: string;
};

type LeaderboardEntry = {
  rank: number;
  nickname: string;
  score: number;
  correctCount: number;
};

export default function QuizzesScreen() {
  const [round, setRound] = useState<QuizRound>();
  const [isLoading, setIsLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isRetryModalVisible, setIsRetryModalVisible] = useState(false);
  const [isResultModalVisible, setIsResultModalVisible] = useState(false);

  useEffect(() => {
    void apiClient
      .get<LeaderboardEntry[]>("/movie-quizzes/leaderboard/weekly")
      .then(({ data }) => setLeaderboard(data))
      .catch(() => undefined);
  }, []);

  async function startRound() {
    setIsRetryModalVisible(false);
    setIsResultModalVisible(false);
    setIsLoading(true);
    try {
      const { data } = await apiClient.get<QuizRound>("/movie-quizzes/next");
      setRound(data);
    } catch {
      Alert.alert("영화 퀴즈", "퀴즈를 시작하려면 로그인해 주세요.");
    } finally {
      setIsLoading(false);
    }
  }

  async function submitAnswer(choice: string) {
    if (!round) return;
    setIsLoading(true);
    try {
      const { data } = await apiClient.post<QuizRound>(`/movie-quizzes/rounds/${round.roundId}/answer`, { choice });
      setRound(data);
      if (data.status === "ACTIVE") {
        setIsRetryModalVisible(true);
      } else {
        setIsResultModalVisible(true);
      }
    } catch {
      Alert.alert("영화 퀴즈", "정답을 확인하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-cinemo-bg">
      <ScrollView className="flex-1" contentContainerClassName="px-5 py-8 pb-32">
        <View className="rounded-[28px] border border-cinemo-gold/30 bg-cinemo-surface p-6">
          <View className="flex-row items-center gap-2">
            <Sparkles size={16} color={CINEMO_COLORS.accentLight} />
            <Text className="text-xs font-semibold tracking-[3px] text-cinemo-gold">CINEMO QUIZ ROOM</Text>
          </View>
          <Text className="mt-5 text-3xl font-semibold text-cinemo-text">오늘은 어떤 영화를{`\n`}맞혀볼까요?</Text>
          <Text className="mt-3 leading-6 text-cinemo-muted">줄거리와 포스터 단서를 보고 영화 제목을 골라보세요. 첫 정답은 100점이며, 오답 1회당 40점이 차감돼요.</Text>
          <View className="mt-5 flex-row flex-wrap gap-2">
            <Text className="rounded-full bg-cinemo-bg px-3 py-2 text-xs text-cinemo-text">하루 한 번 기회</Text>
            <Text className="rounded-full bg-cinemo-bg px-3 py-2 text-xs text-cinemo-text">최대 2번 선택</Text>
            <Text className="rounded-full bg-cinemo-bg px-3 py-2 text-xs text-cinemo-text">오답 1회당 -40점</Text>
          </View>
        </View>

        <View className="mt-6 rounded-3xl border border-cinemo-border bg-cinemo-surface p-6">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold tracking-[3px] text-cinemo-gold">RANDOM QUIZ</Text>
            {round ? <Text className="text-sm text-cinemo-muted">남은 기회 {round.attemptsRemaining}회</Text> : null}
          </View>
          {!round ? (
            <View className="items-center py-10">
              <HelpCircle size={44} color={CINEMO_COLORS.accentLight} />
              <Text className="mt-4 text-xl font-semibold text-cinemo-text">랜덤 영화 퀴즈를 뽑아보세요</Text>
              <Text className="mt-2 text-center text-sm text-cinemo-muted">로그인하면 점수와 순위가 저장돼요.</Text>
              <Pressable onPress={startRound} disabled={isLoading} className="mt-6 rounded-xl bg-cinemo-gold px-5 py-4 disabled:opacity-60"><Text className="font-semibold text-cinemo-bg">{isLoading ? "퀴즈를 준비하는 중…" : "퀴즈 뽑기"}</Text></Pressable>
            </View>
          ) : (
            <>
              <View className="mt-7 flex-row gap-4">
                {round.posterUrl ? (
                  <View className="h-40 w-28 shrink-0 overflow-hidden rounded-2xl border border-cinemo-gold/25 bg-cinemo-bg">
                    <Image source={{ uri: round.posterUrl }} resizeMode="cover" blurRadius={1.5} className="h-full w-full scale-150 opacity-90" />
                    <View className="absolute inset-0 bg-cinemo-bg/35" />
                    <Text className="absolute bottom-2 left-2 rounded-full border border-cinemo-gold/40 bg-cinemo-bg px-2 py-1 text-[9px] font-semibold tracking-[1px] text-cinemo-gold-light">POSTER CLUE</Text>
                  </View>
                ) : null}
                <View className="flex-1">
                  <Text className="text-xs font-semibold tracking-[2px] text-cinemo-gold">STORY CLUE</Text>
                  <Text className="mt-3 text-lg leading-8 text-cinemo-text">{round.prompt}</Text>
                </View>
              </View>
              {round.status === "ACTIVE" ? (
                <View className="mt-7 gap-3">
                  {round.choices.map((choice, index) => (
                    <Pressable key={choice} onPress={() => void submitAnswer(choice)} disabled={isLoading} className="flex-row items-center gap-3 rounded-xl border border-cinemo-border bg-cinemo-bg px-4 py-4 disabled:opacity-60">
                      <Text className="flex size-7 items-center justify-center rounded-full border border-cinemo-gold/40 text-center text-xs font-semibold text-cinemo-gold-light">{index + 1}</Text>
                      <Text className="flex-1 font-medium text-cinemo-text">{choice}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View className="mt-7 items-center rounded-2xl border border-cinemo-gold/20 bg-cinemo-bg p-5">
                  <Text className="font-semibold text-cinemo-text">이번 퀴즈 결과를 확인했어요.</Text>
                  <Pressable onPress={() => setIsResultModalVisible(true)} className="mt-4"><Text className="text-sm font-medium text-cinemo-gold-light">결과 다시 보기</Text></Pressable>
                </View>
              )}
            </>
          )}
        </View>

        <View className="mt-6 rounded-3xl border border-cinemo-border bg-cinemo-surface p-6">
          <View className="flex-row items-center gap-2"><Trophy size={17} color={CINEMO_COLORS.accentLight} /><Text className="text-xs font-semibold tracking-[3px] text-cinemo-gold">THIS WEEK</Text></View>
          <Text className="mt-3 text-xl font-semibold text-cinemo-text">이번 주 퀴즈왕</Text>
          <View className="mt-5 gap-3">
            {leaderboard.length ? leaderboard.map((entry) => (
              <View key={`${entry.rank}-${entry.nickname}`} className="flex-row items-center rounded-xl bg-cinemo-bg px-3 py-3"><Text className="w-6 text-center font-semibold text-cinemo-gold">{entry.rank}</Text><Text className="flex-1 text-cinemo-text">{entry.nickname}</Text><Text className="text-xs text-cinemo-muted">{entry.score}점 · {entry.correctCount}정답</Text></View>
            )) : <Text className="rounded-xl bg-cinemo-bg px-3 py-4 text-sm text-cinemo-muted">이번 주 첫 퀴즈왕이 되어보세요.</Text>}
          </View>
          <View className="mt-5 flex-row items-center gap-2"><Crown size={16} color={CINEMO_COLORS.accentLight} /><Text className="text-xs text-cinemo-muted">순위는 매주 월요일에 새로 시작됩니다.</Text></View>
        </View>
      </ScrollView>

      <Modal
        transparent
        animationType="fade"
        visible={isRetryModalVisible}
        onRequestClose={() => setIsRetryModalVisible(false)}
      >
        <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: "rgba(0, 0, 0, 0.62)" }}>
          <View
            className="w-full max-w-md overflow-hidden rounded-[28px] border border-cinemo-gold/40 bg-cinemo-surface"
            style={{ elevation: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 18 }}
          >
            <View className="items-center px-7 pb-7 pt-8">
              <Text className="text-xs font-semibold tracking-[4px] text-cinemo-gold">TAKE 2</Text>
              <View className="mt-5 size-[72px] items-center justify-center rounded-[22px] border border-rose-100/15 bg-red-300/10">
                <CircleX size={35} color="#FDA4AF" strokeWidth={1.8} />
              </View>
              <Text className="mt-5 text-xl font-bold text-cinemo-text">아직 한 장면이 남았어요</Text>
              <Text className="mt-2 text-center text-sm leading-6 text-cinemo-muted">이번 선택은 정답이 아니에요.{"\n"}다음 선택으로 장면을 이어가 보세요.</Text>
              <View className="mt-6 w-full flex-row items-center justify-between rounded-2xl border border-cinemo-gold/20 bg-cinemo-bg px-4 py-3">
                <View className="flex-row items-center gap-2"><Ticket size={15} color={CINEMO_COLORS.accentLight} /><Text className="text-xs font-medium text-cinemo-gold-light">마지막 도전 티켓</Text></View>
                <View className="flex-row gap-1.5">
                  {[0, 1].map((attempt) => <View key={attempt} className={`size-2 rounded-full ${(round?.attemptsRemaining ?? 1) > attempt ? "bg-cinemo-gold" : "bg-cinemo-border"}`} />)}
                </View>
              </View>
              <Pressable onPress={() => setIsRetryModalVisible(false)} className="mt-6 w-full items-center rounded-2xl bg-cinemo-gold px-7 py-4">
                <View className="flex-row items-center gap-2"><Sparkles size={16} color={CINEMO_COLORS.background} /><Text className="text-base font-bold text-cinemo-bg">다시 도전하기</Text></View>
              </Pressable>
              <Pressable onPress={() => setIsRetryModalVisible(false)} className="mt-4"><Text className="text-xs text-cinemo-muted">퀴즈로 돌아가기</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={isResultModalVisible} onRequestClose={() => setIsResultModalVisible(false)}>
        <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: "rgba(0, 0, 0, 0.62)" }}>
          <View className="w-full max-w-md overflow-hidden rounded-[28px] border border-cinemo-gold/40 bg-cinemo-surface" style={{ elevation: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 18 }}>
            {round?.status === "CORRECT" ? (
              <View className="items-center px-7 pb-7 pt-8">
                <Text className="text-xs font-semibold tracking-[4px] text-cinemo-gold">CORRECT</Text>
                <View className="mt-5 size-[72px] items-center justify-center rounded-[22px] border border-cinemo-gold/30 bg-cinemo-gold/15"><CircleCheck size={36} color={CINEMO_COLORS.accentLight} strokeWidth={1.8} /></View>
                <Text className="mt-5 text-xl font-bold text-cinemo-text">축하해요, 정답이에요!</Text>
                <Text className="mt-2 text-center text-sm leading-6 text-cinemo-muted">이번 장면을 멋지게 맞혔어요.</Text>
                <Text className="mt-5 rounded-full border border-cinemo-gold/25 bg-cinemo-bg px-4 py-2 text-sm font-semibold text-cinemo-gold-light">+{round.scoreAwarded}점 획득</Text>
                <Pressable onPress={() => void startRound()} disabled={isLoading} className="mt-6 w-full items-center rounded-2xl bg-cinemo-gold px-7 py-4 disabled:opacity-60"><View className="flex-row items-center gap-2"><Sparkles size={16} color={CINEMO_COLORS.background} /><Text className="text-base font-bold text-cinemo-bg">다음 퀴즈</Text></View></Pressable>
              </View>
            ) : (
              <View className="items-center px-7 pb-7 pt-8">
                <Text className="text-xs font-semibold tracking-[4px] text-cinemo-gold">ANSWER REVEAL</Text>
                <View className="mt-5 size-[72px] items-center justify-center rounded-[22px] border border-cinemo-gold/25 bg-cinemo-gold/10"><Ticket size={32} color={CINEMO_COLORS.accentLight} /></View>
                <Text className="mt-5 text-sm font-medium text-cinemo-muted">이번 장면의 정답</Text>
                <Text className="mt-2 text-center text-xl font-bold text-cinemo-text">{round?.answer}</Text>
                <Text className="mt-4 text-center text-sm leading-6 text-cinemo-muted">두 번의 기회를 모두 사용했어요.{"\n"}오늘의 퀴즈는 여기까지예요.</Text>
                <Pressable onPress={() => setIsResultModalVisible(false)} className="mt-6 w-full items-center rounded-2xl border border-cinemo-gold/35 bg-cinemo-gold/10 px-7 py-4"><Text className="text-base font-bold text-cinemo-gold-light">오늘은 여기까지</Text></Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
