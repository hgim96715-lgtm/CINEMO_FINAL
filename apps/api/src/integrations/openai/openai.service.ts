import {
  BadGatewayException,
  Inject,
  Injectable,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";

import type { PublicQuoteCandidate } from "@/modules/postcards/repositories/postcard.repository";
import type { OpenSubtitlesSubtitleCue } from "@/integrations/opensubtitles/opensubtitles.types";
import { OPENAI_CLIENT } from "./openai.constants";

type SuggestQuoteInput = {
  movieId?: string;
  movieTitle: string;
  review?: string;
  language?: string;
  candidates: PublicQuoteCandidate[];
};

type QuoteModelResult = {
  found: boolean;
  original: string | null;
  translation: string | null;
  sourceLanguage: string | null;
  targetLanguage: "ko";
  isAiSuggested: true;
};

type SubtitleQuoteModelResult = {
  found: boolean;
  startCue: number | null;
  endCue: number | null;
  memorabilityScore: number;
  translation: string | null;
  sourceLanguage: string | null;
  targetLanguage: "ko";
  isAiSuggested: true;
};

export type SuggestQuoteResult = QuoteModelResult & {
  quoteSource: "USER" | "OPENSUBTITLES";
};

type TranslateQuoteInput = {
  content: string;
  sourceLanguage: string;
  targetLanguage: string;
};

type SuggestSubtitleQuoteInput = {
  movieTitle: string;
  review?: string;
  language?: string;
  subtitles: OpenSubtitlesSubtitleCue[];
  publicQuoteCandidates?: PublicQuoteCandidate[];
};

const MAX_SUBTITLE_CUES = 900;
const MAX_QUOTE_CUES = 4;
const MAX_QUOTE_CHARACTERS = 600;

const SPEAKER_LABEL_PATTERN =
  /^\s*[（(][^（）()\r\n]{1,24}[）)]\s*/u;
const DIALOGUE_LABEL_PATTERN =
  /^\s*[\p{L}\p{N}·ー-]{1,24}\s*[:：]\s*/u;
const SHORT_REACTION_PATTERN =
  /^\s*(?:え+|あ+|お+|うん|えっ|え!?|어+|아+|응|네|뭐야|뭐지)[!?！？。…~～]*\s*$/iu;

@Injectable()
export class OpenAiService {
  private readonly logger = new Logger(OpenAiService.name);

  constructor(
    @Inject(OPENAI_CLIENT)
    private readonly openai: OpenAI,
    private readonly configService: ConfigService,
  ) {}

  async suggestQuote({
    movieId,
    movieTitle,
    review,
    language,
    candidates,
  }: SuggestQuoteInput): Promise<SuggestQuoteResult> {
    if (!candidates.length) {
      throw new BadGatewayException(
        "이 영화에 공개된 인용구가 아직 없습니다.",
      );
    }

    const sourceLanguageInstruction = language?.trim()
      ? language
      : "영화의 대표 원문 언어를 자동으로 추론";

    const result = await this.createStructuredOutput<QuoteModelResult>({
      instructions:
        [
          "사용자가 영화에서 기억할 만한 문구를 궁금해하고 있다.",
          "아래 후보 중 하나의 원문을 정확히 그대로 선택한다.",
          "후보에 없는 문장을 새로 만들거나 원문을 수정하지 않는다.",
          "원문과 자연스러운 한국어 번역을 함께 반환한다.",
          "원문 언어는 요청 언어가 없으면 영화 제목과 맥락을 기준으로 추론한다.",
        ].join(" "),
      input: [
        `영화 제목: ${movieTitle}`,
        `영화 ID: ${movieId ?? "없음"}`,
        `사용자 감상: ${review ?? "없음"}`,
        `원문 언어: ${sourceLanguageInstruction}`,
        "번역 언어: 한국어(ko)",
        "공개 인용구 후보:",
        candidates
          .map((candidate, index) => `${index + 1}. ${candidate.content}`)
          .join("\n"),
      ].join("\n"),
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          found: { type: "boolean" },
          original: { type: ["string", "null"] },
          translation: { type: ["string", "null"] },
          sourceLanguage: { type: ["string", "null"] },
          targetLanguage: { type: "string", enum: ["ko"] },
          isAiSuggested: { type: "boolean", enum: [true] },
        },
        required: [
          "found",
          "original",
          "translation",
          "sourceLanguage",
          "targetLanguage",
          "isAiSuggested",
        ],
      },
    });

    const selectedCandidate = candidates.find(
      (candidate) => candidate.content.trim() === result.original?.trim(),
    );

    if (
      !result.found ||
      !result.original ||
      !result.translation ||
      !result.sourceLanguage ||
      !selectedCandidate
    ) {
      throw new BadGatewayException(
        "후보에서 확인 가능한 영화 문구를 찾지 못했습니다.",
      );
    }

    return {
      ...result,
      quoteSource: selectedCandidate.quoteSource ?? "USER",
    };
  }

  async translateQuote({
    content,
    sourceLanguage,
    targetLanguage,
  }: TranslateQuoteInput): Promise<string> {
    return this.createPlainText({
      instructions:
        "입력된 원문의 의미와 분위기를 유지해서 번역한다. 설명 없이 번역문만 반환한다.",
      input: [
        `원문 언어: ${sourceLanguage}`,
        `번역 언어: ${targetLanguage}`,
        `원문: ${content}`,
      ].join("\n"),
    });
  }

  async suggestQuoteFromSubtitles({
    movieTitle,
    review,
    language,
    subtitles,
    publicQuoteCandidates = [],
  }: SuggestSubtitleQuoteInput): Promise<SuggestQuoteResult> {
    if (subtitles.length === 0) {
      throw new BadGatewayException("확인할 자막 문장이 없습니다.");
    }

    const sourceLanguageInstruction = language?.trim()
      ? language
      : "자막 문장의 언어를 자동으로 추론";
    const availableSubtitles = subtitles.slice(0, MAX_SUBTITLE_CUES);
    const subtitleItems = availableSubtitles
      .map(
        (subtitle, index) =>
          `[${index + 1}] ${subtitle.startTime} → ${subtitle.endTime}: ${subtitle.text}`,
      )
      .join("\n");

    const result = await this.createStructuredOutput<SubtitleQuoteModelResult>({
      instructions:
        [
          "사용자가 영화의 명대사를 찾고 있다.",
          "목표는 자막에서 아무 대사나 고르는 것이 아니라, 영화의 명장면이나 주제를 대표하고 영화 밖에서도 독립적으로 기억될 수 있는 문구를 고르는 것이다.",
          "영화 제목에 대한 GPT의 일반적인 지식과 아래 공개 인용구 후보를 명대사 여부를 판단하는 참고 정보로 사용할 수 있다.",
          "단, GPT의 기억이나 공개 후보를 그대로 원문으로 출력하지 않는다. 최종 원문은 반드시 아래 자막 목록의 연속된 자막 구간이어야 한다.",
          "아래 자막 목록에서 명대사로 판단되는 하나의 연속된 대사 구간만 선택한다.",
          `startCue와 endCue로 최대 ${MAX_QUOTE_CUES}개의 인접한 자막 구간을 지정한다.`,
          "다음 기준을 모두 충족하는 후보를 우선한다: (1) 한 장면의 핵심 감정·가치관·갈등·결심이 드러남, (2) 앞뒤 설명 없이도 의미가 통함, (3) 영화의 주제나 인물을 대표함, (4) 관객이 따로 기억하거나 인용할 만한 표현임.",
          "특히 영화의 주제를 압축한 철학적 선언, 인물의 독백, 기도문·의식문, 삶·죽음·성장·이별·구원에 대한 문장, 작품 전체에서 반복되는 핵심 모티프를 우선한다.",
          "일상적인 정보 전달, 줄거리 설명, 인물 소개, 상황 확인, 장면 진행을 위한 대화는 명대사로 보지 않는다.",
          "단답형, 감탄사, 호칭, 단순한 질문, 저기요·응 같은 짧은 반응은 원칙적으로 제외한다.",
          "화자 이름 표기, 괄호 속 화자 표기, 대본식 콜론 표기, 행동 지시나 장면 진행을 위한 명령이 포함된 구간은 제외한다.",
          "여러 화자가 번갈아 말하는 짧은 대화 조각은 제외한다. 한 사람이 말하는 완결된 명대사 구간을 우선한다.",
          "다만 짧은 문장이라도 영화 전체에서 반복되는 핵심 모티프이거나 결말·이별·재회처럼 장면의 의미를 대표하는 경우에는 주변 자막과 함께 판단해 선택할 수 있다.",
          "질문과 답변이 오가는 소개형 대화, 자막에 흔한 인사말, 평범한 작별 인사만으로 이루어진 구간은 선택하지 않는다.",
          "앞뒤 자막을 보지 않으면 의미가 성립하지 않는 문장, 대명사만 남은 문장, 장면 설명에 가까운 문장은 제외한다.",
          "명장면, 클라이맥스, 캐릭터의 철학·가치관·감정 변화·결정적 행동이 드러나는 대사를 가장 우선한다.",
          "다른 인물에게 무엇을 하라고 지시하는 명령, 문을 열거나 닫는 등 장면의 행동을 진행하는 대사, 바로 앞 상황에 대한 반응은 명대사보다 장면 대사로 판단한다.",
          "명대사로 볼 근거가 약한 평범한 자막밖에 없으면 길이를 억지로 늘리거나 창작하지 말고 found를 false로 반환한다.",
          "memorabilityScore는 명대사로서의 완결성·주제 대표성·독립성·임팩트를 합산한 0~100 점수이다. 네 항목 중 하나라도 약하면 점수를 낮춘다.",
          "memorabilityScore가 75 미만이면 found를 false로 반환한다.",
          "자막 목록에 없는 문장을 만들거나 자막 순서를 바꾸지 않는다.",
          "선택한 구간의 원문은 서버가 자막에서 직접 조합하므로 원문을 반환하지 않는다.",
          "한국어 번역은 원문의 의미와 문장 순서를 최대한 유지하는 직역으로 작성한다.",
          "한국어 번역은 웹 화면과 동일하게 자연스러운 존댓말 해요체를 사용하고, 반말이나 하오체로 바꾸지 않는다.",
          "확실한 문장을 선택할 수 없으면 found를 false로 반환한다.",
        ].join(" "),
      input: [
        `영화 제목: ${movieTitle}`,
        `사용자 감상: ${review ?? "없음"}`,
        `원문 언어: ${sourceLanguageInstruction}`,
        "번역 언어: 한국어(ko)",
        "자막 목록:",
        subtitleItems,
        ...(publicQuoteCandidates.length > 0
          ? [
              "사람들이 공개한 인용구 후보(명대사 판단용 참고):",
              publicQuoteCandidates
                .map((candidate, index) => `${index + 1}. ${candidate.content}`)
                .join("\n"),
            ]
          : []),
      ].join("\n"),
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          found: { type: "boolean" },
          startCue: { type: ["integer", "null"] },
          endCue: { type: ["integer", "null"] },
          memorabilityScore: { type: "integer", minimum: 0, maximum: 100 },
          translation: { type: ["string", "null"] },
          sourceLanguage: { type: ["string", "null"] },
          targetLanguage: { type: "string", enum: ["ko"] },
          isAiSuggested: { type: "boolean", enum: [true] },
        },
        required: [
          "found",
          "startCue",
          "endCue",
          "memorabilityScore",
          "translation",
          "sourceLanguage",
          "targetLanguage",
          "isAiSuggested",
        ],
      },
    });

    const startCue = result.startCue ?? 0;
    const endCue = result.endCue ?? 0;
    const selectedSubtitles =
      startCue > 0 &&
      endCue >= startCue &&
      endCue - startCue + 1 <= MAX_QUOTE_CUES
        ? availableSubtitles.slice(startCue - 1, endCue)
        : [];
    const original = selectedSubtitles
      .map((subtitle) => subtitle.text.trim())
      .filter(Boolean)
      .join(" ");
    const containsSpeakerLabel = selectedSubtitles.some(
      (subtitle) =>
        SPEAKER_LABEL_PATTERN.test(subtitle.text) ||
        DIALOGUE_LABEL_PATTERN.test(subtitle.text),
    );
    const containsShortReaction = selectedSubtitles.some((subtitle) =>
      SHORT_REACTION_PATTERN.test(subtitle.text),
    );

    if (
      !result.found ||
      result.memorabilityScore < 75 ||
      containsSpeakerLabel ||
      containsShortReaction ||
      !original ||
      original.length > MAX_QUOTE_CHARACTERS ||
      !result.translation ||
      !result.sourceLanguage ||
      selectedSubtitles.length === 0
    ) {
      throw new BadGatewayException(
        "명대사로 판단할 수 있는 자막 문구를 찾지 못했습니다.",
      );
    }

    return {
      found: true,
      original,
      translation: result.translation,
      sourceLanguage: result.sourceLanguage,
      targetLanguage: "ko",
      isAiSuggested: true,
      quoteSource: "OPENSUBTITLES",
    };
  }

  private async createPlainText({
    instructions,
    input,
  }: {
    instructions: string;
    input: string;
  }): Promise<string> {
    let text: string;

    try {
      const response = await this.openai.responses.create({
        model: this.configService.getOrThrow<string>("openai.model"),
        instructions,
        input,
      });

      text = response.output_text.trim();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      this.logger.error(
        `OpenAI 일반 텍스트 응답 요청 실패: ${message}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new BadGatewayException("AI 응답을 불러오지 못했습니다.");
    }

    if (!text) {
      throw new BadGatewayException("AI 응답이 비어 있습니다.");
    }

    return text;
  }

  private async createStructuredOutput<T>({
    instructions,
    input,
    schema,
  }: {
    instructions: string;
    input: string;
    schema: Record<string, unknown>;
  }): Promise<T> {
    let text: string;

    try {
      const response = await this.openai.responses.create({
        model: this.configService.getOrThrow<string>("openai.model"),
        instructions,
        input,
        text: {
          format: {
            type: "json_schema",
            name: "postcard_quote_suggestion",
            strict: true,
            schema,
          },
        },
      });

      text = response.output_text.trim();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      this.logger.error(
        `OpenAI 구조화 응답 요청 실패: ${message}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new BadGatewayException("AI 응답을 불러오지 못했습니다.");
    }

    if (!text) {
      throw new BadGatewayException("AI 응답이 비어 있습니다.");
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      throw new BadGatewayException("AI 응답 형식이 올바르지 않습니다.");
    }
  }
}
