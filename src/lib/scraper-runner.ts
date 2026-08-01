import { spawn, type ChildProcess } from "child_process";
import { readFile, writeFile, mkdir, open } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

/** Fuentes válidas del scraper (deben matchear SCRAPERS en main.py). */
export const SCRAPER_SOURCES = [
  "contexto",
  "comunicacion",
  "comunicacionsmt",
  "ambito",
  "tycsports",
] as const;
export type ScraperSource = (typeof SCRAPER_SOURCES)[number];

const SCRAPER_DIR = "/opt/scraper";
const PYTHON_BIN = `${SCRAPER_DIR}/.venv/bin/python`;
const LOG_DIR = "/var/log/scraper";
const TIMEOUT_MS = 600_000; // 10 min, igual que cron-scraper.sh

export type RunStatus = "running" | "done" | "error" | "timeout";

export interface RunState {
  runId: string;
  sources: ScraperSource[];
  status: RunStatus;
  startedAt: string;
  endedAt?: string;
  pid?: number;
  exitCode?: number | null;
  error?: string;
}

function statePath(runId: string): string {
  return path.join(LOG_DIR, `ondemand-${runId}.json`);
}
function logPath(runId: string): string {
  return path.join(LOG_DIR, `ondemand-${runId}.log`);
}
function currentLockPath(): string {
  return path.join(LOG_DIR, `ondemand-current.lock`);
}

async function isProcessAlive(pid: number): Promise<boolean> {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function ensureLogDir(): Promise<void> {
  if (!existsSync(LOG_DIR)) {
    try {
      await mkdir(LOG_DIR, { recursive: true });
    } catch {
      // Sin permisos: las funciones fallarán más abajo con error legible.
    }
  }
}

async function readState(runId: string): Promise<RunState | null> {
  try {
    const raw = await readFile(statePath(runId), "utf-8");
    return JSON.parse(raw) as RunState;
  } catch {
    return null;
  }
}

async function writeState(state: RunState): Promise<void> {
  try {
    await writeFile(statePath(state.runId), JSON.stringify(state, null, 2));
  } catch (err) {
    console.error("scraper-runner: writeState falló", err);
  }
}

/** Devuelve el run apuntado por el lock (el último disparado). Si el proceso
 *  murió sin escribir estado final, lo marca como error. */
export async function getCurrentRun(): Promise<RunState | null> {
  try {
    const lockRaw = await readFile(currentLockPath(), "utf-8");
    const runId = lockRaw.trim();
    const state = await readState(runId);
    if (!state) return null;
    if (state.status === "running" && state.pid && !state.endedAt) {
      const alive = await isProcessAlive(state.pid);
      if (!alive) {
        state.status = "error";
        state.endedAt = new Date().toISOString();
        state.error = "Proceso terminó sin escribir estado final";
        await writeState(state);
      }
    }
    return state;
  } catch {
    return null;
  }
}

/** Lee las últimas `tailLines` líneas del log del run. */
export async function readRunLog(runId: string, tailLines = 200): Promise<string> {
  try {
    const raw = await readFile(logPath(runId), "utf-8");
    const lines = raw.split("\n");
    return lines.slice(-tailLines).join("\n").trim();
  } catch {
    return "";
  }
}

export interface StartRunResult {
  ok: boolean;
  runId?: string;
  error?: string;
  status?: number;
}

/** Dispara una corrida del scraper en background. Lock: 1 run a la vez. */
export async function startRun(sources: ScraperSource[]): Promise<StartRunResult> {
  if (sources.length === 0) {
    return { ok: false, error: "Sin fuentes especificadas", status: 400 };
  }
  for (const s of sources) {
    if (!SCRAPER_SOURCES.includes(s)) {
      return { ok: false, error: `Fuente inválida: ${s}`, status: 400 };
    }
  }

  const current = await getCurrentRun();
  if (current && current.status === "running") {
    return { ok: false, error: "Ya hay una corrida en curso", status: 409 };
  }

  await ensureLogDir();

  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const logFile = logPath(runId);
  const state: RunState = {
    runId,
    sources,
    status: "running",
    startedAt: new Date().toISOString(),
  };
  await writeState(state);
  await writeFile(currentLockPath(), runId).catch(() => {});

  // Abrir fd para stdout/stderr del child. detached + unref deja que el
  // proceso viva independiente del request handler de Next.js.
  let fh;
  try {
    fh = await open(logFile, "w");
  } catch (err) {
    state.status = "error";
    state.endedAt = new Date().toISOString();
    state.error = `No se pudo abrir log: ${String(err)}`;
    await writeState(state);
    return { ok: false, error: state.error, status: 500 };
  }

  const args = [`${SCRAPER_DIR}/main.py`, "--once", "--sources", ...sources];
  let child: ChildProcess;
  try {
    child = spawn(PYTHON_BIN, args, {
      cwd: SCRAPER_DIR,
      detached: true,
      stdio: ["ignore", fh.fd, fh.fd],
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
    });
  } catch (err) {
    await fh.close();
    state.status = "error";
    state.endedAt = new Date().toISOString();
    state.error = `spawn falló: ${String(err)}`;
    await writeState(state);
    return { ok: false, error: state.error, status: 500 };
  }
  child.unref();
  await fh.close();

  if (!child.pid) {
    state.status = "error";
    state.endedAt = new Date().toISOString();
    state.error = "No se pudo iniciar el proceso (sin pid)";
    await writeState(state);
    return { ok: false, error: state.error, status: 500 };
  }

  state.pid = child.pid;
  await writeState(state);

  // Timeout: matar con SIGTERM a los 10 min.
  const timer = setTimeout(() => {
    try {
      child.kill("SIGTERM");
    } catch {}
  }, TIMEOUT_MS);
  timer.unref?.();

  // Listener de exit: escribe estado final. No bloquea el event loop
  // (unref del child desacopla el manejo).
  child.on("exit", async (code, signal) => {
    clearTimeout(timer);
    try {
      const final = await readState(runId);
      if (!final) return;
      if (signal === "SIGTERM" || signal === "SIGKILL") {
        final.status = "timeout";
        final.error = `Terminado por timeout (${TIMEOUT_MS / 1000}s)`;
      } else if (code === 0) {
        final.status = "done";
      } else {
        final.status = "error";
        final.error = `Proceso terminó con código ${code}`;
      }
      final.endedAt = new Date().toISOString();
      final.exitCode = code ?? null;
      await writeState(final);
    } catch {}
  });

  child.on("error", async (err) => {
    clearTimeout(timer);
    try {
      const final = await readState(runId);
      if (!final) return;
      final.status = "error";
      final.endedAt = new Date().toISOString();
      final.error = `child error: ${err.message}`;
      await writeState(final);
    } catch {}
  });

  return { ok: true, runId };
}