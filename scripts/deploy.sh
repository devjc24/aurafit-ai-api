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

# --- Pré-checagens -----------------------------------------------------------
require_cmd git
require_cmd npm
require_cmd pm2
require_cmd curl

cd "$APP_DIR" || fail "Diretório do projeto não encontrado: $APP_DIR"

mkdir -p .deploy

PREVIOUS_SHA="$(git rev-parse HEAD 2>/dev/null || true)"

# --- Atualizar código --------------------------------------------------------
if [[ "${SKIP_GIT}" != "1" ]]; then
  if [[ -n "${PREVIOUS_SHA}" ]]; then
    printf '%s\n' "${PREVIOUS_SHA}" > .deploy/previous-sha
    log "SHA anterior gravado para rollback futuro: ${PREVIOUS_SHA}"
  fi

  log "Atualizando repositório (origin/${GIT_BRANCH})..."
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
