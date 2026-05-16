// Webview -> Host
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

// Host -> Webview
export type HostToWebview =
  | { type: 'state'; sessions: SessionMeta[]; currentSessionId: string | null; models: ModelInfo[]; selectedModel: { provider: string; model: string } | null }
  | { type: 'messageDelta'; sessionId: string; messageId: string; part: MessagePart }
  | { type: 'messageDone'; sessionId: string; messageId: string }
  | { type: 'permissionRequest'; requestId: string; toolName: string; input: unknown }
  | { type: 'findFilesResult'; requestId: string; results: { path: string; name: string }[] }
  | { type: 'appendToInput'; text: string }
  | { type: 'error'; sessionId?: string; message: string };

export interface SessionMeta {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface ModelInfo {
  provider: string;
  model: string;
  label: string;
}

export type MessagePart =
  | { kind: 'text'; text: string }
  | { kind: 'tool_call'; toolId: string; name: string; input: unknown; status: 'running' | 'done' | 'error'; output?: unknown };
