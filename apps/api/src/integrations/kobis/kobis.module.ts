import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";

import { KobisService } from "./kobis.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { KobisController } from "./kobis.controller";

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.getOrThrow<string>("kobis.baseUrl"),
        timeout: 10_000,
        maxRedirects: 3,
        params: {
          key: configService.getOrThrow<string>("kobis.apiKey"),
        },
      }),
    }),
  ],
  controllers: [KobisController],
  providers: [KobisService],
  exports: [KobisService],
})
export class KobisModule {}
