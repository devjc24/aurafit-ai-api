#!/usr/bin/env bash
# =============================================================================
# AuraFit AI API — Script de deploy (VPS)
# =============================================================================
# Git: roda como o usuário SSH (action-ia-aura)
# npm / pm2: rodam como APP_OWNER (ia-api-aurafitpro) via sudo -n
#   — necessário porque o nvm/pm2 de produção pertencem ao usuário do site
#   — shell não interativo NÃO carrega nvm (.bashrc)
#
# Sudoers (VPS):
#   action-ia-aura ALL=(ia-api-aurafitpro) NOPASSWD: /bin/bash, /usr/bin/bash
# =============================================================================

set -euo pipefail

APP_DIR="${APP_DIR:-/home/ia-api-aurafitpro/htdocs/ia-api.aurafitpro.com.br}"
APP_OWNER="${APP_OWNER:-ia-api-aurafitpro}"
PM2_APP_NAME="${PM2_APP_NAME:-aurafit-ai-api}"
HEALTHCHECK_URL="${HEALTHCHECK_URL:-http://localhost:3000}"
HEALTHCHECK_RETRIES="${HEALTHCHECK_RETRIES:-10}"
HEALTHCHECK_INTERVAL_SEC="${HEALTHCHECK_INTERVAL_SEC:-3}"
GIT_BRANCH="${GIT_BRANCH:-main}"
SKIP_GIT="${SKIP_GIT:-0}"

log() { printf '[deploy] %s\n' "$*"; }
fail() { printf '[deploy][ERROR] %s\n' "$*" >&2; exit 1; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Comando obrigatório não encontrado: $1"
}

resolve_node_bin() {
  local bin=""
  bin="$(ls -d "/home/${APP_OWNER}/.nvm/versions/node/"*/bin 2>/dev/null | sort -V | tail -n 1 || true)"
  [[ -n "$bin" && -x "${bin}/node" ]] || fail "Node/nvm não encontrado em /home/${APP_OWNER}/.nvm"
  [[ -x "${bin}/npm" ]] || fail "npm não encontrado em ${bin}"
  [[ -x "${bin}/pm2" ]] || fail "pm2 não encontrado em ${bin}"
  printf '%s\n' "$bin"
}

# Roda comando como dono do site, com PATH do nvm (sem depender de .bashrc)
run_as_owner() {
  local node_bin="$1"
  shift

  if [[ "$(id -un)" == "${APP_OWNER}" ]]; then
    PATH="${node_bin}:/usr/bin:/bin" HOME="/home/${APP_OWNER}" PM2_HOME="/home/${APP_OWNER}/.pm2" "$@"
    return
  fi

  if ! sudo -n -u "${APP_OWNER}" /bin/bash -c 'true' 2>/dev/null; then
    fail "Sem sudo NOPASSWD para ${APP_OWNER}. Na VPS: action-ia-aura ALL=(ia-api-aurafitpro) NOPASSWD: /bin/bash, /usr/bin/bash"
  fi

  # shellcheck disable=SC2029
  sudo -n -u "${APP_OWNER}" /bin/bash -c "
    set -euo pipefail
    export PATH='${node_bin}:/usr/bin:/bin'
    export HOME='/home/${APP_OWNER}'
    export PM2_HOME='/home/${APP_OWNER}/.pm2'
    cd '${APP_DIR}'
    $(printf '%q ' "$@")
  "
}

ensure_github_known_hosts() {
  mkdir -p ~/.ssh
  chmod 700 ~/.ssh
  touch ~/.ssh/known_hosts
  chmod 600 ~/.ssh/known_hosts
  if grep -qE '(^github\.com |,github\.com )' ~/.ssh/known_hosts 2>/dev/null; then
    return 0
  fi
  printf '%s\n' \
    'github.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl' \
    'github.com ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBEmKSENjQEezOmxkZMy7opKgwFB9nkt5YRrYMjNuG5N87uRgg6CLrbo5wAdT/y6v0mKV0U2w0WZ2YB/++Tpockg=' \
    'github.com ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQCj7ndNxQowgcQnjshcLrqPEiiphnt+VTTvDP6mHBL9j1aNUkY4Ue1gvwnGLVlOhGeYrnZaMgRK6+PKCUXaDbC7qtbW8gIkhL7aGCsOr/C56SJMy/BCZfxd1nWzAOxSDPgVsmerOBYfNqltV9/hWCqBywINIR+5dIg6JTJ72pcEpEjcYgXkE2YEFXV1JHnsKgbLWNlhScqb2UmyRkQyytRLtL+38TGxkxCflmO+5Z8CSSNY7GidjMIZ7Q4zMjA2n1nGrlTDkzwDCsw+wqFPGQA179cnfGWOWRVruj16z6XyvxvjJwbz0wQZ75XK5tKSb7FNyeIEs4TT4jk+S4dhPeAUC5y+bDYirYgM4GC7uEnztnZyaVWQ7B381AK4Qdrwt51ZqExKbQpTUNn+EjqoTwvqNj4kqx5QUCI0ThS/YkOxJCXmPUWZbhjpCg56i+2aB6CmK2JGhn57K5mj0MNdBXA4/WnwH6XoPWJzK5Nyu2zB3nAZp+S5hpQs+p1vN1/wsjk=' \
    >> ~/.ssh/known_hosts
  log "GitHub adicionado ao ~/.ssh/known_hosts"
}

