import { spawn } from "node:child_process";

const host = "127.0.0.1";
const port = 5173;
const devUrl = `http://${host}:${port}/`;

async function probeDevServer() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1000);
  try {
    const response = await fetch(devUrl, { signal: controller.signal });
    const body = await response.text();
    return {
      reachable: true,
      isCopyTranslator:
        body.includes("CopyTranslator") ||
        body.includes("/src/main.ts") ||
        body.includes("runtime-globals.js"),
    };
  } catch {
    return { reachable: false, isCopyTranslator: false };
  } finally {
    clearTimeout(timeout);
  }
}

function runVite() {
  const command = process.platform === "win32" ? "npx.cmd" : "npx";
  const child = spawn(
    command,
    ["vite", "--host", host, "--port", String(port), "--strictPort"],
    {
      stdio: "inherit",
      env: process.env,
    }
  );

  const stop = (signal) => {
    if (!child.killed) {
      child.kill(signal);
    }
  };

  process.on("SIGINT", () => stop("SIGINT"));
  process.on("SIGTERM", () => stop("SIGTERM"));

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

const probe = await probeDevServer();
if (probe.reachable && probe.isCopyTranslator) {
  console.log(`[dev-server] Reusing existing CopyTranslator dev server at ${devUrl}`);
  process.exit(0);
}

if (probe.reachable) {
  console.error(`[dev-server] Port ${port} is already used by another service.`);
  console.error(`[dev-server] Stop that process or change the Vite/Tauri dev port.`);
  process.exit(1);
}

runVite();
