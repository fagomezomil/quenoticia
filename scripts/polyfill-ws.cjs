/**
 * Polyfill de WebSocket para scripts standalone Node 20.
 *
 * Node 20 no tiene native WebSocket (recien Node 22). @supabase/supabase-js
 * lo requiere en el constructor del RealtimeClient aunque no se use realtime.
 * Next.js polyfill nativo en el endpoint HTTP; scripts standalone necesitan
 * polyfill manual via --import.
 *
 * Uso:
 *   node --import ./scripts/polyfill-ws.cjs node_modules/.bin/tsx scripts/build-stories.ts
 *
 * --import ejecuta este archivo ANTES de que tsx empiece a compilar/ejecutar
 * el script. Para cuando supabase-js corra su constructor, globalThis.WebSocket
 * ya está seteado.
 */

const { WebSocket } = require("ws");
globalThis.WebSocket = WebSocket;