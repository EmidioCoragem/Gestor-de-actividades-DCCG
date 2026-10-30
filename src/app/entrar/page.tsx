export const dynamic = "force-dynamic";
import Link from "next/link";
import { AuthPage } from "@/components/auth-page";
import { AuthForm } from "@/components/auth-form";
import { signIn } from "@/modules/auth/actions";
import { supabaseIsConfigured } from "@/modules/auth/environment";
export const metadata = { title: "Entrar" };
export default function Page() {
  const configured = supabaseIsConfigured();
  return (
    <AuthPage title="Entrar no sistema">
      <p>
        Utilize a conta autorizada pela administração. Não existe registo
        público.
      </p>
      {!configured && (
        <div className="notice">
          Supabase de desenvolvimento ainda não configurado. A autenticação não
          está operacional.
        </div>
      )}
      <AuthForm action={signIn} mode="login" disabled={!configured} />
      <Link className="text-link" href="/recuperar-acesso">
        Recuperar acesso
      </Link>
      {!configured && (
        <p>
          <Link href="/configuracao" className="text-link">
            Consultar configuração necessária
          </Link>
        </p>
      )}
    </AuthPage>
  );
}
