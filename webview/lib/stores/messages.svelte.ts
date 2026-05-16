import type { MessagePart } from '../../../src/messaging/types';

interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  parts: MessagePart[];
}

class MessagesStore {
  messages = $state<Message[]>([]);

  addMessage(msg: Message) {
    this.messages = [...this.messages, msg];
  }

  updateMessage(id: string, updates: Partial<Message>) {
    const idx = this.messages.findIndex((m) => m.id === id);
    if (idx !== -1) {
      this.messages[idx] = { ...this.messages[idx], ...updates };
    }
  }

  getBySession(sessionId: string) {
    return this.messages.filter((m) => m.sessionId === sessionId);
  }

  clearSession(sessionId: string) {
    this.messages = this.messages.filter((m) => m.sessionId !== sessionId);
  }
}

export const messagesStore = new MessagesStore();
