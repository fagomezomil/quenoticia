/**
 * Polyfill de WebSocket para scripts standalone Node 20.
 *
 * Node 20 no tiene native WebSocket (recien Node 22). @supabase/supabase-js
 * lo requiere en el constructor del RealtimeClient aunque no se use realtime.
 * Next.js polyfill nativo en el endpoint HTTP; scripts standalone necesitan
 * polyfill manual via --import.
 *
 * Uso:
 *   NODE_OPTIONS="--import ./scripts/polyfill-ws.cjs" node_modules/.bin/tsx scripts/build-stories.ts
 *
 * NOTA: el `--import` inline NO funciona con tsx porque su binario spawnea un
 * child process que no hereda flags inline. Pasarlo via NODE_OPTIONS (env var)
 * sí llega al child process. --import ejecuta este archivo ANTES de que tsx
 * empiece a compilar/ejecutar el script. Para cuando supabase-js corra su
 * constructor, globalThis.WebSocket ya está seteado.
 */

const { WebSocket } = require("ws");
globalThis.WebSocket = WebSocket;