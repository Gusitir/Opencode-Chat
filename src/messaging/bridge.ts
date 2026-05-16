import * as vscode from 'vscode';
import { v4 as uuid } from 'uuid';
import { WebviewToHost, HostToWebview, MessagePart } from './types';
import { info } from '../utils/logger';
import { OpenCodeClient } from '../server/OpenCodeClient';
import { SessionStore } from '../providers/SessionStore';
import { EventStream } from '../server/EventStream';

export interface BridgeDeps {
  webview: vscode.WebviewView['webview'];
  client: OpenCodeClient;
  sessionStore: SessionStore;
  stream: EventStream;
}

export function createBridge(deps: BridgeDeps) {
  const { webview, client, sessionStore, stream } = deps;

  const post = (msg: HostToWebview) => {
    webview.postMessage(msg);
  };

  const sendState = async () => {
    const sessions = await sessionStore.list();
    const currentSessionId = sessions.length > 0 ? sessions[0].id : null;
    const state: HostToWebview = {
      type: 'state',
      sessions,
      currentSessionId,
      models: [],
      selectedModel: null,
    };
    post(state);
  };

  webview.onDidReceiveMessage((msg: WebviewToHost) => {
    switch (msg.type) {
      case 'ready': {
        info('Webview ready');
        void sendState();
        break;
      }
      case 'sendPrompt': {
        void client.sendPrompt(msg.sessionId, msg.text, undefined).catch((err) => {
          const error = (err as Error).message;
          info(`Failed to send prompt: ${error}`);
          const errorMsg: HostToWebview = {
            type: 'error',
            sessionId: msg.sessionId,
            message: error,
          };
          post(errorMsg);
        });
        break;
      }
      case 'newSession': {
        void (async () => {
          try {
            const id = await client.createSession();
            await sessionStore.create({
              id,
              name: `Session ${new Date().toLocaleTimeString()}`,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
            await sendState();
          } catch (err) {
            info(`Failed to create session: ${(err as Error).message}`);
          }
        })();
        break;
      }
      case 'switchSession': {
        info(`Switch to session: ${msg.sessionId}`);
        break;
      }
      case 'deleteSession': {
        info(`Delete session: ${msg.sessionId}`);
        break;
      }
      case 'renameSession': {
        info(`Rename session ${msg.sessionId} → ${msg.name}`);
        break;
      }
      case 'selectModel': {
        info(`Select model: ${msg.provider}/${msg.model}`);
        break;
      }
      case 'abort': {
        info(`Abort session: ${msg.sessionId}`);
        // TODO: implement abort via OpenCode API or signal
        break;
      }
      case 'permissionResponse': {
        info(`Permission ${msg.decision} for ${msg.requestId}`);
        break;
      }
      case 'findFiles': {
        info(`Find files: ${msg.query}`);
        break;
      }
      case 'openFile': {
        info(`Open file: ${msg.path}:${msg.line ?? 0}`);
        break;
      }
      case 'log': {
        info(`Webview log [${msg.level}]: ${msg.message}`);
        break;
      }
      default: {
        const _exhaustive: never = msg;
        info(`Unknown message: ${_exhaustive}`);
      }
    }
  });

  stream.on('message', (event: unknown) => {
    try {
      const evt = event as Record<string, unknown>;
      const sessionId = evt.sessionId as string | undefined;
      const part = evt.part as unknown;
      if (!sessionId || !part) return;

      if (typeof part === 'object' && part !== null) {
        const p = part as Record<string, unknown>;
        if (p.kind === 'text' && typeof p.text === 'string') {
          const msg: HostToWebview = {
            type: 'messageDelta',
            sessionId,
            messageId: (evt.messageId as string) || 'current',
            part: { kind: 'text', text: p.text },
          };
          post(msg);
        } else if (p.kind === 'tool_call') {
          const msg: HostToWebview = {
            type: 'messageDelta',
            sessionId,
            messageId: (evt.messageId as string) || 'current',
            part: {
              kind: 'tool_call',
              toolId: (p.toolId as string) || '',
              name: (p.name as string) || '',
              input: p.input || {},
              status: (p.status as string) || 'running',
            },
          };
          post(msg);
        }
      }
    } catch (err) {
      info(`Error processing stream event: ${(err as Error).message}`);
    }
  });

  return { post };
}
