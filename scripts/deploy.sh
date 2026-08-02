#!/usr/bin/env bash
# =============================================================================
# AuraFit AI API — Script de deploy (VPS)
# =============================================================================
# Executado via GitHub Actions (SSH). Reutilizável por outras APIs da empresa
# alterando apenas as variáveis de ambiente abaixo.
#
# Ordem obrigatória (fail-fast):
#   fetch → reset → install → build → pm2 → health check
#
# Variáveis:
#   APP_DIR, PM2_APP_NAME, HEALTHCHECK_URL, GIT_BRANCH
#   SKIP_GIT=1  → pula fetch/reset (quando o workflow já sincronizou o código)
#
# Rollback (futuro):
#   O SHA anterior ao reset é gravado em .deploy/previous-sha.
#   Um job de rollback poderá fazer: git reset --hard "$(cat .deploy/previous-sha)"
# =============================================================================

set -euo pipefail

# --- Configuração (sobrescrevível via env / GitHub Environments) --------------
APP_DIR="${APP_DIR:-/home/ia-api-aurafitpro/htdocs/ia-api.aurafitpro.com.br}"
PM2_APP_NAME="${PM2_APP_NAME:-aurafit-ai-api}"
HEALTHCHECK_URL="${HEALTHCHECK_URL:-http://localhost:3000}"
HEALTHCHECK_RETRIES="${HEALTHCHECK_RETRIES:-10}"
HEALTHCHECK_INTERVAL_SEC="${HEALTHCHECK_INTERVAL_SEC:-3}"
GIT_BRANCH="${GIT_BRANCH:-main}"
SKIP_GIT="${SKIP_GIT:-0}"

log() {
  printf '[deploy] %s\n' "$*"
}

fail() {
  printf '[deploy][ERROR] %s\n' "$*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Comando obrigatório não encontrado: $1"
}

# Garante known_hosts do GitHub para git fetch via SSH (evita Host key verification failed)
ensure_github_known_hosts() {
  mkdir -p ~/.ssh
  chmod 700 ~/.ssh
  touch ~/.ssh/known_hosts
  chmod 600 ~/.ssh/known_hosts

  if grep -qE '(^github\.com |,github\.com )' ~/.ssh/known_hosts 2>/dev/null; then
    return 0
  fi

  # Chaves oficiais: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/githubs-ssh-key-fingerprints
  cat >> ~/.ssh/known_hosts <<'EOF'
github.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl
github.com ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBEmKSENjQEezOmxkZMy7opKgwFB9nkt5YRrYMjNuG5N87uRgg6CLrbo5wAdT/y6v0mKV0U2w0WZ2YB/++Tpockg=
github.com ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQCj7ndNxQowgcQnjshcLrqPEiiphnt+VTTvDP6mHBL9j1aNUkY4Ue1gvwnGLVlOhGeYrnZaMgRK6+PKCUXaDbC7qtbW8gIkhL7aGCsOr/C56SJMy/BCZfxd1nWzAOxSDPgVsmerOBYfNqltV9/hWCqBywINIR+5dIg6JTJ72pcEpEjcYgXkE2YEFXV1JHnsKgbLWNlhScqb2UmyRkQyytRLtL+38TGxkxCflmO+5Z8CSSNY7GidjMIZ7Q4zMjA2n1nGrlTDkzwDCsw+wqFPGQA179cnfGWOWRVruj16z6XyvxvjJwbz0wQZ75XK5tKSb7FNyeIEs4TT4jk+S4dhPeAUC5y+bDYirYgM4GC7uEnztnZyaVWQ7B381AK4Qdrwt51ZqExKbQpTUNn+EjqoTwvqNj4kqx5QUCI0ThS/YkOxJCXmPUWZbhjpCg56i+2aB6CmK2JGhn57K5mj0MNdBXA4/WnwH6XoPWJzK5Nyu2zB3nAZp+S5hpQs+p1vN1/wsjk=
EOF
  log "GitHub adicionado ao ~/.ssh/known_hosts"
}

# Deploy user (action-ia-aura) normalmente não tem deploy key — preferir HTTPS
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
require_cmd npm
require_cmd pm2
require_cmd curl

