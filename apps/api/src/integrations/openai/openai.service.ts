import { BadGatewayException, Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";

import { OPENAI_CLIENT } from "./openai.constants";

type SuggestQuoteInput = {
  movieTitle: string;
  review?: string;
  language?: string;
};

export type SuggestQuoteResult = {
  original: string;
  translation: string;
  sourceLanguage: string;
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
  constructor(
    @Inject(OPENAI_CLIENT)
    private readonly openai: OpenAI,
    private readonly configService: ConfigService,
  ) {}

  async suggestQuote({
    movieTitle,
    review,
    language = "ko",
  }: SuggestQuoteInput): Promise<SuggestQuoteResult> {
    return this.createStructuredOutput<SuggestQuoteResult>({
      instructions:
        [
          "실제 영화 대사를 그대로 인용하지 않는다.",
          "영화에서 영감을 받은 새로운 창작 문장 1개를 만든다.",
          "원문과 자연스러운 한국어 번역을 함께 반환한다.",
          "원문 언어는 요청 언어가 없으면 영화 제목과 맥락을 기준으로 추론한다.",
        ].join(" "),
      input: [
        `영화 제목: ${movieTitle}`,
        `사용자 감상: ${review ?? "없음"}`,
        `원문 요청 언어: ${language}`,
      ].join("\n"),
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          original: { type: "string" },
          translation: { type: "string" },
          sourceLanguage: { type: "string" },
          targetLanguage: { type: "string", enum: ["ko"] },
          isAiSuggested: { type: "boolean", enum: [true] },
        },
        required: [
          "original",
          "translation",
          "sourceLanguage",
          "targetLanguage",
          "isAiSuggested",
        ],
      },
    });
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
    } catch {
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
    } catch {
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
