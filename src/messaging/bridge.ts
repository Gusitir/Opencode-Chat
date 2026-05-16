import * as vscode from 'vscode';
import { WebviewToHost, HostToWebview } from './types';
import { info } from '../utils/logger';

export interface BridgeDeps {
  webview: vscode.WebviewView['webview'];
}

export function createBridge(deps: BridgeDeps) {
  const { webview } = deps;

  const post = (msg: HostToWebview) => {
    webview.postMessage(msg);
  };

  webview.onDidReceiveMessage((msg: WebviewToHost) => {
    switch (msg.type) {
      case 'ready': {
        info('Webview ready');
        const state: HostToWebview = {
          type: 'state',
          sessions: [],
          currentSessionId: null,
          models: [],
          selectedModel: null,
        };
        post(state);
        break;
      }
      case 'sendPrompt': {
        info(`Prompt: ${msg.text}`);
        break;
      }
      case 'newSession': {
        info('New session');
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
