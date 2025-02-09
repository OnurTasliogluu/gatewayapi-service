import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { Observable } from 'rxjs';

@Injectable()
export class AppService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  proxyRequest(
    method: string,
    url: string,
    body?: any,
    headers?: any,
  ): Observable<AxiosResponse> {
    const targetUrl = `${this.configService.get<string>(
      'TARGET_SERVICE_URL',
    )}${url}`;
    switch (method.toLowerCase()) {
      case 'get':
        return this.httpService.get(targetUrl, { headers });
      case 'post':
        return this.httpService.post(targetUrl, body, { headers });
      case 'put':
        return this.httpService.put(targetUrl, body, { headers });
      case 'patch':
        return this.httpService.patch(targetUrl, body, { headers });
      case 'delete':
        return this.httpService.delete(targetUrl, { headers });
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
  }
}