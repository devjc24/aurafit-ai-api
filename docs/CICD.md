# CI/CD — AuraFit AI API (GitHub Actions)

Pipeline de **Deploy Contínuo** para a VPS (AWS EC2 + CloudPanel + PM2).  
Não altera endpoints nem a arquitetura da API.

---

## 1. Estrutura criada

```
.github/
  workflows/
    deploy.yml          # Pipeline de deploy (main → produção)
scripts/
  deploy.sh             # Script idempotente executado na VPS
docs/
  CICD.md               # Este documento
```

---

## 2. Workflow

Arquivo: [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)

| Item | Valor |
|------|--------|
| Nome | Deploy Production |
| Trigger | `push` em `main` + `workflow_dispatch` (manual) |
| Runner | `ubuntu-latest` |
| Environment GitHub | `production` |
| Concurrency | `deploy-production` (não cancela deploy em andamento) |

Fluxo:

```
Push main
  → Checkout
  → Configurar SSH (chave + known_hosts)
  → SSH na VPS
      → gravar SHA anterior (.deploy/previous-sha)
      → git fetch + git reset --hard origin/main
      → npm install
      → npm run build
      → pm2 restart (ou start se não existir)
      → pm2 save
      → health check HTTP 200 em localhost:3000
  → Resumo no GitHub Actions
```

Qualquer comando com falha interrompe o workflow (`set -euo pipefail`).

---

## 3. Secrets necessários no GitHub

**Settings → Secrets and variables → Actions**  
(ou no Environment `production`: **Settings → Environments → production**)

| Secret | Descrição |
|--------|-----------|
| `SSH_HOST` | IP ou hostname da VPS |
| `SSH_PORT` | Porta SSH (geralmente `22`) |
| `SSH_USER` | Usuário SSH (ex.: usuário do site no CloudPanel) |
| `SSH_PRIVATE_KEY` | Chave privada completa (incluindo `BEGIN`/`END`) |
| `SSH_KNOWN_HOSTS` | Linha(s) do host key (saída do `ssh-keyscan`) |

> `SSH_KNOWN_HOSTS` é obrigatório. O workflow usa `StrictHostKeyChecking=yes` e **não** desabilita a verificação do host.

Opcional (Environment `production`): criar o environment no GitHub para isolar secrets de produção e, no futuro, `staging` / `development`.

---

## 4. Como gerar a chave SSH

No seu computador (ou em uma máquina segura), **não** na VPS de produção como chave de login do dia a dia:

```bash
ssh-keygen -t ed25519 -C "github-actions-aurafit-ai-api" -f ./aurafit-ai-api-deploy -N ""
```

Arquivos gerados:

- `aurafit-ai-api-deploy` → **chave privada** (vai para o GitHub Secret)
- `aurafit-ai-api-deploy.pub` → **chave pública** (vai para a VPS)

---

## 5. Como cadastrar a chave pública na VPS

Conecte na VPS com um usuário que já tenha acesso e execute (ajuste o usuário do site):

```bash
# Exemplo CloudPanel — usuário do site ia-api
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
```

Cole o conteúdo de `aurafit-ai-api-deploy.pub` em uma nova linha.

```bash
chmod 600 ~/.ssh/authorized_keys
```

Teste do seu PC:

```bash
ssh -i ./aurafit-ai-api-deploy -p 22 USUARIO@HOST
```

Garanta que esse usuário consegue:

- `cd /home/ia-api-aurafitpro/htdocs/ia-api.aurafitpro.com.br`
- `git fetch` / `git reset`
- `npm install` / `npm run build`
- `pm2` (restart/start/save)

---

## 6. Como cadastrar a chave privada no GitHub

1. Abra `aurafit-ai-api-deploy` (privada) e copie **todo** o conteúdo.
2. GitHub → repositório → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**  
   (ou Environment `production` → **Add secret**)
3. Nome: `SSH_PRIVATE_KEY`
4. Valor: conteúdo completo da chave privada

Cadastre também:

```bash
# No seu PC (gera o fingerprint do host — use a mesma porta/host dos secrets)
ssh-keyscan -p 22 SEU_HOST
```

Copie a saída completa para o secret `SSH_KNOWN_HOSTS`.

Depois:

- `SSH_HOST` = IP/hostname
- `SSH_PORT` = `22` (ou a porta real)
- `SSH_USER` = usuário SSH

**Não** committe a chave privada. Apague cópias locais desnecessárias após cadastrar.

---

## 7. Como testar o deploy

