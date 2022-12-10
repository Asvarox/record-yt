import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, splitVendorChunkPlugin } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),
    tsconfigPaths(),
    visualizer(),
    basicSsl(),
    splitVendorChunkPlugin(),
  ],
  build: {
    outDir: 'build',
    sourcemap: true,
  },
  base: './',
})
