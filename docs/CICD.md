# CI/CD — AuraFit AI API (GitHub Actions)

Pipeline de **Deploy Contínuo** para a VPS (AWS EC2 + CloudPanel + PM2).  
Autenticação SSH por **usuário/senha** (padrão `CLOUDPANEL_*` da empresa).

---

## 1. Estrutura

```
.github/workflows/deploy.yml
scripts/deploy.sh
docs/CICD.md
```

---

## 2. Workflow

| Item | Valor |
|------|--------|
| Nome | Deploy Production |
| Trigger | `push` em `main` + `workflow_dispatch` |
| Runner | `ubuntu-latest` |
| Environment | `produção` |
| Auth | SSH password (`appleboy/ssh-action`) |

Fluxo:

```
Push main
  → Validate CLOUDPANEL_* secrets
  → Test SSH (usuário/senha)
  → git fetch/reset → npm install → build → pm2 → health check
```

---

## 3. Secrets no Environment `produção`

Cadastre em: **Settings → Environments → produção → Environment secrets**

| Secret | Exemplo / valor |
|--------|------------------|
| `CLOUDPANEL_HOST` | IP ou hostname da VPS |
| `CLOUDPANEL_PORT` | `22` (ou porta SSH) |
| `CLOUDPANEL_USER` | `action-ia-aura` |
| `CLOUDPANEL_PASSWORD` | senha do usuário |
| `CLOUDPANEL_BACKEND_PATH` | `/home/ia-api-aurafitpro/htdocs/ia-api.aurafitpro.com.br` |
| `BACKEND_HEALTH_URL` | `http://localhost:3000` (opcional) |

> Não use mais `SSH_PRIVATE_KEY` / `SSH_KNOWN_HOSTS` neste pipeline.

---

## 4. Pré-requisitos na VPS

### Usuário `action-ia-aura`

- Senha definida
- Permissão de leitura/escrita no diretório do projeto (grupo ou ACL)
- Acesso a `git`, `npm`, `pm2` no PATH
- SSH com senha habilitado no servidor

### Habilitar login SSH por senha (se necessário)

Como root:

```bash
grep -E '^PasswordAuthentication|^#PasswordAuthentication' /etc/ssh/sshd_config
# Deve estar: PasswordAuthentication yes

sudo systemctl reload sshd
```

### Teste manual (do seu PC)

```bash
ssh -p 22 action-ia-aura@SEU_HOST
# digite a senha e confirme o login
```

---

## 5. Permissão no projeto (já feita / conferir)

```bash
SITE=/home/ia-api-aurafitpro/htdocs/ia-api.aurafitpro.com.br
sudo usermod -aG ia-api-aurafitpro action-ia-aura
sudo setfacl -R -m u:action-ia-aura:rwx "$SITE"
sudo setfacl -R -d -m u:action-ia-aura:rwx "$SITE"
sudo -u action-ia-aura bash -lc "ls -la $SITE"
```

---

### PM2 e Node no usuário `action-ia-aura`

O PM2 de produção roda como `ia-api-aurafitpro`:

```text
/home/ia-api-aurafitpro/.nvm/versions/node/v24.18.1/bin/pm2
~/.pm2  →  /home/ia-api-aurafitpro/.pm2
app     →  aurafit-ai-api
```

Shell não interativo **não** carrega nvm. O deploy usa o **caminho completo** do `pm2`.

Na VPS, como **root** ou **ubuntu**:

```bash
sudo visudo -f /etc/sudoers.d/action-ia-aura-pm2
```

Cole exatamente:

```text
action-ia-aura ALL=(ia-api-aurafitpro) NOPASSWD: /home/ia-api-aurafitpro/.nvm/versions/node/v24.18.1/bin/pm2
```

Teste:

```bash
sudo -u action-ia-aura sudo -n -u ia-api-aurafitpro /home/ia-api-aurafitpro/.nvm/versions/node/v24.18.1/bin/pm2 list
```

Deve listar `aurafit-ai-api` online.

O `scripts/deploy.sh` usa esse binário via `sudo -n -u ia-api-aurafitpro`.

---

## 6. Como testar o deploy

1. Secrets no Environment **`produção`**
2. Actions → **Deploy Production** → **Run workflow**
3. Confirme os steps: Validate → Test SSH → Deploy

---

## 7. Deploy manual na VPS

```bash
cd /home/ia-api-aurafitpro/htdocs/ia-api.aurafitpro.com.br
./scripts/deploy.sh
```

---

## 8. Logs

- **Action:** GitHub → Actions → run → job
- **PM2:** `pm2 logs aurafit-ai-api`

---

## 9. Ambientes futuros

| Environment GitHub | Uso |
|--------------------|-----|
| `homólogo` | staging (mesmos `CLOUDPANEL_*` com host/path de homolog) |
| `produção` | produção |

Basta duplicar o job ou parametrizar `environment:` — o padrão de secrets já é o da empresa.

---

## Checklist

- [ ] Environment GitHub `produção`
- [ ] Secrets `CLOUDPANEL_HOST`, `CLOUDPANEL_PORT`, `CLOUDPANEL_USER`, `CLOUDPANEL_PASSWORD`
- [ ] `CLOUDPANEL_BACKEND_PATH` apontando para o htdocs da API
- [ ] `CLOUDPANEL_USER` = `action-ia-aura`
- [ ] PasswordAuthentication habilitado no SSH da VPS
- [ ] Usuário consegue `cd` no projeto + `git`/`npm`/`pm2`
