export const dynamic = "force-dynamic";
import Link from "next/link";
import { AuthPage } from "@/components/auth-page";
import { AuthForm } from "@/components/auth-form";
import { changePassword } from "@/modules/auth/actions";
import { supabaseIsConfigured } from "@/modules/auth/environment";
export const metadata = { title: "Actualizar palavra-passe" };
export default function Page() {
  return (
    <AuthPage title="Definir palavra-passe">
      <p>
        É necessária uma sessão autenticada. Para convite ou recuperação,
        utilize a ligação verificada enviada por correio electrónico. Use pelo
        menos 12 caracteres.
      </p>
      <AuthForm
        action={changePassword}
        mode="password"
        disabled={!supabaseIsConfigured()}
      />
      <Link className="text-link" href="/entrar">
        Voltar à entrada
      </Link>
    </AuthPage>
  );
}
