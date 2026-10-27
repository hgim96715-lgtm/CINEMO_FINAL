import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { batchEnvValidationSchema } from "@/config/batch-env.validation";
import { databaseConfig } from "@/config/database.config";
import { kmdbConfig } from "@/config/kmdb.config";
import { kobisConfig } from "@/config/kobis.config";
import { tmdbConfig } from "@/config/tmdb.config";
import { MoviesModule } from "@/modules/movies/movies.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { mailConfig } from "@/config/mail.config";
import { appConfig } from "@/config/app.config";
import { MapModule } from "@/modules/map/map.module";
import { mapConfig } from "@/config/map.config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      ignoreEnvFile: true,
      load: [
        databaseConfig,
        kobisConfig,
        tmdbConfig,
        kmdbConfig,
        mailConfig,
        appConfig,
        mapConfig,
      ],
      validationSchema: batchEnvValidationSchema,
      validationOptions: {
        convert: true,
        abortEarly: false,
        allowUnknown: true,
      },
    }),
    PrismaModule,
    MoviesModule,
    MapModule,
  ],
})
export class BatchAppModule {}
