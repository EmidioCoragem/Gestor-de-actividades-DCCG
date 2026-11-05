#!/usr/bin/env bash
set -euo pipefail

# Executar a partir do checkout Fase 1, sem actualizar os ficheiros do portal.
cd "$(git rev-parse --show-toplevel)"
test "$(git branch --show-current)" = "fase-1-autenticacao-permissoes"
revision="${1:?Indicar SHA completo da versao a testar}"
portal_pid="${2:?Indicar PID do Next a preservar}"
[[ "$revision" =~ ^[a-f0-9]{40}$ && "$portal_pid" =~ ^[0-9]+$ ]]
git merge-base --is-ancestor "$revision" origin/fase-1-autenticacao-permissoes

portal_state() {
  node - "$portal_pid" "$PWD" <<'JS'
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const [pid, root] = process.argv.slice(2);
const path = `/proc/${pid}`;
const cwd = fs.readlinkSync(`${path}/cwd`);
const name = fs.readFileSync(`${path}/comm`, "utf8").trim();
const stat = fs.readFileSync(`${path}/stat`, "utf8");
const start = stat.slice(stat.lastIndexOf(")") + 2).trim().split(/\s+/)[19];
const listeners = execFileSync("ss", ["-ltnpH", "sport = :3000"], { encoding: "utf8" });
const pids = [...new Set([...listeners.matchAll(/pid=(\d+)/g)].map(m => m[1]))];
if (cwd !== fs.realpathSync(root) || !name.startsWith("next-server"))
  throw Error("O PID nao corresponde ao Next deste checkout. Parar sem o alterar.");
if (pids.length !== 1 || pids[0] !== pid)
  throw Error("A porta 3000 nao corresponde ao PID indicado. Parar sem o alterar.");
console.log(JSON.stringify({ pid, cwd, start }));
JS
}

before=$(portal_state)
area=$(mktemp -d "${TMPDIR:-/tmp}/gestor-auth-suite-XXXXXX")
chmod 700 "$area"
mkdir "$area/app"
sha256sum next-env.d.ts tsconfig.json next.config.ts > "$area/inputs-antes.txt"
git for-each-ref --format='%(refname) %(objectname)' refs/heads refs/stash > "$area/refs-antes.txt"

finish() {
  local code=$?
  trap - EXIT
  if after=$(portal_state) && test "$before" = "$after" &&
    sha256sum --check --status "$area/inputs-antes.txt" &&
    git for-each-ref --format='%(refname) %(objectname)' refs/heads refs/stash > "$area/refs-depois.txt" &&
    cmp -s "$area/refs-antes.txt" "$area/refs-depois.txt"; then
    echo "Processo do portal, inputs, branches locais e stashes preservados."
  else
    echo "PARAGEM: uma verificacao de preservacao divergiu; nao repetir automaticamente."
    code=1
  fi
  echo "Resultado exit=$code; versao testada=$revision"
  echo "Registos e copia isolada: $area"
  exit "$code"
}
trap finish EXIT

git archive "$revision" | tar -x -C "$area/app"
cmp package-lock.json "$area/app/package-lock.json"
ln -s "$PWD/node_modules" "$area/app/node_modules"
printf '%s\n' "$revision" > "$area/versao.txt"

(
  cd "$area/app"
  export CODESPACES="" GESTOR_CSRF_DIAGNOSTIC=0
  export NEXT_PUBLIC_SUPABASE_URL="" NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=""
  export NEXT_PUBLIC_SUPABASE_ANON_KEY="" SUPABASE_SERVICE_ROLE_KEY=""
  export APP_ORIGIN="http://127.0.0.1:3100"
  if [[ -x /usr/bin/chromium && -z "${PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH:-}" ]]; then
    export PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium
  fi
  npx --no-install playwright test --config=playwright.auth-local.config.ts
) 2>&1 | tee "$area/playwright.log"
