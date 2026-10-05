import { Module } from "@nestjs/common";

import { ConfigModule } from "@nestjs/config";

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

@Module({
  imports: [
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
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: SessionAuthGuard,
    },
  ],
})
export class AppModule {}
