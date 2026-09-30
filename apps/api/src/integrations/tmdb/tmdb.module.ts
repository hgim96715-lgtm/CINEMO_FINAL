import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { TmdbController } from "./tmdb.controller";
import { TmdbService } from "./tmdb.service";

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.getOrThrow<string>("tmdb.baseUrl"),
        timeout: 10_000,
        maxRedirects: 3,
        headers: {
          Authorization: `Bearer ${configService.getOrThrow<string>(
            "tmdb.accessToken",
          )}`,
          Accept: "application/json",
        },
      }),
    }),
  ],
  controllers: [TmdbController],
  providers: [TmdbService],
  exports: [TmdbService],
})
export class TmdbModule {}
