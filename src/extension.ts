import * as vscode from 'vscode';
import { info } from './utils/logger';
import { ChatViewProvider } from './providers/ChatViewProvider';
import { SessionStore } from './providers/SessionStore';
import { registerInstallCommand } from './commands/installOpenCode';
import { OpenCodeServer } from './server/OpenCodeServer';
import { OpenCodeClient } from './server/OpenCodeClient';
import { EventStream } from './server/EventStream';

let server: OpenCodeServer | null = null;
let stream: EventStream | null = null;

export async function activate(context: vscode.ExtensionContext) {
  info('Activating Opencode Chat extension');

  try {
    server = new OpenCodeServer();
    const { port, password } = await server.start();

    const baseUrl = `http://127.0.0.1:${port}`;
    const client = new OpenCodeClient(baseUrl, password);
    const sessionStore = new SessionStore(context);
    stream = new EventStream(baseUrl, password);
    stream.start();

    const provider = new ChatViewProvider(context, client, sessionStore);
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider('opencodeChat.view', provider)
    );

    registerInstallCommand(context);

    context.subscriptions.push(
      vscode.commands.registerCommand('opencodeChat.openChat', async () => {
        info('Command: openChat');
      }),
      vscode.commands.registerCommand('opencodeChat.newSession', async () => {
        info('Command: newSession');
      }),
      vscode.commands.registerCommand('opencodeChat.addSelectionToPrompt', async () => {
        info('Command: addSelectionToPrompt');
      })
    );

    info('Opencode Chat extension activated');
  } catch (err) {
    info(`Activation failed: ${(err as Error).message}`);
    throw err;
  }
}

export function deactivate() {
  info('Deactivating Opencode Chat extension');
  if (stream) stream.stop();
  if (server) server.stop();
}
