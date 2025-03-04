import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Hybrid application (HTTP + Microservices)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: configService.get('microservices.gatewayPort'),
    },
  });

  await app.startAllMicroservices();
  await app.listen(configService.get('microservices.gatewayPort') || 3000);
}
void bootstrap();
