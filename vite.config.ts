import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import {
  DEV_SERVER_HOST,
  DEV_SERVER_PORT,
  HMR_HOST,
  HMR_PORT,
  HMR_PROTOCOL,
  DISABLE_HMR,
  GEMINI_API_KEY,
} from './config/constants';

export default defineConfig(() => ({
  server: {
    port: DEV_SERVER_PORT,
    host: DEV_SERVER_HOST,
    hmr: DISABLE_HMR ? false : {
      host: HMR_HOST,
      port: HMR_PORT,
      protocol: HMR_PROTOCOL,
    },
  },
  plugins: [react()],
  define: {
    'process.env.API_KEY': JSON.stringify(GEMINI_API_KEY),
    'process.env.GEMINI_API_KEY': JSON.stringify(GEMINI_API_KEY),
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
}));
