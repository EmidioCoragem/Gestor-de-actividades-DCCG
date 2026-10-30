#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."

# A ACL da porta pertence ao GitHub, não ao schema Dev Containers.
if [[ "${CODESPACES:-}" == "true" ]]; then
  if [[ "${PORTAL_PREVIEW_PRIVATE_CONFIRMED:-}" != "1" ]]; then
    if [[ -z "${CODESPACE_NAME:-}" ]] || ! command -v gh >/dev/null 2>&1 ||
      ! gh codespace ports visibility 3000:private --codespace "$CODESPACE_NAME"; then
      cat >&2 <<'MESSAGE'
Não foi possível confirmar a porta privada através da API do GitHub.
No separador Ports, confirme/defina a porta 3000 como Private.
Só depois execute: PORTAL_PREVIEW_PRIVATE_CONFIRMED=1 bash .devcontainer/start-preview.sh
Não altere a porta para Public nem partilhe credenciais.
MESSAGE
      exit 1
    fi
  fi
fi

if [[ ! -f node_modules/next/package.json ]]; then
  npm ci
fi
node .devcontainer/start-preview.mjs
