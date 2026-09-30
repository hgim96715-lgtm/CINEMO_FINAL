// apps/api/src/integrations/kmdb/kmdb.module.ts

import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { KmdbService } from "./kmdb.service";
import { KmdbController } from "./kmdb.controller";

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.getOrThrow<string>("kmdb.baseUrl"),
        timeout: 10_000,
        maxRedirects: 3,
        params: {
          ServiceKey: configService.getOrThrow<string>("kmdb.apiKey"),
        },
      }),
    }),
  ],
  controllers: [KmdbController],
  providers: [KmdbService],
  exports: [KmdbService],
})
export class KmdbModule {}
