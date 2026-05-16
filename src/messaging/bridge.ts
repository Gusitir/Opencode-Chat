import * as vscode from 'vscode';
import { v4 as uuid } from 'uuid';
import { WebviewToHost, HostToWebview } from './types';
import { info } from '../utils/logger';
import { OpenCodeClient } from '../server/OpenCodeClient';
import { SessionStore } from '../providers/SessionStore';

export interface BridgeDeps {
  webview: vscode.WebviewView['webview'];
  client: OpenCodeClient;
  sessionStore: SessionStore;
}

export function createBridge(deps: BridgeDeps) {
  const { webview, client, sessionStore } = deps;

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
          info(`Failed to send prompt: ${(err as Error).message}`);
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

  return { post };
}
