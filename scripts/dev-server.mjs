import { spawn, spawnSync } from "node:child_process";

const host = "127.0.0.1";
const port = 5173;
const devUrl = `http://${host}:${port}/`;

async function probeDevServer() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1000);
  try {
    const response = await fetch(devUrl, { signal: controller.signal });
    const body = await response.text();
    const clientHealthy = await probeViteClient();
    return {
      reachable: true,
      isCopyTranslator:
        body.includes("CopyTranslator") ||
        body.includes("/src/main.ts") ||
        body.includes("runtime-globals.js"),
      clientHealthy,
    };
  } catch {
    return { reachable: false, isCopyTranslator: false, clientHealthy: false };
  } finally {
    clearTimeout(timeout);
  }
}

async function probeViteClient() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1000);
  try {
    const response = await fetch(`${devUrl}@vite/client`, {
      signal: controller.signal,
    });
    const body = await response.text();
    return (
      response.ok &&
      !body.includes("__BUNDLED_DEV__") &&
      !body.includes("__SERVER_FORWARD_CONSOLE__")
    );
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function getPortOwnerPids() {
  if (process.platform === "win32") {
    const result = spawnSync("netstat", ["-ano", "-p", "tcp"], {
      encoding: "utf8",
    });
    if (result.status !== 0) {
      return [];
    }
    return result.stdout
      .split(/\r?\n/)
      .filter((line) => line.includes(`:${port}`) && /\bLISTENING\b/i.test(line))
      .map((line) => Number(line.trim().split(/\s+/).at(-1)))
      .filter((pid) => Number.isInteger(pid) && pid > 0);
  }

  const result = spawnSync("lsof", [`-tiTCP:${port}`, "-sTCP:LISTEN"], {
    encoding: "utf8",
  });
  if (result.status !== 0) {
    return [];
  }
  return result.stdout
    .split(/\s+/)
    .map((pid) => Number(pid))
    .filter((pid) => Number.isInteger(pid) && pid > 0);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function stopStaleDevServer() {
  const pids = [...new Set(getPortOwnerPids())].filter(
    (pid) => pid !== process.pid
  );
  if (pids.length === 0) {
    console.error(`[dev-server] Could not find the process using port ${port}.`);
    return false;
  }

  console.log(
    `[dev-server] Restarting stale CopyTranslator dev server on port ${port}: ${pids.join(", ")}`
  );

  for (const pid of pids) {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      // The process may have already exited.
    }
  }

  await sleep(1200);

  for (const pid of pids) {
    try {
      process.kill(pid, 0);
      process.kill(pid, "SIGKILL");
    } catch {
      // The process exited after SIGTERM.
    }
  }

  await sleep(300);
  return true;
}

function runVite() {
  const command = process.platform === "win32" ? "npx.cmd" : "npx";
  const child = spawn(
    command,
    ["vite", "--host", host, "--port", String(port), "--strictPort", "--force"],
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
if (probe.reachable && probe.isCopyTranslator && probe.clientHealthy) {
  console.log(`[dev-server] Reusing existing CopyTranslator dev server at ${devUrl}`);
  process.exit(0);
}

if (probe.reachable && probe.isCopyTranslator) {
  const stopped = await stopStaleDevServer();
  if (!stopped) {
    console.error(`[dev-server] Port ${port} is used by a stale CopyTranslator dev server.`);
    console.error(`[dev-server] Stop that process and run npm run tauri dev again.`);
    process.exit(1);
  }
  runVite();
} else if (probe.reachable) {
  console.error(`[dev-server] Port ${port} is already used by another service.`);
  console.error(`[dev-server] Stop that process or change the Vite/Tauri dev port.`);
  process.exit(1);
} else {
  runVite();
}
