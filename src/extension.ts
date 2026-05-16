import * as vscode from 'vscode';
import { info } from './utils/logger';
import { ChatViewProvider } from './providers/ChatViewProvider';
import { registerInstallCommand } from './commands/installOpenCode';

export async function activate(context: vscode.ExtensionContext) {
  info('Activating Opencode Chat extension');

  const provider = new ChatViewProvider(context);
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
}

export function deactivate() {
  info('Deactivating Opencode Chat extension');
}
