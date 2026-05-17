import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as net from 'net';
import { randomUUID } from 'crypto';
import { info, error } from '../utils/logger';
import { getConfig } from '../utils/config';

export class OpenCodeServer {
  private process: child_process.ChildProcess | null = null;

  async start(): Promise<{ port: number; password: string }> {
    const cfg = getConfig();
    const port = await this.getFreePort(cfg.serverPort);
    const password = randomUUID();

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    info(`Starting OpenCode server: cliPath="${cfg.cliPath}" port=${port} platform=${process.platform} cwd=${workspaceFolder ?? '<none>'}`);

    this.process = child_process.spawn(
      cfg.cliPath,
      ['serve', '--port', String(port), '--hostname', '127.0.0.1', '--print-logs', '--pure'],
      {
        cwd: workspaceFolder,
        env: { ...process.env, OPENCODE_SERVER_PASSWORD: password },
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: process.platform === 'win32',
      }
    );

    info(`Spawned PID=${this.process.pid ?? 'null'}`);

    this.process.stdout?.on('data', (data) => {
      info(`[opencode stdout] ${data.toString().trim()}`);
    });

    this.process.stderr?.on('data', (data) => {
      info(`[opencode stderr] ${data.toString().trim()}`);
    });

    this.process.on('error', (err: NodeJS.ErrnoException) => {
      error(`[opencode spawn error] code=${err.code ?? '?'} message=${err.message}`);
      if (err.code === 'ENOENT') {
        void vscode.window.showErrorMessage(
          'OpenCode CLI not found',
          'Install Guide'
        ).then((choice) => {
          if (choice === 'Install Guide') {
            void vscode.env.openExternal(vscode.Uri.parse('https://opencode.ai/docs/'));
          }
        });
      }
    });

    this.process.on('exit', (code, signal) => {
      info(`[opencode exit] code=${code} signal=${signal}`);
    });

    await this.waitForHealth(port, password, 15000);

    return { port, password };
  }

  stop(): void {
    if (this.process) {
      info('Stopping OpenCode server');
      this.process.kill('SIGTERM');
      this.process = null;
    }
  }

  private async getFreePort(preferredPort: number): Promise<number> {
    if (preferredPort === 0) {
      return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.listen(0, '127.0.0.1', () => {
          const addr = server.address();
          server.close();
          if (addr && typeof addr === 'object' && 'port' in addr) {
            resolve(addr.port);
          } else {
            reject(new Error('Could not determine port'));
          }
        });
      });
    }
    return preferredPort;
  }

  private async waitForHealth(port: number, password: string, timeoutMs: number): Promise<void> {
    const url = `http://127.0.0.1:${port}/global/health`;
    const startTime = Date.now();
    let attempt = 0;
    let lastStatus: number | string = 'pending';

    while (Date.now() - startTime < timeoutMs) {
      attempt++;
      try {
        const response = await fetch(url, {
          headers: { Authorization: `Basic ${Buffer.from(`opencode:${password}`).toString('base64')}` },
        });
        lastStatus = response.status;
        if (response.ok) {
          info(`OpenCode server health check passed (attempt=${attempt})`);
          return;
        }
        if (attempt === 1 || attempt % 10 === 0) {
          info(`health attempt=${attempt} status=${response.status}`);
        }
      } catch (err) {
        lastStatus = (err as Error).message;
        if (attempt === 1 || attempt % 10 === 0) {
          info(`health attempt=${attempt} error=${(err as Error).message}`);
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    throw new Error(`OpenCode server health check failed after ${timeoutMs}ms (attempts=${attempt}, last=${lastStatus})`);
  }
}
