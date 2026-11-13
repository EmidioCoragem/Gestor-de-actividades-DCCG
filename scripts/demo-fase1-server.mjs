// HTTP autónomo de leitura: dados fictícios em memória, sem Next, SDK ou ficheiros.
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import {
  DEMO_PERSONAS,
  DEMO_SECTIONS,
  getDemoScenario,
  getDemoSection,
  isDemoPersonaId,
  isDemoSectionId,
} from "../src/modules/demo/data.ts";
import {
  DEMO_CSS,
  renderDemoEntry,
  renderDemoPage,
} from "../src/components/demo/render.ts";

const securityHeaders = {
  "Cache-Control": "no-store",
  "Content-Security-Policy": "default-src 'none'; style-src 'self'; script-src 'none'; connect-src 'none'; form-action 'none'; frame-ancestors 'none'; base-uri 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

function failurePage(message) {
  // message provém exclusivamente das constantes internas abaixo.
  return `<!doctype html><html lang="pt-AO"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Demonstração fictícia — pedido indisponível</title><link rel="stylesheet" href="/demo.css"></head><body><main><h1>Demonstração fictícia</h1><p>${message}</p><p><a href="/">Voltar à entrada da demonstração</a></p></main></body></html>`;
}

export function createDemoServer() {
  const server = createServer((request, response) => {
    function send(status, body, contentType = "text/html; charset=utf-8", extraHeaders = {}) {
      response.writeHead(status, {
        ...securityHeaders,
        "Content-Type": contentType,
        "Content-Length": Buffer.byteLength(body),
        ...extraHeaders,
      });
      response.end(request.method === "HEAD" ? undefined : body);
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      send(405, failurePage("Esta demonstração permite apenas consultas. Nenhuma alteração foi aplicada."), undefined, {
        Allow: "GET, HEAD",
        Connection: "close",
      });
      return;
    }

    try {
      const target = request.url ?? "";
      if (!target.startsWith("/") || target.startsWith("//") || target.length > 2048) {
        send(400, failurePage("O pedido não corresponde a um cenário válido da demonstração."));
        return;
      }
      // Nunca usar Host, URL ou parâmetros do pedido para gerar destinos externos.
      const url = new URL(target, "http://127.0.0.1");
      if (url.hash) {
        send(400, failurePage("O pedido não corresponde a um cenário válido da demonstração."));
        return;
      }
      if (url.pathname === "/" || url.pathname === "/demo.css") {
        if (url.searchParams.size !== 0) {
          send(400, failurePage("O pedido não corresponde a um cenário válido da demonstração."));
          return;
        }
        if (url.pathname === "/demo.css") send(200, DEMO_CSS, "text/css; charset=utf-8");
        else send(200, renderDemoEntry(DEMO_PERSONAS));
        return;
      }
      if (url.pathname !== "/demonstracao") {
        send(404, failurePage("Esta página não faz parte da demonstração fictícia."));
        return;
      }
      if (
        url.searchParams.size !== 2 ||
        url.searchParams.getAll("persona").length !== 1 ||
        url.searchParams.getAll("pagina").length !== 1 ||
        [...url.searchParams.keys()].some((key) => key !== "persona" && key !== "pagina")
      ) {
        send(400, failurePage("Escolha uma identidade e uma página válidas na entrada da demonstração."));
        return;
      }
      const persona = url.searchParams.get("persona");
      const page = url.searchParams.get("pagina");
      if (!isDemoPersonaId(persona) || !isDemoSectionId(page)) {
        send(400, failurePage("Escolha uma identidade e uma página válidas na entrada da demonstração."));
        return;
      }
      const scenario = getDemoScenario(persona);
      const section = getDemoSection(persona, page);
      send(section.allowed ? 200 : 403, renderDemoPage({
        scenario,
        section,
        sections: DEMO_SECTIONS,
        currentSection: page,
      }));
    } catch {
      // Sem detalhes internos, URLs, cabeçalhos ou configuração na resposta/log.
      send(500, failurePage("A demonstração está temporariamente indisponível. Nenhum dado real foi consultado."));
    }
  });
  server.requestTimeout = 10_000;
  server.headersTimeout = 10_000;
  server.keepAliveTimeout = 5_000;
  server.maxRequestsPerSocket = 100;
  server.maxConnections = 128;
  return server;
}

function run() {
  if (Number(process.versions.node.split(".")[0]) !== 24) {
    console.error("A demonstração requer Node.js 24.");
    process.exitCode = 1;
    return;
  }
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === "--help") {
    console.log("Usar: node scripts/demo-fase1.mjs [--port 3000]. Dados inteiramente fictícios; apenas leitura em 127.0.0.1.");
    return;
  }
  let port = 3000;
  if (args.length !== 0) {
    const rawPort = args.length === 2 && args[0] === "--port" ? args[1] :
      args.length === 1 && args[0].startsWith("--port=") ? args[0].slice(7) : "";
    if (!/^\d{1,5}$/.test(rawPort) || Number(rawPort) < 1 || Number(rawPort) > 65535) {
      console.error("Porta inválida. Usar --port com um número entre 1 e 65535.");
      process.exitCode = 1;
      return;
    }
    port = Number(rawPort);
  }
  const server = createDemoServer();
  server.once("error", (error) => {
    console.error(error.code === "EADDRINUSE"
      ? "A porta escolhida está ocupada. A demonstração não foi iniciada e nenhum processo existente foi alterado. Escolha outra porta com --port."
      : "Não foi possível abrir a porta local da demonstração.");
    process.exitCode = 1;
  });
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.once(signal, () => {
      server.close();
      server.closeAllConnections();
    });
  }
  server.listen(port, "127.0.0.1", () => {
    console.log(`Demonstração fictícia disponível em http://127.0.0.1:${port}. Apenas leitura; sem Supabase. No Codespaces, manter o encaminhamento da porta Private.`);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) run();
