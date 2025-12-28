// Minimal global shim for browser builds where some libraries expect Node globals
const g = globalThis as any;
if (!g.global) g.global = g;
