import * as vscode from 'vscode';

interface SessionMeta {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

const SESSION_KEY = 'sessions';

export class SessionStore {
  constructor(private context: vscode.ExtensionContext) {}

  async list(): Promise<SessionMeta[]> {
    const data = this.context.workspaceState.get<SessionMeta[]>(SESSION_KEY) || [];
    return data;
  }

  async get(id: string): Promise<SessionMeta | undefined> {
    const sessions = await this.list();
    return sessions.find((s) => s.id === id);
  }

  async create(meta: SessionMeta): Promise<void> {
    const sessions = await this.list();
    sessions.push(meta);
    await this.context.workspaceState.update(SESSION_KEY, sessions);
  }

  async update(id: string, updates: Partial<SessionMeta>): Promise<void> {
    const sessions = await this.list();
    const idx = sessions.findIndex((s) => s.id === id);
    if (idx !== -1) {
      sessions[idx] = { ...sessions[idx], ...updates };
      await this.context.workspaceState.update(SESSION_KEY, sessions);
    }
  }

  async delete(id: string): Promise<void> {
    const sessions = await this.list();
    const filtered = sessions.filter((s) => s.id !== id);
    await this.context.workspaceState.update(SESSION_KEY, filtered);
  }
}
