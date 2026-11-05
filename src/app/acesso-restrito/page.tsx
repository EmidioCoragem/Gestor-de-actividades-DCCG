import { AuthPage } from "@/components/auth-page";
import { ProtectedAuthForm } from "@/components/protected-auth-form";
import { signOutFromRestricted } from "@/modules/auth/actions";
export const dynamic = "force-dynamic";
export const metadata = { title: "Acesso restrito" };
export default function Page() {
  return (
    <AuthPage title="Acesso não autorizado">
      <p>
        A conta não está activa, o âmbito não permite esta página ou a
        configuração de permissões ainda não está disponível. Contacte o
        responsável de acessos.
      </p>
      <ProtectedAuthForm action={signOutFromRestricted} mode="logout" />
    </AuthPage>
  );
}
