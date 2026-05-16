import * as esbuild from 'esbuild';

export async function build(options = {}) {
  const ctx = await esbuild.context({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'cjs',
    external: ['vscode'],
    outfile: 'dist/extension.js',
    sourcemap: true,
  });

  if (options.watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

const args = process.argv.slice(2);
const watch = args.includes('--watch') || args.includes('-w');
build({ watch }).catch((err) => {
  console.error(err);
  process.exit(1);
});
