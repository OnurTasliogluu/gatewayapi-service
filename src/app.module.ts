import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import configuration, { ServiceConfig } from './config/configuration';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    ClientsModule.registerAsync(
      (() => {
        const config = configuration();
        return config.services.map((service: ServiceConfig) => ({
          name: `${service.name.toUpperCase()}_SERVICE`,
          useFactory: () => ({
            transport: Transport.TCP,
            options: {
              host: service.host,
              port: service.port,
            },
          }),
        }));
      })(),
    ),
  ],
  controllers: [AppController],
})
export class AppModule {}