1. Confirme que os 5 secrets estão cadastrados.
2. No GitHub: **Settings → Environments** → crie `production` (se ainda não existir) e vincule os secrets se estiver usando environment secrets.
3. Faça um push em `main` **ou** rode manualmente:
   - **Actions** → **Deploy Production** → **Run workflow**
4. Abra a execução e confira os steps até o health check.
5. No navegador: `https://ia-api.aurafitpro.com.br/` deve responder `status: online`.

---

## 8. Como executar um deploy manual

### Pelo GitHub

**Actions** → **Deploy Production** → **Run workflow** → branch `main`.

### Direto na VPS (emergência)

```bash
cd /home/ia-api-aurafitpro/htdocs/ia-api.aurafitpro.com.br
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

---

## 9. Como visualizar logs da Action

1. Repositório no GitHub → **Actions**
2. Selecione o workflow **Deploy Production**
3. Abra a run desejada
4. Clique no job **Deploy to production** e expanda cada step

Falhas comuns:

| Sintoma | Causa provável |
|---------|----------------|
| Permission denied (publickey) | Chave pública não está em `authorized_keys` ou user errado |
| Host key verification failed | `SSH_KNOWN_HOSTS` ausente/desatualizado |
| npm/pm2 not found | PATH do usuário SSH sem Node/PM2 (CloudPanel/nvm) |
| Health check falhou | App não subiu, `PORT` ≠ 3000, ou `.env` ausente na VPS |

---

## 10. Como visualizar logs do PM2

Na VPS:

```bash
pm2 status
pm2 logs aurafit-ai-api
pm2 logs aurafit-ai-api --lines 200
pm2 describe aurafit-ai-api
```

Logs em arquivo (padrão PM2):

```bash
~/.pm2/logs/aurafit-ai-api-out.log
~/.pm2/logs/aurafit-ai-api-error.log
```

---

## 11. Ambientes futuros (dev / homolog / produção)

O pipeline já está preparado para expansão **sem refazer** a base:

| Peça | Como evoluir |
|------|----------------|
| GitHub Environments | Criar `development`, `staging`, `production` com secrets próprios |
| `deploy.yml` | Adicionar jobs por environment ou `workflow_dispatch` com input `environment` |
| Variáveis | Trocar `APP_DIR`, `PM2_APP_NAME`, `HEALTHCHECK_URL`, `GIT_BRANCH` por environment |
| Branches | Ex.: `develop` → staging; `main` → production |
| Script | O mesmo `scripts/deploy.sh` serve para todos os ambientes |

Exemplo futuro (ilustrativo):

```yaml
on:
  push:
    branches: [main, develop]
  workflow_dispatch:
    inputs:
      target:
        type: choice
        options: [production, staging]

jobs:
  deploy:
    environment: ${{ inputs.target || (github.ref == 'refs/heads/main' && 'production') || 'staging' }}
    # secrets/vars vindos do Environment correspondente
```

### Rollback (estrutura preparada, não implementada)

Antes de cada deploy, o SHA atual é salvo em:

```
.deploy/previous-sha
.deploy/last-success
```

No futuro, um job `rollback` poderá:

1. Ler `.deploy/previous-sha`
2. `git reset --hard <sha>`
3. `npm install && npm run build`
4. `pm2 restart aurafit-ai-api`
5. Health check

---

## Padrão reutilizável (outras APIs da empresa)

Para outra aplicação Node/PM2 no CloudPanel:

1. Copiar `.github/workflows/deploy.yml` e `scripts/deploy.sh`
2. Ajustar `APP_DIR`, `PM2_APP_NAME`, `HEALTHCHECK_URL`
3. Criar secrets SSH no repositório/environment
4. Garantir `authorized_keys` + Node + PM2 no usuário da VPS

---

## Checklist pré-primeiro deploy

- [ ] Secrets `SSH_HOST`, `SSH_PORT`, `SSH_USER`, `SSH_PRIVATE_KEY`, `SSH_KNOWN_HOSTS`
- [ ] Environment GitHub `production` criado
- [ ] Chave pública na VPS (`~/.ssh/authorized_keys`)
- [ ] Repo Git já clonado no path do CloudPanel
- [ ] Arquivo `.env` presente na VPS (`PORT`, `OLLAMA_URL`, `MODEL`) — **não** versionado
- [ ] Node.js, npm e PM2 disponíveis no usuário SSH
- [ ] App escutando na porta usada pelo health check (`3000` por padrão)
