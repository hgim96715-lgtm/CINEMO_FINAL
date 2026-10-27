import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { cinemaBatchEnvValidationSchema } from "@/config/cinema-batch-env.validation";
import { databaseConfig } from "@/config/database.config";
import { mapConfig } from "@/config/map.config";
import { MapModule } from "@/modules/map/map.module";
import { PrismaModule } from "@/prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [databaseConfig, mapConfig],
      validationSchema: cinemaBatchEnvValidationSchema,
      validationOptions: {
        convert: true,
        abortEarly: false,
        allowUnknown: true,
      },
    }),
    PrismaModule,
    MapModule,
  ],
})
export class CinemaBatchAppModule {}
