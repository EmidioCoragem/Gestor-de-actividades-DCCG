"use client";
import { useActionState, useState } from "react";
import { probeOrigin } from "./actions";

export function OriginProbe({ nonce }: { nonce: string }) {
  const [result, action, pending] = useActionState(probeOrigin, { accepted: false });
  const [negative, setNegative] = useState("");
  const [checking, setChecking] = useState(false);
  async function alteredProof() {
    setChecking(true);
    try {
      const form = new FormData();
      form.set("gestor_form_origin", (nonce[0] === "a" ? "b" : "a") + nonce.slice(1));
      const response = await fetch("/diagnostico-csrf", {
        method: "POST", body: form, credentials: "same-origin", redirect: "error",
        signal: AbortSignal.timeout(15000),
      });
      const rejected = response.status === 403 && response.headers.get("x-gestor-csrf-diagnostic") === "rejected";
      setNegative(`Prova adulterada: HTTP ${response.status}${rejected ? " — rejeitada pela aplicação" : " — rejeição pela aplicação não confirmada"}`);
      await response.body?.cancel();
    } catch { setNegative("Diagnóstico interrompido: não repetir automaticamente."); }
    finally { setChecking(false); }
  }
  return <>
    <form action={action} className="data-form">
      <input type="hidden" name="gestor_form_origin" value={nonce} />
      <button className="button" disabled={pending || checking}>Testar POST de diagnóstico</button>
      <p role="status">{result.accepted ? "POST de diagnóstico aceite pela aplicação." : "POST legítimo ainda não confirmado."}</p>
    </form>
    <button className="button" disabled={pending || checking || !result.accepted} onClick={alteredProof}>Testar prova CSRF adulterada</button>
    <p role="status">{negative}</p>
    <p>O navegador controla Origin. Este segundo teste altera a prova CSRF, não falsifica esse cabeçalho. A origem falsificada é testada separadamente em pedidos fictícios locais.</p>
  </>;
}
