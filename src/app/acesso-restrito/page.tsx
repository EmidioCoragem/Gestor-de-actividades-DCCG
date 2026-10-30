import { AuthPage } from "@/components/auth-page";
import { signOut } from "@/modules/auth/actions";
export const metadata = { title: "Acesso restrito" };
export default function Page() {
  return (
    <AuthPage title="Acesso não autorizado">
      <p>
        A conta não está activa, o âmbito não permite esta página ou a
        configuração de permissões ainda não está disponível. Contacte o
        responsável de acessos.
      </p>
      <form action={signOut}>
        <button className="button">Terminar sessão e voltar à entrada</button>
      </form>
    </AuthPage>
  );
}
