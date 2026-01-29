import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { validateEnvironment } from "./core/env-validator";

async function bootstrap() {
  validateEnvironment();

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 8000;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
  console.log(
    `CORS enabled for: ${process.env.FRONTEND_URL || "http://localhost:3000"}`,
  );
}

bootstrap();
