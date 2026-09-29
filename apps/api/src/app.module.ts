import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().uri({ scheme: ['postgresql', 'postgres'] }).required(),
        PORT: Joi.number().port().default(3050),
      }),
    }),
    PrismaModule,
  ],
})
export class AppModule {}
