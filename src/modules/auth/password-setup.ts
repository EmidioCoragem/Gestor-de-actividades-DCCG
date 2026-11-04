import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { applicationOrigin } from "./environment";

export const passwordSetupCookie = "gestor-password-setup";
export const recoveryRequestCookie = "gestor-recovery-request";
type Identity = { userId: string; sessionId: string; expiresAt: number };
type Grant = Identity & { kind: "recovery" | "invite" };

// Apenas desenvolvimento num processo Node. Não contém JWT/password/email.
// Reinício/expiração invalida a autorização; nunca há fallback para sessão normal.
const scope = globalThis as typeof globalThis & {
  __gestorPasswordSetup?: Map<string, Grant>;
  __gestorRecoveryRequests?: Map<string, { fingerprint: string; emailHash: string; expiresAt: number }>;
};
const grants = scope.__gestorPasswordSetup ??= new Map<string, Grant>();
const requests = scope.__gestorRecoveryRequests ??= new Map();
const digest = (value: string) => createHash("sha256").update(value).digest("hex");

export function verifierFingerprint(values: { name: string; value: string }[]) {
  const chunks = values.filter((cookie) => cookie.name.replace(/\.\d+$/, "").endsWith("auth-token-code-verifier") && cookie.value)
    .sort((a, b) => a.name.localeCompare(b.name));
  return chunks.length ? digest(JSON.stringify(chunks.map(({ name, value }) => [name, value]))) : null;
}

export function recoveryRequestCookieOptions(maxAge = 600) {
  return { ...passwordSetupCookieOptions(maxAge), path: "/auth/confirm" };
}

export function issueRecoveryRequest(email: string, fingerprint: string) {
  for (const [key, value] of requests) if (value.expiresAt <= Date.now()) requests.delete(key);
  if (requests.size >= 256) throw new Error("Recuperação temporariamente indisponível.");
  const nonce = randomBytes(32).toString("hex");
  requests.set(nonce, { fingerprint, emailHash: digest(email.trim().toLowerCase()), expiresAt: Date.now() + 600_000 });
  return nonce;
}

export function consumeRecoveryRequest(nonce: string | undefined, fingerprint: string | null) {
  if (!nonce || !/^[a-f0-9]{64}$/.test(nonce) || !fingerprint) return null;
  const value = requests.get(nonce);
  if (!value || value.fingerprint !== fingerprint || value.expiresAt <= Date.now()) return null;
  requests.delete(nonce);
  return { emailHash: value.emailHash };
}

export function recoveryUserMatches(email: string | undefined, emailHash: string) {
  return Boolean(email && digest(email.trim().toLowerCase()) === emailHash);
}

export function sessionIdentity(accessToken: string, verifiedUserId: string): Identity | null {
  // Chamar apenas depois de verifyOtp/exchangeCodeForSession ou getUser.
  // Esta leitura identifica a sessão já verificada; não substitui validação Auth.
  try {
    const claims = JSON.parse(Buffer.from(accessToken.split(".")[1], "base64url").toString());
    if (claims.sub !== verifiedUserId ||
        typeof claims.session_id !== "string" ||
        !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(claims.session_id) ||
        typeof claims.exp !== "number" || !Number.isFinite(claims.exp) ||
        claims.exp * 1000 <= Date.now()) return null;
    return { userId: verifiedUserId, sessionId: claims.session_id, expiresAt: claims.exp * 1000 };
  } catch { return null; }
}

export function passwordSetupCookieOptions(maxAge = 600) {
  return {
    httpOnly: true, secure: new URL(applicationOrigin()).protocol === "https:",
    sameSite: "lax" as const, path: "/actualizar-palavra-passe", maxAge,
  };
}

export function issuePasswordSetup(identity: Identity, kind: Grant["kind"]) {
  for (const [key, value] of grants)
    if (value.expiresAt <= Date.now()) grants.delete(key);
  if (grants.size >= 256) throw new Error("Definição de palavra-passe temporariamente indisponível.");
  const nonce = randomBytes(32).toString("hex");
  const expiresAt = Math.min(identity.expiresAt, Date.now() + 600_000);
  grants.set(nonce, { ...identity, expiresAt, kind });
  return { nonce, maxAge: Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)) };
}

export function consumePasswordSetup(nonce: string | undefined, identity: Identity) {
  if (!nonce || !/^[a-f0-9]{64}$/.test(nonce)) return false;
  const grant = grants.get(nonce);
  if (!grant) return false;
  if (grant.expiresAt <= Date.now()) { grants.delete(nonce); return false; }
  if (grant.userId !== identity.userId || grant.sessionId !== identity.sessionId) return false;
  // Consumo síncrono antes de updateUser: duas submissões não podem usar o mesmo grant.
  grants.delete(nonce);
  return true;
}
