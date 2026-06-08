import { defineConfig } from 'vite';

export default defineConfig({
  // Material-UI v3's styling engine (jss) references the Node `global`, which CRA/webpack
  // shimmed but Vite does not provide in the browser. Map it to globalThis.
  define: { global: 'globalThis' },
  // React 16.8.0-alpha has no automatic JSX runtime, and @vitejs/plugin-react
  // unconditionally pre-bundles react/jsx-runtime (which this React build doesn't ship),
  // breaking dev. esbuild transforms the classic JSX (React.createElement) in .jsx/.tsx
  // natively and every file imports React, so the React plugin is unnecessary here
  // (Fast Refresh is a no-op for this class-component app anyway).
  esbuild: { jsx: 'transform' },
  server: {
    port: 3000,
    open: true,
    // A broken transitive fsevents@1.2.13 crashes the native macOS watcher on Node 20;
    // fall back to polling so dev/HMR works in this environment.
    watch: { usePolling: true },
  },
  build: { outDir: 'build' },
});
