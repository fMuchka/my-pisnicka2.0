import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import { generateTokensCss, TOKENS_CSS_FILE } from '../src/styles/generateTokensCss';

// Regenerates tokens.generated.css on every dev/build start. tokens.ts is imported by the Vite
// config, so editing it restarts the dev server, which lands here again.
export const cssTokens = (): Plugin => {
  let root = process.cwd();

  return {
    name: 'css-tokens',
    configResolved(config) {
      root = config.root;
    },
    buildStart() {
      const file = path.resolve(root, TOKENS_CSS_FILE);
      const css = generateTokensCss();
      const current = fs.existsSync(file)
        ? fs.readFileSync(file, 'utf8').replaceAll('\r\n', '\n')
        : '';

      // Skipping identical writes keeps the file watcher from reloading the page for nothing.
      if (current !== css) {
        fs.writeFileSync(file, css);
      }
    },
  };
};
