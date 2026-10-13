import {
  BadGatewayException,
  Inject,
  Injectable,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";

import { OPENAI_CLIENT } from "./openai.constants";

type SuggestQuoteInput = {
  movieTitle: string;
  review?: string;
  language?: string;
};

export type SuggestQuoteResult = {
  found: boolean;
  original: string | null;
  translation: string | null;
  sourceLanguage: string | null;
  targetLanguage: "ko";
  isAiSuggested: true;
};

type TranslateQuoteInput = {
  content: string;
  sourceLanguage: string;
  targetLanguage: string;
};

@Injectable()
export class OpenAiService {
  private readonly logger = new Logger(OpenAiService.name);

  constructor(
    @Inject(OPENAI_CLIENT)
    private readonly openai: OpenAI,
    private readonly configService: ConfigService,
  ) {}

  async suggestQuote({
    movieTitle,
    review,
    language,
  }: SuggestQuoteInput): Promise<SuggestQuoteResult> {
    const sourceLanguageInstruction = language?.trim()
      ? language
      : "영화의 대표 원문 언어를 자동으로 추론";

    const result = await this.createStructuredOutput<SuggestQuoteResult>({
      instructions:
        [
          "사용자가 영화에서 기억할 만한 문구를 궁금해하고 있다.",
          "영화에 실제로 등장한 것으로 확인되는 대표 문구 또는 대사만 반환한다.",
          "확인할 수 없는 경우 추측하거나 새 문장을 만들지 않는다.",
          "확인 가능한 문구가 없으면 found를 false로 반환하고 문구 관련 값은 null로 반환한다.",
          "원문과 자연스러운 한국어 번역을 함께 반환한다.",
          "원문 언어는 요청 언어가 없으면 영화 제목과 맥락을 기준으로 추론한다.",
        ].join(" "),
      input: [
        `영화 제목: ${movieTitle}`,
        `사용자 감상: ${review ?? "없음"}`,
        `원문 언어: ${sourceLanguageInstruction}`,
        "번역 언어: 한국어(ko)",
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

    if (
      !result.found ||
      !result.original ||
      !result.translation ||
      !result.sourceLanguage
    ) {
      throw new BadGatewayException(
        "확인 가능한 영화 문구를 찾지 못했습니다.",
      );
    }

    return result;
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
