import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { OpenSubtitlesService } from "./opensubtitles.service";

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.getOrThrow<string>(
          "opensubtitles.baseUrl",
        ),
        timeout: 10_000,
        maxRedirects: 3,
        headers: {
          Accept: "application/json",
          "Api-Key": configService.getOrThrow<string>(
            "opensubtitles.apiKey",
          ),
          "User-Agent": configService.getOrThrow<string>(
            "opensubtitles.userAgent",
          ),
        },
      }),
    }),
  ],
  providers: [OpenSubtitlesService],
  exports: [OpenSubtitlesService],
})
export class OpenSubtitlesModule {}
