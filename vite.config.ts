import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'
import { esmShim } from 'vite-plugin-electron/plugin'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    electron({
      // package.json is "type": "module", so vite-plugin-electron emits the
      // main process bundle as ESM (.js). electron/main.ts relies on the CJS
      // global __dirname, which is undefined in ESM scope. esmShim() injects an
      // import.meta.url-based __dirname/__filename shim into the main bundle so
      // the ESM entry referenced by package.json "main" loads at runtime.
      main: {
        entry: 'electron/main.ts',
        vite: {
          plugins: [esmShim()],
        },
      },
      preload: { input: 'electron/preload.ts' },
    }),
  ],
})
