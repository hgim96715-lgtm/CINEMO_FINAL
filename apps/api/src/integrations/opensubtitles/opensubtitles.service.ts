import { HttpService } from "@nestjs/axios";
import { BadGatewayException, Injectable, Logger } from "@nestjs/common";
import { firstValueFrom } from "rxjs";

import type {
  OpenSubtitlesDownloadResponse,
  OpenSubtitlesDownloadRequest,
  OpenSubtitlesDownloadResult,
  OpenSubtitlesSearchOptions,
  OpenSubtitlesSearchResponse,
  OpenSubtitlesSubtitleContent,
  OpenSubtitlesSubtitleSearchResult,
} from "./opensubtitles.types";
import {
  toOpenSubtitlesDownloadResult,
  toOpenSubtitlesSubtitleSearchResult,
} from "./mappers/opensubtitles-response.mapper";
import { parseOpenSubtitlesContent } from "./parsers/opensubtitles-subtitle.parser";

@Injectable()
export class OpenSubtitlesService {
  private readonly logger = new Logger(OpenSubtitlesService.name);

  constructor(private readonly httpService: HttpService) {}

  async searchSubtitles(
    options: OpenSubtitlesSearchOptions = {},
  ): Promise<OpenSubtitlesSubtitleSearchResult> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<OpenSubtitlesSearchResponse>("/subtitles", {
          params: options,
        }),
      );

      return toOpenSubtitlesSubtitleSearchResult(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      this.logger.error(`OpenSubtitles 자막 검색 실패: ${message}`);
      throw new BadGatewayException("자막 검색에 실패했습니다.");
    }
  }

  async downloadSubtitle(
    request: OpenSubtitlesDownloadRequest,
    accessToken?: string,
  ): Promise<OpenSubtitlesDownloadResult> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post<OpenSubtitlesDownloadResponse>(
          "/download",
          request,
          {
            headers: accessToken
              ? { Authorization: `Bearer ${accessToken}` }
              : undefined,
          },
        ),
      );

      return toOpenSubtitlesDownloadResult(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      this.logger.error(`OpenSubtitles 자막 다운로드 링크 요청 실패: ${message}`);
      throw new BadGatewayException("자막 다운로드 링크를 가져오지 못했습니다.");
    }
  }

  async fetchSubtitleContent(
    download: OpenSubtitlesDownloadResult,
  ): Promise<OpenSubtitlesSubtitleContent> {
    const downloadUrl = this.validateDownloadUrl(download.url);

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<string>(downloadUrl, {
          responseType: "text",
          timeout: 15_000,
          maxContentLength: 2_000_000,
          maxBodyLength: 2_000_000,
        }),
      );

      return parseOpenSubtitlesContent(data, download.fileName);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      this.logger.error(`OpenSubtitles 자막 파일 읽기 실패: ${message}`);
      throw new BadGatewayException("자막 파일을 읽지 못했습니다.");
    }
  }

  private validateDownloadUrl(value: string): string {
    let url: URL;

    try {
      url = new URL(value);
    } catch {
      throw new BadGatewayException("유효하지 않은 자막 다운로드 URL입니다.");
    }

    const isOpenSubtitlesHost =
      url.protocol === "https:" &&
      (url.hostname === "opensubtitles.com" ||
        url.hostname.endsWith(".opensubtitles.com"));

    if (!isOpenSubtitlesHost) {
      throw new BadGatewayException("허용되지 않은 자막 다운로드 URL입니다.");
    }

    return url.toString();
  }
}
