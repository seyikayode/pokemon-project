import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const clientUrl = configService.get<string>('CLIENT_URL');
  const port = configService.get<number>('PORT') || 3001;

  app.enableCors({
    origin: clientUrl,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(port);
  console.log(`Backend running on port ${port}`);
};
bootstrap();