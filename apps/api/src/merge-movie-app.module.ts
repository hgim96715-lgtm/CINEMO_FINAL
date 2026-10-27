import {Module} from "@nestjs/common";
import {ConfigModule} from "@nestjs/config";
import * as Joi from "joi";

import {databaseConfig} from "@/config/database.config";
import {EnvKeys} from "@/config/env-keys";
import {PrismaModule} from "@/prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      ignoreEnvFile: true,
      load: [databaseConfig],
      validationSchema: Joi.object({
        [EnvKeys.DATABASE_URL]: Joi.string()
          .uri({scheme: ["postgresql", "postgres"]})
          .required(),
      }),
      validationOptions: {
        convert: true,
        abortEarly: false,
        allowUnknown: true,
      },
    }),
    PrismaModule,
  ],
})
export class MergeMovieAppModule {}
