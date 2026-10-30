import { functionalProfiles } from "@/modules/navigation";

export function UserIdentification() {
  return (
    <details className="user-identification">
      <summary>
        <span className="user-avatar" aria-hidden="true">
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 22v-3a8 8 0 0 1 16 0v3" />
          </svg>
        </span>
        <span>
          Identificação do utilizador<small>Sem sessão autenticada</small>
        </span>
        <span aria-hidden="true">⌄</span>
      </summary>
      <div className="user-panel">
        <h2>Identificação futura</h2>
        <p>Disponível após a implementação da autenticação na Fase 1.</p>
        <dl>
          {[
            "Nome do utilizador",
            "Cargo",
            "Departamento",
            "Perfil funcional",
          ].map((label) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>Não disponível</dd>
            </div>
          ))}
        </dl>
        <p className="profile-note">
          Perfis previstos: {functionalProfiles.join(", ")}. Nenhum perfil está
          atribuído nesta versão.
        </p>
        <button type="button" disabled aria-describedby="session-note">
          Terminar sessão
        </button>
        <p id="session-note">
          Opção indisponível: não existe sessão autenticada.
        </p>
      </div>
    </details>
  );
}
