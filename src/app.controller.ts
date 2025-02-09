import { AppService } from './app.service';
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express'; // Use Express types
import { map } from 'rxjs/operators';

@Controller('gateway')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('*')
  async proxyGet(@Req() req: Request, @Res() res: Response) {
    return this.proxyRequest('get', req, res);
  }

  @Post('*')
  async proxyPost(@Req() req: Request, @Res() res: Response) {
    return this.proxyRequest('post', req, res);
  }

  @Put('*')
  async proxyPut(@Req() req: Request, @Res() res: Response) {
    return this.proxyRequest('put', req, res);
  }

  @Patch('*')
  async proxyPatch(@Req() req: Request, @Res() res: Response) {
    return this.proxyRequest('patch', req, res);
  }

  @Delete('*')
  async proxyDelete(@Req() req: Request, @Res() res: Response) {
    return this.proxyRequest('delete', req, res);
  }

  private async proxyRequest(
    method: string,
    req: Request,
    res: Response,
  ): Promise<void> {
    const url = req.originalUrl.replace('/gateway', ''); // Use Express's `originalUrl`
    const body = method === 'get' ? undefined : req.body;
    const headers = req.headers;

    this.appService
      .proxyRequest(method, url, body, headers)
      .pipe(map((response) => response.data))
      .subscribe({
        next: (data) => res.status(200).send(data), // Use Express's `status` method
        error: (err) => {
          res.status(err.response?.status || 500).send(err.response?.data); // Use Express's `status` method
        },
      });
  }
}
