import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { AuthPage } from "@/components/auth-page";
import { originDiagnosticCookie, originDiagnosticEnabled } from "@/modules/auth/form-origin";
import { OriginProbe } from "./probe";

export const dynamic = "force-dynamic";
export const metadata = { title: "Diagnóstico CSRF — desenvolvimento" };
export default async function Page() {
  if (!originDiagnosticEnabled()) notFound();
  const nonce = (await cookies()).get(originDiagnosticCookie)?.value;
  if (!nonce || !/^[a-f0-9]{64}$/.test(nonce)) notFound();
  return <AuthPage title="Diagnóstico CSRF">
    <p>Exclusivo de desenvolvimento. Não envia emails, não recebe palavras-passe e não contacta o Supabase. Usa uma prova exclusiva deste diagnóstico, separada dos formulários Auth.</p>
    <OriginProbe nonce={nonce} />
  </AuthPage>;
}
