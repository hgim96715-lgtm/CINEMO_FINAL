import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { BadGatewayException, Injectable, Logger } from "@nestjs/common";
import { firstValueFrom } from "rxjs";

import { parseOpenSubtitlesContent } from "@/integrations/opensubtitles/parsers/opensubtitles-subtitle.parser";
import type { OpenSubtitlesSubtitleContent } from "@/integrations/opensubtitles/opensubtitles.types";

import type {
  SubdlSearchOptions,
  SubdlSearchResponse,
  SubdlSubtitleFile,
} from "./subdl.types";
import {
  isSameSubtitleLanguage,
  normalizeSubtitleLanguage,
} from "@/integrations/subtitles/subtitle-language";

const SUBDL_DOWNLOAD_HOST = "https://dl.subdl.com";

@Injectable()
export class SubdlService {
  private readonly logger = new Logger(SubdlService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async searchSubtitles(
    options: SubdlSearchOptions = {},
  ): Promise<SubdlSearchResponse | null> {
    const apiKey = this.configService.get<string>("subdl.apiKey");

    if (!apiKey) {
      return null;
    }

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<SubdlSearchResponse>("/subtitles", {
          params: {
            api_key: apiKey,
            client: "custom_integration",
            subs_per_page: 30,
            unpack: 1,
            ...options,
          },
        }),
      );

      return data.status === false ? null : data;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      this.logger.warn(`SubDL 자막 검색 실패: ${message}`);
      return null;
    }
  }

  async fetchSubtitleContent(
    file: SubdlSubtitleFile,
  ): Promise<OpenSubtitlesSubtitleContent | null> {
    if (!file.url) {
      return null;
    }

    const downloadUrl = this.validateDownloadUrl(file.url);

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<string>(downloadUrl, {
          responseType: "text",
          timeout: 15_000,
          maxContentLength: 2_000_000,
          maxBodyLength: 2_000_000,
          transformResponse: [(value: string) => value],
        }),
      );

      return parseOpenSubtitlesContent(
        data,
        file.name ?? "subdl-subtitle.srt",
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      this.logger.warn(`SubDL 자막 파일 읽기 실패: ${message}`);
      return null;
    }
  }

  async searchAndFetchSubtitle({
    movieTitle,
    tmdbId,
    language,
  }: {
    movieTitle: string;
    tmdbId: number | null;
    language: string | null;
  }): Promise<OpenSubtitlesSubtitleContent | null> {
    const preferredLanguage = normalizeSubtitleLanguage(language);
    const languages = [preferredLanguage, "en", "ko", "ja"]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.toUpperCase())
      .filter((value, index, values) => values.indexOf(value) === index)
      .join(",");

    const searchOptions: SubdlSearchOptions = {
      ...(tmdbId ? { tmdb_id: tmdbId } : { film_name: movieTitle.trim() }),
      type: "movie",
      languages,
    };

    const response = await this.searchSubtitles(searchOptions);

    if (!response?.subtitles?.length) {
      return null;
    }

    const files = response.subtitles.flatMap((subtitle) =>
      (subtitle.unpack_files ?? []).map((file) => ({
        ...file,
        release_name: file.release_name ?? subtitle.release_name,
      })),
    );

    const selectedFile = preferredLanguage
      ? files.find(
          (file) =>
            isSameSubtitleLanguage(file.language, preferredLanguage) &&
            this.isSupportedTextFormat(file),
        )
      : files.find((file) => this.isSupportedTextFormat(file));

    return selectedFile ? this.fetchSubtitleContent(selectedFile) : null;
  }

  private isSupportedTextFormat(file: SubdlSubtitleFile): boolean {
    const format = file.format?.toLowerCase();
    const name = file.name?.toLowerCase() ?? "";

    return (
      format === "srt" ||
      format === "vtt" ||
      name.endsWith(".srt") ||
      name.endsWith(".vtt")
    );
  }

  private validateDownloadUrl(value: string): string {
    let url: URL;

    try {
      url = new URL(value, SUBDL_DOWNLOAD_HOST);
    } catch {
      throw new BadGatewayException("유효하지 않은 SubDL 자막 URL입니다.");
    }

    if (
      url.protocol !== "https:" ||
      (url.hostname !== "dl.subdl.com" &&
        !url.hostname.endsWith(".subdl.com"))
    ) {
      throw new BadGatewayException("허용되지 않은 SubDL 자막 URL입니다.");
    }

    return url.toString();
  }
}
