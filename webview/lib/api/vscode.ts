declare const acquireVsCodeApi: () => any;

import type { WebviewToHost, HostToWebview } from '../../../src/messaging/types';

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
