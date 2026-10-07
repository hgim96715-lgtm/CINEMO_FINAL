import { Logger, ValidationPipe, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";

import { AppModule } from "@/app.module";
import { AllExceptionsFilter } from "@/common/filters/all-exceptions.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger("Bootstrap");

  app.use(cookieParser());
  app.getHttpAdapter().getInstance().set("trust proxy", 1);

  const configService = app.get(ConfigService);
  const port = configService.getOrThrow<number>("app.port");
  const frontendUrl = configService.getOrThrow<string>("app.frontendUrl");

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
  });

  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle("CINEMO API")
    .setDescription("CINEMO 영화·사용자 API")
    .setVersion("1.0")
    .addCookieAuth("cinemo_session")
    .build();

  const documentFactory = () =>
    SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup("api", app, documentFactory);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  //   await app.listen(port);
  await app.listen(port, "0.0.0.0");
  logger.log(`🚀 http://localhost:${port}/v1`);
}

void bootstrap();
