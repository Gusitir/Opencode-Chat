import { EventEmitter } from 'events';
import { info, warn } from '../utils/logger';

export class EventStream extends EventEmitter {
  private controller: AbortController | null = null;
  private reconnectMs = 1000;
  private stopped = false;

  constructor(private baseUrl: string, private password: string) {
    super();
  }

  start(): void {
    this.stopped = false;
    void this.connect();
  }

  stop(): void {
    this.stopped = true;
    this.controller?.abort();
    this.controller = null;
  }

  private async connect(): Promise<void> {
    while (!this.stopped) {
      this.controller = new AbortController();
      try {
        const res = await fetch(`${this.baseUrl}/global/event`, {
          headers: {
            Authorization: `Basic ${Buffer.from(`opencode:${this.password}`).toString('base64')}`,
            Accept: 'text/event-stream',
          },
          signal: this.controller.signal,
        });
        if (!res.ok || !res.body) throw new Error(`SSE HTTP ${res.status}`);
        info('SSE connected');
        this.reconnectMs = 1000;
        await this.readStream(res.body);
      } catch (err) {
        if (this.stopped) return;
        warn(`SSE disconnected: ${(err as Error).message}`);
      }
      if (this.stopped) return;
      await new Promise((r) => setTimeout(r, this.reconnectMs));
      this.reconnectMs = Math.min(this.reconnectMs * 2, 30000);
    }
  }

  private async readStream(body: ReadableStream<Uint8Array>): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf('\n\n')) !== -1) {
        const raw = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        this.dispatch(raw);
      }
    }
  }

  private dispatch(raw: string): void {
    let eventName = 'message';
    const dataLines: string[] = [];
    for (const line of raw.split('\n')) {
      if (line.startsWith('event:')) eventName = line.slice(6).trim();
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
    }
    if (dataLines.length === 0) return;
    const data = dataLines.join('\n');
    try {
      this.emit(eventName, JSON.parse(data));
    } catch {
      this.emit(eventName, data);
    }
  }
}
