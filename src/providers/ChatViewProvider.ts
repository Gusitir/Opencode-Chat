import * as vscode from 'vscode';

export class ChatViewProvider implements vscode.WebviewViewProvider {
  constructor(_context: vscode.ExtensionContext) {
    void _context;
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
    webviewView.webview.html = '<h1>Placeholder</h1>';
  }
}
