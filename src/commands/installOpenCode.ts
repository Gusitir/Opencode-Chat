import * as vscode from 'vscode';

export function registerInstallCommand(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('opencodeChat.installCli', async () => {
      await vscode.env.openExternal(vscode.Uri.parse('https://opencode.ai/docs/'));
    })
  );
}
