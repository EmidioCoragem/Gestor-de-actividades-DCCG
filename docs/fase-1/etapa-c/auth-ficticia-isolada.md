# Auth fictícia em paralelo com o portal privado

A suite Auth configura o Next em 127.0.0.1:3100, Auth HTTPS fictício em 4343 e controlo em 4344. Importar os projectos da configuração normal não importa o seu webServer: o webServer Auth substitui-o. A configuração anterior, contudo, arrancava Next no mesmo checkout e partilhava .next/dev/lock, caches, tipos e tsconfig com o Next da porta 3000. Mudar apenas a porta não isolava esses ficheiros. Sem o log completo do incidente não se atribui ao conflito de lock uma mensagem de erro remoto não observada.

A fixture passa a copiar apenas src, configurações e manifests necessários para uma pasta temporária. Não copia .env, .git, .next ou next-env.d.ts do portal. Reutiliza as dependências instaladas através de symlink e usa Webpack apenas no Next fictício, que suporta essa resolução fora da pasta temporária. O bundler e a configuração do portal real não mudam. As escritas de tipos, lock e compilação pertencem à cópia.

Os bindings Supabase herdados são removidos do ambiente do Next fictício, substituídos por URL loopback e chave fictícia. O diagnóstico está desligado e o certificado TLS temporário é a única confiança adicional. O navegador Playwright usa contextos novos e não importa cookies, storageState ou o perfil pessoal. As rotas de teste bloqueiam destinos externos; os endpoints Auth e de controlo são fixos em loopback. Não é enviado correio real nem executada qualquer migração por esta suite. A fixture só termina o processo filho que criou, nunca processos encontrados por porta.

O script tests/run-auth-isolated.sh permite executar um commit da branch Fase 1 sem fazer checkout, merge ou restore no portal activo. Cria um git archive em /tmp, liga as dependências existentes e executa a suite a partir dessa cópia. Verifica antes e depois a identidade e instante de arranque do PID protegido na porta 3000, os hashes dos inputs Next do portal e as referências das branches locais/stashes. Não chama endpoints do portal real nem lê os seus cookies ou credenciais. Se os manifests de dependências divergirem ou as portas de teste estiverem ocupadas, deve-se parar, sem instalar dependências no checkout activo ou terminar processos.

No Codespaces, obter primeiro o SHA completo do commit desta correcção e substituir COMMIT_VALIDADO abaixo. O PID 33173 é apenas o identificado pelo responsável neste ensaio; se tiver mudado, parar e voltar a identificá-lo. Manter a porta 3000 Private e não repetir login/logout AT.

```bash
cd /workspaces/Gestor-de-actividades-DCCG
test "$(git branch --show-current)" = "fase-1-autenticacao-permissoes" || exit 1
git fetch origin fase-1-autenticacao-permissoes
ALVO="COMMIT_VALIDADO"
EXECUTOR=$(mktemp /tmp/gestor-auth-executor-XXXXXX.sh)
git show "$ALVO:tests/run-auth-isolated.sh" > "$EXECUTOR"
bash "$EXECUTOR" "$ALVO" 33173
```

Não actualizar o checkout activo com o commit durante este ensaio: ele pode estar a executar uma versão anterior, e uma actualização poderia accionar HMR. A saída identifica separadamente a versão testada e a pasta de resultados. O script não afirma ter actualizado o servidor real. Os ficheiros de resultados e a cópia ficam na pasta temporária para revisão, sem tokens reais.

A suite actual inclui 39 casos: os 33 anteriores e seis novos de logout. O timeout por caso passa de 30 para 60 segundos: a primeira execução isolada encontrou um timeout de navegação na compilação inicial de /acesso-restrito, antes do clique; os outros 38 casos passaram. Não se adicionaram retries, exclusões ou tolerância a falhas de segurança. Uma execução nova completa continua necessária para apresentar aprovação desta configuração.

Testes unitários verificam que escritas na cópia não alteram os tipos, tsconfig, fonte ou lock do portal, e que o ambiente fictício não conserva os bindings Supabase herdados. A aprovação desta suite não comprova a continuidade da sessão AT, o funcionamento do logout no túnel ou a saúde HTTP do portal real; essas verificações são separadas e não devem provocar operações Auth durante este ensaio.
