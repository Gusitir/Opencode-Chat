import { info } from '../utils/logger';

export class OpenCodeError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'OpenCodeError';
  }
}

export class OpenCodeClient {
  constructor(private baseUrl: string, private password: string) {
    info(`OpenCodeClient initialized: ${baseUrl}`);
  }

  async createSession(): Promise<string> {
    try {
      const response = await this.post('/session', {});
      const sessionId = (response as any).id ?? (response as any).sessionId;
      if (!sessionId) {
        throw new OpenCodeError('No session ID in response');
      }
      info(`Created session: ${sessionId}`);
      return sessionId;
    } catch (err) {
      throw this.wrapError(err, 'createSession');
    }
  }

  async sendPrompt(sessionId: string, text: string, model?: string): Promise<void> {
    try {
      const payload: Record<string, unknown> = {
        messages: [{ role: 'user', content: text }],
      };
      if (model) {
        payload.model = model;
      }
      await this.post(`/session/${sessionId}/message`, payload);
      info(`Prompt sent to session ${sessionId}`);
    } catch (err) {
      throw this.wrapError(err, 'sendPrompt');
    }
  }

  async listProviders(): Promise<Array<{ provider: string; model: string }>> {
    try {
      const response = await this.get('/config/providers');
      return (response as any).providers ?? [];
    } catch (err) {
      throw this.wrapError(err, 'listProviders');
    }
  }

  async findFiles(query: string): Promise<Array<{ path: string; name: string }>> {
    try {
      const url = new URL('/find/file', this.baseUrl);
      url.searchParams.set('query', query);
      const response = await this.get(url.pathname + url.search);
      return (response as any).results ?? [];
    } catch (err) {
      throw this.wrapError(err, 'findFiles');
    }
  }

  private async post(path: string, data: unknown): Promise<unknown> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new OpenCodeError(`HTTP ${response.status}`, 'http_error');
    }
    return response.json();
  }

  private async get(path: string): Promise<unknown> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers(),
    });
    if (!response.ok) {
      throw new OpenCodeError(`HTTP ${response.status}`, 'http_error');
    }
    return response.json();
  }

  private headers(): Record<string, string> {
    const auth = Buffer.from(`user:${this.password}`).toString('base64');
    return {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    };
  }

  private wrapError(err: unknown, context: string): OpenCodeError {
    if (err instanceof OpenCodeError) return err;
    const message = err instanceof Error ? err.message : String(err);
    return new OpenCodeError(`${context}: ${message}`, context);
  }
}
