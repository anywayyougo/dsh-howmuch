import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    entry: ['src/host/index.ts'],
    outDir: 'lib/host',
    format: ['esm'],
  },
  {
    entry: ['src/client/index.tsx'],
    outDir: 'lib/client',
    format: ['cjs'],
    // 注入安全的 module 和 exports 环境
    banner: `window.__ModuleLoader__.load({ id: "dsh-howmuch", factory: (require) => { const module = { exports: {} }; const exports = module.exports;`,
    footer: `return module.exports; } });`
  }
]);