cd "$APP_DIR" || fail "Diretório do projeto não encontrado: $APP_DIR"

# Repo pode ser dono de outro usuário (ex.: site CloudPanel vs action-ia-aura)
if ! git config --global --get-all safe.directory 2>/dev/null | grep -qxF "$APP_DIR"; then
  git config --global --add safe.directory "$APP_DIR"
  log "safe.directory configurado: $APP_DIR"
fi

ensure_github_known_hosts
normalize_origin_to_https

mkdir -p .deploy

PREVIOUS_SHA="$(git rev-parse HEAD 2>/dev/null || true)"

# --- Atualizar código --------------------------------------------------------
if [[ "${SKIP_GIT}" != "1" ]]; then
  if [[ -n "${PREVIOUS_SHA}" ]]; then
    printf '%s\n' "${PREVIOUS_SHA}" > .deploy/previous-sha
    log "SHA anterior gravado para rollback futuro: ${PREVIOUS_SHA}"
  fi

  log "Remote: $(git remote get-url origin 2>/dev/null || echo 'n/a')"
  log "Atualizando repositório (origin/${GIT_BRANCH})..."
  if ! git fetch origin; then
    fail "git fetch falhou. Confira remote HTTPS e permissões no diretório do projeto."
  fi
  git reset --hard "origin/${GIT_BRANCH}"
else
  log "SKIP_GIT=1 — código já sincronizado pelo workflow"
  if [[ -f .deploy/previous-sha ]]; then
    PREVIOUS_SHA="$(cat .deploy/previous-sha)"
  fi
fi

DEPLOYED_SHA="$(git rev-parse HEAD)"
log "Deploy no commit: ${DEPLOYED_SHA}"

# --- Dependências e build ----------------------------------------------------
log "Instalando dependências..."
npm install

log "Compilando TypeScript..."
npm run build

[[ -f dist/server.js ]] || fail "Build falhou: dist/server.js não encontrado"

# --- PM2 (cria se não existir; reinicia se existir) --------------------------
log "Gerenciando processo PM2 (${PM2_APP_NAME})..."
if pm2 describe "${PM2_APP_NAME}" >/dev/null 2>&1; then
  pm2 restart "${PM2_APP_NAME}"
else
  log "Processo não encontrado. Criando ${PM2_APP_NAME}..."
  pm2 start dist/server.js --name "${PM2_APP_NAME}"
fi

pm2 save

# --- Health check ------------------------------------------------------------
log "Aguardando API estabilizar..."
sleep 5

log "Health check: ${HEALTHCHECK_URL}"
attempt=1
http_code=""

while (( attempt <= HEALTHCHECK_RETRIES )); do
  http_code="$(curl -s -o /tmp/aurafit-health-body.txt -w '%{http_code}' "${HEALTHCHECK_URL}" || true)"

  if [[ "${http_code}" == "200" ]]; then
    log "Health check OK (HTTP 200) — tentativa ${attempt}/${HEALTHCHECK_RETRIES}"
    cat /tmp/aurafit-health-body.txt || true
    printf '\n'
    break
  fi

  log "Tentativa ${attempt}/${HEALTHCHECK_RETRIES} falhou (HTTP ${http_code:-n/a}). Nova tentativa em ${HEALTHCHECK_INTERVAL_SEC}s..."
  sleep "${HEALTHCHECK_INTERVAL_SEC}"
  ((attempt++))
done

[[ "${http_code}" == "200" ]] || fail "Health check falhou após ${HEALTHCHECK_RETRIES} tentativas (último HTTP: ${http_code:-n/a})"

# --- Metadados de deploy (base para rollback/auditoria futura) ---------------
{
  printf 'deployed_at=%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  printf 'deployed_sha=%s\n' "${DEPLOYED_SHA}"
  printf 'previous_sha=%s\n' "${PREVIOUS_SHA}"
  printf 'branch=%s\n' "${GIT_BRANCH}"
  printf 'pm2_app=%s\n' "${PM2_APP_NAME}"
} > .deploy/last-success

log "Deploy concluído com sucesso."
