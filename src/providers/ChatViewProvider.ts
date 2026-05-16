import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { info } from '../utils/logger';

export class ChatViewProvider implements vscode.WebviewViewProvider {
  constructor(private context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, 'dist', 'webview'))],
    };

    const htmlPath = path.join(this.context.extensionPath, 'dist', 'webview', 'index.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    const nonce = this.getNonce();
    const cspSource = webviewView.webview.cspSource;

    html = html.replace(/href="(?!https?:)/g, `href="${cspSource}/`);
    html = html.replace(/src="(?!https?:)/g, `src="${cspSource}/`);
    html = html
      .replace(/{{ nonce }}/g, nonce)
      .replace(/<script/g, `<script nonce="${nonce}"`);

    const csp = `default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src ${cspSource} 'nonce-${nonce}'; img-src ${cspSource} https: data:; font-src ${cspSource}; connect-src 'none';`;
    html = html.replace(/<head[^>]*>/, `<head><meta http-equiv="Content-Security-Policy" content="${csp}">`);

    webviewView.webview.html = html;
    info('ChatViewProvider resolved');
  }

  private getNonce(): string {
    let nonce = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      nonce += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return nonce;
  }
}
