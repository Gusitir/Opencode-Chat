interface Session {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

class SessionStore {
  sessions = $state<Session[]>([]);
  currentSessionId = $state<string | null>(null);

  setCurrentSession(id: string) {
    this.currentSessionId = id;
  }

  addSession(session: Session) {
    this.sessions = [...this.sessions, session];
  }

  removeSession(id: string) {
    this.sessions = this.sessions.filter((s) => s.id !== id);
  }

  updateSession(id: string, updates: Partial<Session>) {
    const idx = this.sessions.findIndex((s) => s.id === id);
    if (idx !== -1) {
      this.sessions[idx] = { ...this.sessions[idx], ...updates };
    }
  }
}

export const sessionStore = new SessionStore();
