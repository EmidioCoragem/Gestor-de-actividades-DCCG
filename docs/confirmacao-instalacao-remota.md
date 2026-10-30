# Confirmação da instalação a partir do GitHub

## Objectivo e origem dos ficheiros

O utilizador reportou sucesso após npm install e depois npm ci no Codespaces, com Node 24.22.2 e npm 11.19.1. O diagnóstico abaixo distingue essa instalação local de uma instalação baseada exclusivamente no código enviado ao GitHub.

Foi executado git fetch da branch fase-0-fundacao. O commit remoto obtido foi `19413529659b812d97f02dc70f5c1d46ca5ce00d`. Os ficheiros foram extraídos desse objecto remoto por git archive para uma pasta nova, fora do checkout de desenvolvimento, sem node_modules, sem .env local e sem copiar package.json/package-lock.json da pasta de trabalho.

## Resultado reproduzido

- Node: 24.22.2; npm: 11.19.1, disponibilizados temporariamente sem alterar as versões da máquina.
- npm ci numa pasta sem node_modules e com cache de dependências inicialmente vazia: sucesso, 415 pacotes, 14 segundos nesta execução.
- ignore-scripts: false; o postinstall de unrs-resolver 1.12.2 executou com sucesso.
- SHA-256 do lockfile extraído do GitHub, antes e depois da instalação: `bf76da7a745730c8a19a4ab8fd9ffdca943dc351690d8613d7a2dc7dad51f932`.
- npm audit: zero vulnerabilidades reportadas em todos os níveis. Não representa garantia permanente contra vulnerabilidades futuras.
- ESLint, TypeScript, 8 testes Vitest e compilação aprovados nesta instalação remota.

Não foi necessário executar npm install antes de npm ci, modificar o lockfile ou utilizar node_modules preexistente. O cache inicial usado para a instalação das dependências era novo; o mecanismo npx que disponibilizou Node/npm é separado desse cache.

## Relação com o erro original

O commit 1941352 já enviado ao GitHub repôs as entradas transitivas bundled do Tailwind/WASM para @emnapi/core, @emnapi/runtime e @emnapi/wasi-threads, além dos seus auxiliares. Estes nomes coincidem com os pacotes citados agora pelo utilizador. Não houve actualização das versões anteriormente fixadas.

O lockfile original do commit 0715eeb também foi submetido a npm ci --dry-run --ignore-scripts com Node 24.22.2/npm 11.19.1; essa validação passou. Portanto, não foi reproduzido o EUSAGE original e não há base para atribuir a causa exacta apenas à versão npm ou aos pacotes indicados. O dry-run original não é apresentado como instalação completa do commit antigo.

Não há acesso directo ao sistema de ficheiros do Codespaces do utilizador. Não é possível afirmar se o seu npm install alterou o ficheiro local nem se a alteração foi idêntica à reposta no commit 1941352. É possível afirmar que o lockfile remoto actual instala de forma independente dessas alterações locais.

## Como comparar no Codespaces sem perder trabalho

Executar no terminal, dentro do repositório:

```sh
git status --short
git fetch origin
git diff --exit-code origin/fase-0-fundacao -- package.json package-lock.json
```

Se o último comando não apresentar diferenças e devolver sucesso, os dois ficheiros locais são iguais aos guardados nessa branch remota. Se apresentar diferenças, não executar reset nem substituir ficheiros: rever o diff para decidir se há alterações locais que precisam de ser preservadas.

Para confirmar o checksum individual do lockfile:

```sh
sha256sum package-lock.json
git show origin/fase-0-fundacao:package-lock.json | sha256sum
```

Checksums iguais demonstram conteúdo idêntico; não demonstram se houve alterações no passado que depois foram substituídas.

## Avisos e prevenção

ESLint 9.39.5 assinala descontinuação. Mantém-se a versão já fixada e compatível com a configuração validada; não se introduzem actualizações desnecessárias nesta revisão.

O aviso install-scripts do npm 11.19.1 informa que unrs-resolver tem um postinstall ainda não coberto por allowScripts. O script prepara a ligação nativa apropriada à plataforma através de napi-postinstall. Nesta execução o script correu e passou; não houve desactivação de scripts ou aprovações automáticas de novos pacotes para esconder o aviso.

O novo workflow .github/workflows/fase-0.yml usa Node 24.22.2 e npm 11.19.1. Em Pull Requests para main verifica npm ci, ausência de alterações nos manifestos, lint, tipos, testes unitários, build e Playwright. Tem apenas permissão de leitura do repositório e não contém passos de deploy nem acesso a Supabase. O resultado no GitHub Actions só pode ser considerado aprovado depois da execução efectiva; os resultados locais não substituem esse estado.

A interface recebe apenas um ajuste de acessibilidade: o painel de identificação fecha com Escape, devolvendo foco ao controlo, e fecha ao clicar/tocar fora. Não existe autenticação real. A Fase 1, merge e publicação continuam fora do âmbito autorizado.

## Confirmação final após envio das alterações

O commit `fc946f36d4b5859a098ccdd70ee54d73860bed76` foi enviado e obtido novamente por git fetch. Outro git archive produziu uma segunda pasta limpa, sem node_modules. Executou-se nela, com Node 24.22.2 e npm 11.19.1:

1. npm ci: aprovado, 415 pacotes, sem executar npm install antes.
2. ESLint: aprovado.
3. TypeScript: aprovado.
4. Vitest: 8 testes aprovados.
5. Build Next.js: aprovado para todas as rotas.
6. Playwright com Chromium local: 45 testes aprovados, 15 por formato (computador, tablet e telemóvel), incluindo Escape, devolução de foco e fecho do painel por toque fora.
7. SHA-256 do package-lock.json após todos os comandos: permanece `bf76da7a745730c8a19a4ab8fd9ffdca943dc351690d8613d7a2dc7dad51f932`.

A segunda instalação usou apenas o cache de pacotes verificados da primeira; não reutilizou node_modules nem alterações de manifestos. Esta confirmação usa o código efectivamente enviado ao GitHub. O commit seguinte acrescenta apenas este registo documental, sem mudar aplicação, testes, workflow ou dependências.

A API GitHub permanece bloqueada com 403 neste ambiente. O envio da branch está confirmado por Git; a descrição do PR e o resultado da execução do workflow no GitHub não puderam ser consultados/alterados por API. O PR recebe os commits pela branch fase-0-fundacao. Nenhum merge foi efectuado e main mantém o commit original.
