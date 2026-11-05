"use server";
import { timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import {
  codespacesFormOrigin, formOriginField, originDiagnosticCookie, originDiagnosticEnabled,
} from "@/modules/auth/form-origin";

export type DiagnosticResult = { accepted: boolean };

// Sem SDK, email, sessão Auth, PKCE ou operação de negócio.
export async function probeOrigin(
  _state: DiagnosticResult, form: FormData,
): Promise<DiagnosticResult> {
  if (!originDiagnosticEnabled()) return { accepted: false };
  const requestHeaders = await headers();
  const nonce = (await cookies()).get(originDiagnosticCookie)?.value;
  const submitted = form.getAll(formOriginField);
  const value = submitted[0];
  if (
    requestHeaders.get("origin") !== codespacesFormOrigin() ||
    requestHeaders.get("sec-fetch-site") !== "same-origin" ||
    !nonce || !/^[a-f0-9]{64}$/.test(nonce) ||
    submitted.length !== 1 || typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value) ||
    !timingSafeEqual(Buffer.from(nonce), Buffer.from(value))
  ) return { accepted: false };
  return { accepted: true };
}
