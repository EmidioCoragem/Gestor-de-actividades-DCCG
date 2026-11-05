import "server-only";
import { randomBytes, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { applicationOrigin } from "./environment";

export const formOriginCookie = "__Host-gestor-form-origin";
export const formOriginField = "gestor_form_origin";
export const originDiagnosticPath = "/diagnostico-csrf";
export const originDiagnosticCookie = "__Host-gestor-origin-diagnostic";
const authForms = new Set(["/entrar", "/recuperar-acesso", "/actualizar-palavra-passe"]);
const noncePattern = /^[a-f0-9]{64}$/;
const maximumFormBytes = 16 * 1024;

// Só o ambiente privado de desenvolvimento explicitamente identificado usa
// esta adaptação. Nenhum hostname é obtido de cabeçalhos do pedido.
export function codespacesFormOrigin(): string | null {
  if (process.env.CODESPACES !== "true") return null;
  const name = process.env.CODESPACE_NAME;
  const domain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;
  const origin = applicationOrigin();
  if (
    process.env.NODE_ENV === "production" ||
    !name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) ||
    domain !== "app.github.dev" ||
    process.env.APP_ORIGIN !== origin ||
    origin !== `https://${name}-3000.${domain}`
  ) throw new Error("Configuração de origem Codespaces inválida.");
  return origin;
}

export function originDiagnosticEnabled(): boolean {
  try {
    return process.env.GESTOR_CSRF_DIAGNOSTIC === "1" && Boolean(codespacesFormOrigin());
  } catch { return false; }
}

export const formOriginCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "strict" as const,
  path: "/",
  maxAge: 600,
};

async function submittedNonce(request: NextRequest): Promise<string | null> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!/^(multipart\/form-data;|application\/x-www-form-urlencoded(?:;|$))/i.test(contentType)) return null;
  const declaredLength = request.headers.get("content-length");
  if (declaredLength && (!/^\d+$/.test(declaredLength) || Number(declaredLength) > maximumFormBytes)) return null;
  const reader = request.clone().body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maximumFormBytes) {
        void reader.cancel().catch(() => {});
        return null;
      }
      chunks.push(value);
    }
    const body = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
    const data = await new Response(body, { headers: { "content-type": contentType } }).formData();
    // React encodeReply prefixa as entradas FormData com o identificador da
    // parte (p.ex. _1_). Formulários sem JavaScript conservam o nome original.
    const entries = [...data].filter(([key]) =>
      key === formOriginField || /^_?\d+_gestor_form_origin$/.test(key));
    return entries.length === 1 && typeof entries[0][1] === "string"
      ? entries[0][1] : null;
  } catch { return null; }
}

export type FormOriginProtection = { blocked: boolean; issuedNonce?: string };

export async function protectFormOrigin(request: NextRequest): Promise<FormOriginProtection> {
  const diagnostic = request.nextUrl.pathname === originDiagnosticPath && originDiagnosticEnabled();
  if (!authForms.has(request.nextUrl.pathname) && !diagnostic) return { blocked: false };
  let origin: string | null;
  try { origin = codespacesFormOrigin(); } catch { return { blocked: true }; }
  if (!origin) return { blocked: false };
  const cookieName = diagnostic ? originDiagnosticCookie : formOriginCookie;
  const nonces = request.cookies.getAll(cookieName);
  const cookieOccurrences = (request.headers.get("cookie") ?? "").split(";")
    .filter(part => part.trim().startsWith(`${cookieName}=`)).length;
  if (request.method === "GET") {
    if (nonces.length === 1 && noncePattern.test(nonces[0].value)) return { blocked: false };
    const issuedNonce = randomBytes(32).toString("hex");
    request.cookies.set(cookieName, issuedNonce);
    return { blocked: false, issuedNonce };
  }
  if (request.method !== "POST") return { blocked: false };

  const receivedOrigin = request.headers.get("origin");
  const publicHost = new URL(origin).host;
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = request.headers.get("host");
  // Listas, portas adicionais e cabeçalhos falsificados não são destinos de
  // confiança. O host local só é transporte; não é uma origem autorizada.
  if (
    (forwardedHost !== null && forwardedHost !== publicHost) ||
    (forwardedHost === null && host !== publicHost) ||
    cookieOccurrences !== 1 || nonces.length !== 1 || !noncePattern.test(nonces[0].value) ||
    request.headers.get("sec-fetch-site") !== "same-origin" ||
    ![origin, "http://localhost:3000", "https://localhost:3000"].includes(receivedOrigin ?? "")
  ) return { blocked: true };

  const nonce = await submittedNonce(request);
  if (!nonce || !noncePattern.test(nonce) ||
    !timingSafeEqual(Buffer.from(nonce), Buffer.from(nonces[0].value)))
    return { blocked: true };

  // A prova double-submit ligada ao cookie __Host- é indispensável: o host
  // encaminhado e Sec-Fetch-Site, isoladamente, nunca autorizam a adaptação.
  // O Next continua a executar a sua comparação CSRF após este proxy.
  if (receivedOrigin !== origin) request.headers.set("origin", origin);
  return { blocked: false };
}
