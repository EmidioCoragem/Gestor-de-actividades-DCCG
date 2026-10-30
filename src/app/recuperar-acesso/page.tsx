export const dynamic = "force-dynamic";
import Link from "next/link";
import { AuthPage } from "@/components/auth-page";
import { AuthForm } from "@/components/auth-form";
import { recoverAccess } from "@/modules/auth/actions";
import { supabaseIsConfigured } from "@/modules/auth/environment";
export const metadata = { title: "Recuperar acesso" };
export default function Page() {
  return (
    <AuthPage title="Recuperar acesso">
      <p>Indique o correio electrónico da sua conta autorizada.</p>
      <AuthForm
        action={recoverAccess}
        mode="recovery"
        disabled={!supabaseIsConfigured()}
      />
      <Link className="text-link" href="/entrar">
        Voltar à entrada
      </Link>
    </AuthPage>
  );
}
