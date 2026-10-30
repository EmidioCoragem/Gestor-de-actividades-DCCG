# Pré-visualização privada no GitHub Codespaces

## Diagnóstico

Next.js já escuta em 0.0.0.0, o que é correcto para receber ligações do encaminhamento. «Ready» comprova o servidor, não o túnel GitHub. A configuração anterior não declarava forwardPorts nem Dev Container; dependia da detecção automática do editor. Agora a porta 3000 é explícita tanto no servidor como no Dev Container, evitando divergência silenciosa para outra porta.

Não existe acesso administrativo ao Codespace do utilizador neste ambiente. A ausência de encaminhamento pode também resultar de configuração ainda não aplicada, falha do serviço de túneis, política da organização ou estado do editor. Não foi confirmada uma causa única para a tentativa manual que falhou.

## Configuração incluída

- Imagem oficial Microsoft de desenvolvimento com Node 24, tag 5.2.5-24-bookworm, confirmada no catálogo e no manifesto OCI (Linux amd64/arm64).
- Feature oficial github-cli para o comando de privacidade.
- forwardPorts: 3000, rótulo «Gestor de Actividades — Dashboard», protocolo interno HTTP e acção openBrowser. A ligação externa autenticada é gerida pelo GitHub.
- postCreateCommand: npm ci.
- postAttachCommand: arranque automático com bash .devcontainer/start-preview.sh.
- npm run dev: next dev --hostname 0.0.0.0 --port 3000.
- O script aguarda HTTP com conteúdo do portal, guarda registos em node_modules/.cache/portal-preview/server.log e reutiliza um servidor que já responda. Não termina processos existentes nem muda de porta.

O schema Dev Containers não suporta visibility em portsAttributes. A privacidade é uma ACL do GitHub. No Codespaces, antes de iniciar o servidor, o script pede explicitamente `gh codespace ports visibility 3000:private --codespace "$CODESPACE_NAME"`. Nunca pede public ou org. Se a API falhar, o arranque interrompe com instruções. Não se pressupõe que uma porta anteriormente configurada esteja privada apenas porque a nova porta normalmente o seria por defeito.

## Aplicar a um Codespace existente — uma vez

1. Se o terminal ainda estiver a executar npm run dev, pará-lo com Ctrl+C.
2. Executar git status --short. Se houver alterações próprias, preservá-las antes de actualizar; não efectuar reset nem apagar ficheiros.
3. Na branch fase-0-fundacao, com a pasta de trabalho limpa, executar:

   ```sh
   git pull --ff-only origin fase-0-fundacao
   ```

4. Abrir a paleta de comandos (Ctrl+Shift+P; no Mac, Cmd+Shift+P). Procurar e seleccionar **Codespaces: Rebuild Container**. Confirmar a reconstrução se solicitado. Não escolher Delete Codespace. A reconstrução aplica a imagem, as portas e os comandos novos; reiniciar apenas o Next.js ou o terminal não aplica o devcontainer.json.
5. Aguardar a instalação e a ligação ao editor. O arranque é automático; o browser pode pedir autorização para abrir a nova aba. No separador **Ports**, a porta **3000** terá o rótulo **Gestor de Actividades — Dashboard**. Confirmar **Private** e clicar no ícone de globo **Open in Browser** se a aba não abrir automaticamente.

Um novo Codespace criado a partir da branch usa esta configuração desde a criação. Não é preciso instalar aplicações no computador nem fazer merge.

## Se o comando automático de privacidade for recusado

O token disponibilizado pelo GitHub pode não permitir alterar a ACL das portas. Não enviar tokens no chat nem iniciar autenticação manual por tentativa.

1. No Codespace, abrir **Ports** e, na porta 3000, seleccionar **Port Visibility → Private** (ou confirmar que já está Private).
2. Só após esta confirmação, executar:

   ```sh
   PORTAL_PREVIEW_PRIVATE_CONFIRMED=1 bash .devcontainer/start-preview.sh
   ```

A confirmação vale só para esta execução; não é guardada como uma garantia para sessões futuras. Se a porta voltar a ser alterada por outra pessoa, a configuração no GitHub é a autoridade. Não seleccionar Public nem Private to Organization.

Se Ports continuar a indicar «No forwarded ports» mesmo após a reconstrução, usar **Developer: Reload Window** na paleta. Se persistir, consultar **Codespaces: View Creation Log** e a mensagem completa da tentativa de encaminhamento. Esse caso exige diagnóstico do Codespace/serviço GitHub e não pode ser confirmado nem reparado a partir desta máquina Cloud. Não existe instrução para contornar políticas, criar túnel público ou publicar a aplicação.

## Validação e limites

Schemas oficiais de Dev Containers, Codespaces e VS Code: configuração válida. Scripts Bash e Node: sintaxe válida. Testes automatizados verificam pedido de porta privada, recusa de arranque após falha da API e confirmação manual explícita. Arranque real e repetição idempotente foram exercitados nesta máquina; GET / respondeu com o Dashboard.

A imagem foi confirmada por manifesto no registo; o container completo e o túnel autenticado não foram construídos/exercitados aqui. A reconstrução e a confirmação de Ports no Codespace do utilizador são necessárias para validar o resultado final da plataforma. Testes com gh simulado não provam permissões da API real.

O repositório mantém a visibilidade existente. Não há publicação em produção, autenticação do portal, dados reais ou avanço para a Fase 1. A abertura usa a autenticação do próprio GitHub para a porta privada; não confundir com autenticação funcional do portal.

Referências oficiais: https://containers.dev/implementors/json_reference/ e https://docs.github.com/en/codespaces/developing-in-a-codespace/forwarding-ports-in-your-codespace .

Resultados desta alteração: ESLint e TypeScript aprovados; Vitest com 11 testes aprovados; build Next.js aprovado; Playwright com 45 testes aprovados no servidor iniciado pelo novo script. A validação dos schemas principais passou com os ficheiros oficiais descarregados para diagnóstico. Não foram alteradas dependências nem o package-lock.json.
