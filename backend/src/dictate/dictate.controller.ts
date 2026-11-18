import { Body, Controller, MessageEvent, Post, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { DictateService } from './dictate.service';

@Controller('dictate')
export class DictateController {
  constructor(private readonly dictate: DictateService) {}

  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return this.dictate.connect();
  }

  @Post('focus')
  focus(@Body() body: { field?: unknown }) {
    this.dictate.setFocus(body?.field ?? null);
    return { ok: true };
  }

  @Post()
  send(@Body() body: { text?: unknown }) {
    return this.dictate.send(body?.text);
  }
}
