import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { SubdlService } from "./subdl.service";

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.get<string>(
          "subdl.baseUrl",
          "https://api.subdl.com/api/v1",
        ),
        timeout: 10_000,
        maxRedirects: 3,
        headers: {
          Accept: "application/json",
        },
      }),
    }),
  ],
  providers: [SubdlService],
  exports: [SubdlService],
})
export class SubdlModule {}
