import * as vscode from 'vscode';

export interface OpencodeConfig {
  cliPath: string;
  serverPort: number;
  defaultModel: string;
  autoApproveTools: string[];
}

export function getConfig(): OpencodeConfig {
  const config = vscode.workspace.getConfiguration('opencodeChat');
  return {
    cliPath: config.get('cliPath') ?? 'opencode',
    serverPort: config.get('serverPort') ?? 0,
    defaultModel: config.get('defaultModel') ?? '',
    autoApproveTools: config.get('autoApproveTools') ?? [],
  };
}

export function onConfigChange(callback: (config: OpencodeConfig) => void): vscode.Disposable {
  return vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration('opencodeChat')) {
      callback(getConfig());
    }
  });
}
