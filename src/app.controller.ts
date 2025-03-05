import { Controller, Post, Body, Req, Headers } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ClientProxy } from '@nestjs/microservices';
import { MicroserviceRequest } from './types/request.interface';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { ModuleRef } from '@nestjs/core';
import { ServiceConfig } from './config/configuration';

@Controller()
export class AppController {
  private serviceClients: Map<string, ClientProxy> = new Map();

  constructor(
    private configService: ConfigService,
    private moduleRef: ModuleRef,
  ) {
    this.initializeServiceClients();
  }

  private initializeServiceClients() {
    const services =
      this.configService.get<ServiceConfig[]>('gateway.services') || [];

    if (!Array.isArray(services)) {
      throw new Error('Invalid services configuration');
    }

    services.forEach((service) => {
      const token = `${service.name.toUpperCase()}_SERVICE`;
      try {
        const client = this.moduleRef.get<ClientProxy>(token, {
          strict: false,
        });
        if (client) {
          this.serviceClients.set(service.name, client);
        }
      } catch (error) {
        console.error(
          `Client initialization failed for ${service.name}:`,
          error,
        );
      }
    });
  }

  @Post('api')
  async routeRequest(
    @Body() request: MicroserviceRequest,
    @Headers('authorization') authorization: string, // Extract Authorization header
  ) {
    if (!this.serviceClients.has(request.service)) {
      throw new Error(`Service ${request.service} not available`);
    }

    const client = this.serviceClients.get(request.service);
    if (!client) {
      throw new Error(`Service client ${request.service} not available`);
    }

    // Forward the Bearer token to the downstream service
    const headers = {
      authorization, // Include the Bearer token
    };

    return await lastValueFrom(
      client.send(request.pattern, {
        data: request.data,
        headers, // Pass headers to the downstream service
      }),
    );
  }

  @MessagePattern({ cmd: 'health' })
  healthCheck() {
    return {
      status: 'ok',
      services: Array.from(this.serviceClients.keys()),
      timestamp: new Date().toISOString(),
    };
  }
}
