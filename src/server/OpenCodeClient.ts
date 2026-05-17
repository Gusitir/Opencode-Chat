import { info } from '../utils/logger';

export class OpenCodeError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'OpenCodeError';
  }
}

function isSessionResponse(x: unknown): x is { id: string } {
  return typeof x === 'object' && x !== null && typeof (x as { id?: unknown }).id === 'string';
}

function isProvidersResponse(x: unknown): x is { providers: Array<{ provider: string; model: string }> } {
  return typeof x === 'object' && x !== null && Array.isArray((x as { providers?: unknown }).providers);
}

function isFilesResponse(x: unknown): x is { results: Array<{ path: string; name: string }> } {
  return typeof x === 'object' && x !== null && Array.isArray((x as { results?: unknown }).results);
}

export class OpenCodeClient {
  constructor(private baseUrl: string, private password: string) {
    info(`OpenCodeClient initialized: ${baseUrl}`);
  }

  async createSession(): Promise<string> {
    try {
      const response = await this.post('/session', {});
      if (!isSessionResponse(response)) {
        throw new OpenCodeError('No session ID in response');
      }
      info(`Created session: ${response.id}`);
      return response.id;
    } catch (err) {
      throw this.wrapError(err, 'createSession');
    }
  }

  async sendPrompt(sessionId: string, text: string, model?: string): Promise<void> {
    try {
      const payload: Record<string, unknown> = {
        parts: [{ type: 'text', text }],
      };
      if (model) {
        const slash = model.indexOf('/');
        if (slash > 0) {
          payload.model = {
            providerID: model.slice(0, slash),
            modelID: model.slice(slash + 1),
          };
        }
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
      if (!isProvidersResponse(response)) {
        return [];
      }
      return response.providers;
    } catch (err) {
      throw this.wrapError(err, 'listProviders');
    }
  }

  async findFiles(query: string): Promise<Array<{ path: string; name: string }>> {
    try {
      const url = new URL('/find/file', this.baseUrl);
      url.searchParams.set('query', query);
      const response = await this.get(url.pathname + url.search);
      if (!isFilesResponse(response)) {
        return [];
      }
      return response.results;
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
      const body = await response.text().catch(() => '');
      throw new OpenCodeError(`HTTP ${response.status} ${path} ${body.slice(0, 300)}`, 'http_error');
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
      const body = await response.text().catch(() => '');
      throw new OpenCodeError(`HTTP ${response.status} ${path} ${body.slice(0, 300)}`, 'http_error');
    }
    return response.json();
  }

  private headers(): Record<string, string> {
    const auth = Buffer.from(`opencode:${this.password}`).toString('base64');
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
