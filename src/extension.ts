import * as vscode from 'vscode';
import { info } from './utils/logger';
import { ChatViewProvider } from './providers/ChatViewProvider';

export async function activate(context: vscode.ExtensionContext) {
  info('Activating Opencode Chat extension');

  const provider = new ChatViewProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('opencodeChat.view', provider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('opencodeChat.openChat', async () => {
      info('Command: openChat');
    }),
    vscode.commands.registerCommand('opencodeChat.newSession', async () => {
      info('Command: newSession');
    }),
    vscode.commands.registerCommand('opencodeChat.addSelectionToPrompt', async () => {
      info('Command: addSelectionToPrompt');
    }),
    vscode.commands.registerCommand('opencodeChat.installCli', async () => {
      vscode.env.openExternal(vscode.Uri.parse('https://opencode.ai/docs/'));
    })
  );

  info('Opencode Chat extension activated');
}

export function deactivate() {
  info('Deactivating Opencode Chat extension');
}
