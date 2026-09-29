import { Module } from "@nestjs/common";

import { ConfigModule } from "@nestjs/config";
import * as Joi from "joi";

import { PrismaModule } from "./prisma/prisma.module";
import { envValidationSchema } from "./config/env.validation";
import { appConfig } from "./config/app.config";
import { databaseConfig } from "./config/database.config";
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig, databaseConfig],
      validationSchema: envValidationSchema,
      validationOptions: {
        convert: true,
        abortEarly: false,
        allowUnknown: true,
      },
    }),
    PrismaModule,
    HealthModule,
  ],
})
export class AppModule {}
