import Link from "next/link";
import { AuthPage } from "@/components/auth-page";
export const metadata = { title: "Configuração de desenvolvimento" };
export default function Page() {
  return (
    <AuthPage title="Configuração necessária">
      <div className="notice">
        As rotas privadas estão protegidas. Não é possível abrir o Dashboard sem
        configuração e sessão autorizada.
      </div>
      <p>
        Configure um projecto Supabase de desenvolvimento, aplique as migrações
        e atribua o acesso inicial autorizado. Consulte a documentação da Fase 1
        no repositório. Não introduza credenciais de produção.
      </p>
      <Link className="text-link" href="/entrar">
        Ir para a entrada
      </Link>
    </AuthPage>
  );
}
