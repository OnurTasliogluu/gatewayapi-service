import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
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

  @Post()
  async routeRequest(@Body() request: MicroserviceRequest) {
    // Validate request
    if (!request.service || !request.pattern || !request.data) {
      throw new HttpException('Invalid request format', HttpStatus.BAD_REQUEST);
    }

    // Get client with null check
    const client = this.serviceClients.get(request.service);
    if (!client) {
      throw new HttpException(
        `Service ${request.service} not available`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    try {
      return await lastValueFrom(client.send(request.pattern, request.data));
    } catch (error) {
      throw new HttpException(
        error.message || 'Service request failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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
