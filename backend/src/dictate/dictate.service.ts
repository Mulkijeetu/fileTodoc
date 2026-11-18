import {
  BadRequestException,
  Injectable,
  MessageEvent,
  OnModuleDestroy,
} from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

const TEXT_FIELDS = new Set([
  'studentName',
  'address',
  'course',
  'section',
  'grade',
  'sourceFileName',
]);

@Injectable()
export class DictateService implements OnModuleDestroy {
  private readonly clients = new Set<Subject<MessageEvent>>();
  private focusedField: string | null = null;
  private readonly heartbeat = setInterval(() => {
    for (const client of this.clients) {
      client.next({ comment: 'ping' });
    }
  }, 15000);

  connect(): Observable<MessageEvent> {
    const client = new Subject<MessageEvent>();
    this.clients.add(client);
    return new Observable((subscriber) => {
      const subscription = client.subscribe(subscriber);
      return () => {
        subscription.unsubscribe();
        this.clients.delete(client);
        if (this.clients.size === 0) this.focusedField = null;
      };
    });
  }

  setFocus(field: unknown) {
    if (field === null || field === '') {
      this.focusedField = null;
      return;
    }
    if (typeof field !== 'string' || !TEXT_FIELDS.has(field)) {
      throw new BadRequestException('That box cannot be typed into from the phone.');
    }
    this.focusedField = field;
  }

  send(text: unknown) {
    if (typeof text !== 'string' || !text.trim()) {
      throw new BadRequestException('Say something before sending.');
    }
    if (this.clients.size === 0) {
      throw new BadRequestException('Open the student form on the desktop first.');
    }
    if (!this.focusedField) {
      throw new BadRequestException('Click a text box on the desktop first.');
    }

    const payload = {
      kind: 'text',
      field: this.focusedField,
      text: text.trim().slice(0, 2000),
    };
    for (const client of this.clients) {
      client.next({ data: payload });
    }
    return { ok: true };
  }

  onModuleDestroy() {
    clearInterval(this.heartbeat);
  }
}