normalize_origin_to_https() {
  local url path
  url="$(git remote get-url origin 2>/dev/null || true)"
  case "$url" in
    git@github.com:*)
      path="${url#git@github.com:}"
      path="${path%.git}"
      git remote set-url origin "https://github.com/${path}.git"
      log "Remote convertido para HTTPS: https://github.com/${path}.git"
      ;;
  esac
}

# --- Pré-checagens -----------------------------------------------------------
require_cmd git
require_cmd curl
require_cmd sudo

log "Usuário SSH: $(id -un)"
NODE_BIN="$(resolve_node_bin)"
log "Node bin: ${NODE_BIN}"
log "Testando sudo → ${APP_OWNER}..."
run_as_owner "${NODE_BIN}" "${NODE_BIN}/node" -v
run_as_owner "${NODE_BIN}" "${NODE_BIN}/npm" -v
run_as_owner "${NODE_BIN}" "${NODE_BIN}/pm2" -v

cd "$APP_DIR" || fail "Diretório do projeto não encontrado: $APP_DIR"

if ! git config --global --get-all safe.directory 2>/dev/null | grep -qxF "$APP_DIR"; then
  git config --global --add safe.directory "$APP_DIR"
  log "safe.directory configurado: $APP_DIR"
fi

ensure_github_known_hosts
normalize_origin_to_https
mkdir -p .deploy

PREVIOUS_SHA="$(git rev-parse HEAD 2>/dev/null || true)"

if [[ "${SKIP_GIT}" != "1" ]]; then
  if [[ -n "${PREVIOUS_SHA}" ]]; then
    printf '%s\n' "${PREVIOUS_SHA}" > .deploy/previous-sha
    log "SHA anterior gravado: ${PREVIOUS_SHA}"
  fi
  log "Remote: $(git remote get-url origin 2>/dev/null || echo 'n/a')"
  log "Atualizando origin/${GIT_BRANCH}..."
  git fetch origin
  git reset --hard "origin/${GIT_BRANCH}"
else
  log "SKIP_GIT=1 — código já sincronizado pelo workflow"
  if [[ -f .deploy/previous-sha ]]; then
    PREVIOUS_SHA="$(cat .deploy/previous-sha)"
  fi
fi

DEPLOYED_SHA="$(git rev-parse HEAD)"
log "Deploy no commit: ${DEPLOYED_SHA}"

# --- Build (como APP_OWNER) --------------------------------------------------
log "npm install (como ${APP_OWNER})..."
run_as_owner "${NODE_BIN}" "${NODE_BIN}/npm" install

log "npm run build (como ${APP_OWNER})..."
run_as_owner "${NODE_BIN}" "${NODE_BIN}/npm" run build

[[ -f dist/server.js ]] || fail "Build falhou: dist/server.js não encontrado"

# --- PM2 (como APP_OWNER) ----------------------------------------------------
log "PM2 restart/start (${PM2_APP_NAME})..."
if run_as_owner "${NODE_BIN}" "${NODE_BIN}/pm2" describe "${PM2_APP_NAME}" >/dev/null 2>&1; then
  run_as_owner "${NODE_BIN}" "${NODE_BIN}/pm2" restart "${PM2_APP_NAME}"
else
  log "Processo não encontrado. Criando..."
  run_as_owner "${NODE_BIN}" "${NODE_BIN}/pm2" start "${APP_DIR}/dist/server.js" --name "${PM2_APP_NAME}"
fi
run_as_owner "${NODE_BIN}" "${NODE_BIN}/pm2" save

# --- Health check ------------------------------------------------------------
log "Aguardando API..."
sleep 5

attempt=1
http_code=""
while (( attempt <= HEALTHCHECK_RETRIES )); do
  http_code="$(curl -s -o /tmp/aurafit-health-body.txt -w '%{http_code}' "${HEALTHCHECK_URL}" || true)"
  if [[ "${http_code}" == "200" ]]; then
    log "Health check OK (HTTP 200)"
    cat /tmp/aurafit-health-body.txt || true
    printf '\n'
    break
  fi
  log "Tentativa ${attempt}/${HEALTHCHECK_RETRIES} falhou (HTTP ${http_code:-n/a})"
  sleep "${HEALTHCHECK_INTERVAL_SEC}"
  ((attempt++))
done

[[ "${http_code}" == "200" ]] || fail "Health check falhou (último HTTP: ${http_code:-n/a})"

{
  printf 'deployed_at=%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  printf 'deployed_sha=%s\n' "${DEPLOYED_SHA}"
  printf 'previous_sha=%s\n' "${PREVIOUS_SHA}"
  printf 'branch=%s\n' "${GIT_BRANCH}"
  printf 'pm2_app=%s\n' "${PM2_APP_NAME}"
} > .deploy/last-success

log "Deploy concluído com sucesso."
