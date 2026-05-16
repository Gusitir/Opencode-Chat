import * as vscode from 'vscode';

let logger: vscode.LogOutputChannel | null = null;

export function getLogger(): vscode.LogOutputChannel {
  if (!logger) {
    logger = vscode.window.createOutputChannel('Opencode Chat', { log: true });
  }
  return logger;
}

export const info = (msg: string) => getLogger().info(msg);
export const warn = (msg: string) => getLogger().warn(msg);
export const error = (msg: string, err?: Error) => getLogger().error(msg, err);
