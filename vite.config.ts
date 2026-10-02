import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execFileSync } from 'node:child_process';
import packageJson from './package.json' with { type: 'json' };

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'source-identity',
      generateBundle() {
        const git = (args: string[]) =>
          execFileSync('git', args, { encoding: 'utf8' }).trim();
        const info = {
          commit: git(['rev-parse', 'HEAD']),
          tree: git(['rev-parse', 'HEAD^{tree}']),
          dirty: Boolean(git(['status', '--porcelain'])),
          builtAt: new Date().toISOString(),
          node: process.version,
          dependencies: packageJson.dependencies,
        };
        this.emitFile({
          type: 'asset',
          fileName: 'build-info.json',
          source: JSON.stringify(info, null, 2) + '\n',
        });
      },
    },
  ],
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
});
