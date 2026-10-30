# Revisão final da Fase 0

## Interface e páginas

Dashboard operacional, com quatro cartões de actividades, validações, prazos e fecho mensal. Faixa institucional compacta; painéis de prioridades e acompanhamento do fecho sem valores ou ciclos inventados. Ícones SVG comuns e identificação de funcionalidades ainda não implementadas.

As onze rotas mantêm navegação e layout comuns: Dashboard, Actividades, Fecho Mensal, KPIs, Centros de Custo, Estrutura Organizacional, Hierarquia e Permissões, Planeamento e Cronograma, Relatórios, Notificações e Administração. As páginas de módulo permanecem informativas, sem CRUD ou regras operacionais.

Painel de identificação com campos indisponíveis e saída desactivada, sem autenticação ou perfis atribuídos. Catálogo dos cinco perfis e configuração visual de navegação, sem autorização real.

## Instalação: diagnóstico e limites

Ambiente verificado: Node v24.19.0, npm 11.9.0, Linux. Também executado npm 10.9.4 através de npx, usando o mesmo Node. O package.json passa a indicar Node 24 e npm 10/11; .nvmrc já indicava 24 e packageManager regista npm 11.9.0 como referência.

O lockfile original foi aceite em instalações limpas locais com npm 11.9.0 e npm 10.9.4. Por isso, o erro EUSAGE relatado no Codespaces **não foi reproduzido**. Foram solicitadas as versões e as linhas Missing/Invalid do erro original. Não há evidência suficiente para afirmar a causa exacta naquele Codespace.

A sincronização foi executada pelo npm (`npm install --package-lock-only --ignore-scripts`), sem editar entradas de dependências manualmente. Reconstituiu seis entradas transitivas opcionais bundled do Tailwind/WASM e sincronizou os requisitos Node/npm. A comparação programática confirmou zero alterações de versões nas entradas anteriores e nenhuma remoção. Estas entradas em falta constituem uma diferença de representação detectada; a sua relação causal com o EUSAGE concreto ainda não está demonstrada.

O lockfile final foi verificado com `npm ci` em duas pastas de instalação independentes do checkout, com npm 11.9.0 e npm 10.9.4. Ambos concluíram com sucesso, sem depender do node_modules da aplicação. Isto valida os ambientes testados; não comprova ainda a instalação no Codespace do utilizador.

Não recorrer a npm install para ocultar um futuro erro de npm ci. Guardar a mensagem exacta e verificar versões, branch, alterações locais e lockfile antes de decidir a correcção.

## Segurança e limitações

Sem credenciais reais, ligação a produção, autenticação, dados empresariais, cálculos de KPIs ou operações contabilísticas. Sem alteração de recursos Supabase, publicação ou merge. A API GitHub permanece sujeita à política de rede do ambiente; o push Git e a edição da descrição do PR são operações distintas.

A sandbox exige execução autorizada para rede, servidores e Chromium. O navegador instalado é usado nos testes, sem descarregar nem contornar restrições do CDN. ESLint 9 continua a emitir aviso de descontinuação no npm; não foi actualizado para evitar alterações de dependências fora do âmbito.

## Actualizar o Codespaces

1. No terminal, executar `git status`. Se houver trabalho local, não apagar nem efectuar reset; preservá-lo antes de actualizar. Se houver alterações do package-lock produzidas pelo npm install anterior, não as substituir sem verificar.
2. Com a árvore de trabalho limpa: `git switch fase-0-fundacao` e `git pull --ff-only origin fase-0-fundacao`.
3. Executar `nvm install 24` e `nvm use 24` no terminal Cloud. Se nvm não existir, verificar a imagem do Codespace; não é necessário instalar nada no computador pessoal.
4. Confirmar `node --version` e `npm --version`. Para usar a versão npm exacta verificada: `npx --yes npm@11.9.0 ci`.
5. Executar `npm run dev`. No separador Ports, abrir a porta 3000 no navegador mantendo a visibilidade Private.
6. Para parar, usar Ctrl+C. Não fazer merge nem publicar para visualizar a revisão.

A Fase 1 permanece dependente da aprovação explícita do responsável.

## Resultados desta revisão

- `npm run lint`: aprovado.
- `npm run typecheck`: aprovado.
- `npm test`: 8 testes aprovados em 2 ficheiros, incluindo configuração visual de navegação e integração Supabase não activada.
- `npm run build`: aprovado; onze páginas e página de recuperação compiladas.
- `CI=true PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e`: 42 testes aprovados, 14 por formato (computador, tablet e telemóvel). Incluem os dez módulos e Dashboard, navegação activa, estado não implementado, recuperação 404, cartões operacionais, painel de identificação e ausência de sessão.
- O primeiro ensaio de navegador teve 39 aprovados e 3 falhas num selector textual do teste da identificação. O selector foi corrigido para o elemento summary, mantendo todas as verificações; a suite completa seguinte passou.
- Inspecção visual de capturas nos três tamanhos e painel de identificação: sem erros de execução JavaScript observados.
- `npm ci` limpo com Node 24.19.0/npm 11.9.0 e Node 24.19.0/npm 10.9.4: aprovados.
- Comparação das versões do lockfile: zero actualizações das entradas anteriores e nenhuma remoção.

Os testes desta revisão foram executados no ambiente Cloud. Não foram executados dentro do Codespace do utilizador nem como GitHub Actions.

## Actualização da identidade oficial

O produto passa a chamar-se **Gestor de Actividades**, com subtítulo **Gestão Integrada**. Foram actualizados o menu lateral, a letra G do logótipo mantendo o estilo, o Dashboard, o cabeçalho e rodapé partilhados, os títulos do navegador, applicationName e descrição dos metadados, o rótulo do Codespaces e as mensagens de arranque.

A documentação corrente identifica o novo nome. A especificação original v1.4 permanece integralmente preservada após uma nota de contexto; a entrega inicial está identificada como documento histórico. O repositório, o identificador técnico npm e todas as funcionalidades, módulos e limites da Fase 0 mantêm-se.

Verificações desta alteração: ESLint, TypeScript, 11 testes unitários e compilação aprovados; 45 testes Playwright aprovados, incluindo novo nome, subtítulo, logótipo G, metadados e títulos de todos os módulos em computador, tablet e telemóvel. Não foram alteradas dependências nem lockfile. O script de pré-visualização foi executado com sucesso e reconheceu a nova identidade na resposta HTTP.
