import * as vscode from 'vscode';
import { WebviewToHost, HostToWebview } from './types';
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

  const activeAssistantMessages = new Set<string>();

  stream.on('message', (event: unknown) => {
    try {
      const evt = event as { payload?: { type?: string; properties?: Record<string, unknown> } };
      const payload = evt.payload;
      if (!payload || typeof payload !== 'object') return;
      const type = payload.type;
      const props = (payload.properties || {}) as Record<string, unknown>;
      const sessionId = props.sessionID as string | undefined;
      if (!sessionId) return;

      switch (type) {
        case 'message.part.delta': {
          const field = props.field as string | undefined;
          if (field !== 'text') return;
          const messageId = props.messageID as string;
          const delta = props.delta as string;
          if (!messageId || typeof delta !== 'string') return;
          activeAssistantMessages.add(messageId);
          post({
            type: 'messageDelta',
            sessionId,
            messageId,
            part: { kind: 'text', text: delta },
          });
          break;
        }
        case 'session.idle': {
          for (const messageId of activeAssistantMessages) {
            post({ type: 'messageDone', sessionId, messageId });
          }
          activeAssistantMessages.clear();
          break;
        }
        default:
          break;
      }
    } catch (err) {
      info(`Error processing stream event: ${(err as Error).message}`);
    }
  });

  return { post };
}
