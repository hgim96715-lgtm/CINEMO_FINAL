import { Module } from "@nestjs/common";

import { ConfigModule } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "@/prisma/prisma.module";
import { envValidationSchema } from "@/config/env.validation";
import { appConfig } from "@/config/app.config";
import { databaseConfig } from "@/config/database.config";
import { HealthModule } from "@/health/health.module";
import { MoviesModule } from "@/modules/movies/movies.module";
import { kobisConfig } from "@/config/kobis.config";
import { KobisModule } from "@/integrations/kobis/kobis.module";
import { tmdbConfig } from "./config/tmdb.config";
import { TmdbModule } from "./integrations/tmdb/tmdb.module";
import { kmdbConfig } from "./config/kmdb.config";
import { KmdbModule } from "./integrations/kmdb/kmdb.module";
import { AuthModule } from "./modules/auth/auth.module";
import { APP_GUARD } from "@nestjs/core";
import { SessionAuthGuard } from "./modules/auth/session-auth.guard";
import { mailConfig } from "./config/mail.config";
import { oauthConfig } from "./config/oauth.config";
import { mapConfig } from "@/config/map.config";
import { KakaoModule } from "@/integrations/kakao/kakao.module";
import { MapModule } from "@/modules/map/map.module";
import { PostcardsModule } from "@/modules/postcards/postcards.module";
import { openaiConfig } from "@/config/openai.config";
import { openSubtitlesConfig } from "@/config/opensubtitles.config";
import { subdlConfig } from "@/config/subdl.config";
import { OpenAiModule } from "@/integrations/openai/openai.module";
import { NotificationsModule } from "@/modules/notifications/notifications.module";

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: "default",
        ttl: 60_000,
        limit: 10,
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [
        appConfig,
        databaseConfig,
        kobisConfig,
        tmdbConfig,
        kmdbConfig,
        mailConfig,
        oauthConfig,
        mapConfig,
        openaiConfig,
        openSubtitlesConfig,
        subdlConfig,
      ],
      validationSchema: envValidationSchema,
      validationOptions: {
        convert: true,
        abortEarly: false,
        allowUnknown: true,
      },
    }),
    PrismaModule,
    HealthModule,
    MoviesModule,
    KobisModule,
    TmdbModule,
    KmdbModule,
    AuthModule,
    KakaoModule,
    MapModule,
    PostcardsModule,
    OpenAiModule,
    NotificationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: SessionAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
