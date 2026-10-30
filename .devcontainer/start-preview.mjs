import { spawn } from "node:child_process";
import { mkdir, open } from "node:fs/promises";
import { createConnection } from "node:net";
import { setTimeout as delay } from "node:timers/promises";

const port = 3000;
const logDirectory = "node_modules/.cache/portal-preview";
const logPath = `${logDirectory}/server.log`;

async function isListening() {
  return new Promise((resolve) => {
    const socket = createConnection({ host: "127.0.0.1", port });
    const finish = (value) => {
      socket.destroy();
      resolve(value);
    };
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
    socket.setTimeout(1000, () => finish(false));
  });
}

async function portalResponds() {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/`, {
      signal: AbortSignal.timeout(3000),
    });
    return (
      response.ok && (await response.text()).includes("Gestor de Actividades")
    );
  } catch {
    return false;
  }
}

if (await isListening()) {
  if (!(await portalResponds())) {
    console.error(
      "A porta 3000 já está ocupada ou o portal não responde. Não foi iniciado outro servidor nem terminado qualquer processo. Verifique o terminal existente.",
    );
    process.exitCode = 1;
  } else {
    console.log(
      "O Gestor de Actividades já responde na porta 3000. Abra Ports → Gestor de Actividades — Dashboard → Open in Browser.",
    );
  }
} else {
  await mkdir(logDirectory, { recursive: true });
  const log = await open(logPath, "a");
  const child = spawn("npm", ["run", "dev"], {
    detached: true,
    stdio: ["ignore", log.fd, log.fd],
  });
  let failed = false;
  child.on("error", () => {
    failed = true;
  });
  child.on("exit", (code) => {
    if (code !== null) failed = true;
  });
  child.unref();
  await log.close();
  let ready = false;
  for (let attempt = 0; attempt < 60 && !failed; attempt++) {
    if (await portalResponds()) {
      ready = true;
      break;
    }
    await delay(1000);
  }
  if (!ready) {
    console.error(
      `O portal não ficou disponível. Consulte ${logPath}. Não foi escolhida outra porta automaticamente.`,
    );
    process.exitCode = 1;
  } else {
    console.log(
      `Dashboard pronto na porta 3000. Abra Ports → Gestor de Actividades — Dashboard → Open in Browser. Registo: ${logPath}`,
    );
  }
}
