export const AUTH_BASE_URL = 'http://localhost:8081';
export const MSG_BASE_URL = 'http://localhost:8083';
export const MSG_WS_PATH = '/ws';

export const MSG_WS_URL = toWebSocketUrl(MSG_BASE_URL, MSG_WS_PATH);

export const DEV_SERVER_HOST = '0.0.0.0';
export const DEV_SERVER_PORT = 3000;
export const HMR_HOST: string | undefined = undefined; // set if clients can't resolve the server host
export const HMR_PORT: number | undefined = undefined; // let Vite reuse the page port by default
export const HMR_PROTOCOL: 'ws' | 'wss' = 'ws';
export const DISABLE_HMR = false;

// Used by vite.config define section; keep editable here (prefer .env: VITE_GEMINI_API_KEY)
export const GEMINI_API_KEY = import.meta?.env?.VITE_GEMINI_API_KEY || '';

export function toWebSocketUrl(httpUrl: string, path = '/ws') {
  try {
    const url = new URL(httpUrl);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.pathname = path;
    return url.toString();
  } catch {
    return `ws://localhost:8083${path}`;
  }
}
