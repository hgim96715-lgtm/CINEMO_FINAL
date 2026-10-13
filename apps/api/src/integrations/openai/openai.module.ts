import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import OpenAI from "openai";

import { OPENAI_CLIENT } from "./openai.constants";
import { OpenAiService } from "./openai.service";

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: OPENAI_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new OpenAI({
          apiKey: configService.getOrThrow<string>("openai.apiKey"),
        });
      },
    },
    OpenAiService,
  ],
  exports: [OPENAI_CLIENT, OpenAiService],
})
export class OpenAiModule {}
