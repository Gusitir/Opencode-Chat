declare const acquireVsCodeApi: () => any;

export type WebviewToHost =
  | { type: 'ready' }
  | { type: 'sendPrompt'; sessionId: string; text: string; attachments?: string[] }
  | { type: 'newSession' }
  | { type: 'switchSession'; sessionId: string }
  | { type: 'deleteSession'; sessionId: string }
  | { type: 'renameSession'; sessionId: string; name: string }
  | { type: 'selectModel'; provider: string; model: string }
  | { type: 'abort'; sessionId: string }
  | { type: 'permissionResponse'; requestId: string; decision: 'allow' | 'allow_always' | 'deny' }
  | { type: 'findFiles'; query: string; requestId: string }
  | { type: 'openFile'; path: string; line?: number }
  | { type: 'log'; level: 'info' | 'warn' | 'error'; message: string };

export type HostToWebview =
  | { type: 'state'; sessions: any[]; currentSessionId: string | null; models: any[]; selectedModel: any }
  | { type: 'messageDelta'; sessionId: string; messageId: string; part: any }
  | { type: 'messageDone'; sessionId: string; messageId: string }
  | { type: 'permissionRequest'; requestId: string; toolName: string; input: unknown }
  | { type: 'findFilesResult'; requestId: string; results: { path: string; name: string }[] }
  | { type: 'appendToInput'; text: string }
  | { type: 'error'; sessionId?: string; message: string };

const api = acquireVsCodeApi();
const listeners: Map<string, Set<Function>> = new Map();

window.addEventListener('message', (event: MessageEvent<HostToWebview>) => {
  const msg = event.data;
  const handlers = listeners.get(msg.type);
  if (handlers) {
    handlers.forEach((handler) => handler(msg));
  }
});

export function send(msg: WebviewToHost) {
  api.postMessage(msg);
}

export function on<T extends HostToWebview['type']>(
  type: T,
  cb: (msg: Extract<HostToWebview, { type: T }>) => void
) {
  if (!listeners.has(type)) {
    listeners.set(type, new Set());
  }
  listeners.get(type)!.add(cb);
  return () => {
    listeners.get(type)!.delete(cb);
  };
}
