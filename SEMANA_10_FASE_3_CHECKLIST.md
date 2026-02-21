# ✅ Semana 10 - Fase 3: CI/CD Pipeline - CHECKLIST PRÁTICO

**Status:** 🔄 EM ANDAMENTO
**Tempo Estimado:** 30-45 minutos
**Data Alvo:** 2026-02-21

---

## 📋 BEFORE YOU START

- [ ] Você tem acesso SSH ao VPS (145.223.94.196)
- [ ] Você tem SSH key gerada ou conhecida
- [ ] Você tem permissão em GitHub para adicionar secrets
- [ ] Você tem ~45 minutos livres

---

## 🔐 SEÇÃO 1: SSH KEY SETUP (10 min)

### A. Generate SSH Key (se não tiver uma dedicada)

```bash
# Generate new key
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_findash_deploy -N ""

# Verify it was created
ls -la ~/.ssh/id_rsa_findash_deploy*
```

- [ ] `id_rsa_findash_deploy` (private key) criada
- [ ] `id_rsa_findash_deploy.pub` (public key) criada

### B. Add Public Key to VPS

```bash
# Get public key
cat ~/.ssh/id_rsa_findash_deploy.pub
# Copy this: ssh-rsa AAAA...

# SSH to VPS
ssh root@145.223.94.196

# On VPS, add public key
mkdir -p ~/.ssh
echo "ssh-rsa AAAA..." >> ~/.ssh/authorized_keys  # Paste your public key
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Verify
cat ~/.ssh/authorized_keys

# Exit VPS
exit
```

- [ ] Public key adicionada a VPS
- [ ] Permissões corretas (700 .ssh, 600 authorized_keys)

### C. Test SSH Connection

```bash
# Test SSH without password
ssh -i ~/.ssh/id_rsa_findash_deploy root@145.223.94.196

# Should connect WITHOUT asking for password
# If it asks for password, check the public key setup
# Exit VPS
exit
```

- [ ] SSH conecta sem pedir senha ✅

---

## 🔑 SEÇÃO 2: GITHUB SECRETS (10 min)

### A. Get Private Key Content

```bash
# View private key (KEEP SECURE!)
cat ~/.ssh/id_rsa_findash_deploy

# Copy EVERYTHING (-----BEGIN to -----END)
```

- [ ] Private key copiada

### B. Add DEPLOY_SSH_KEY Secret

1. Go to: `https://github.com/seu-usuario/findash/settings/secrets/actions`
2. Click: **New repository secret**
3. Name: `DEPLOY_SSH_KEY`
4. Value: Paste the entire private key (with BEGIN and END)
5. Click: **Add secret**

```
-----BEGIN RSA PRIVATE KEY-----
MIIEpQIBAAKCAQEA...
...
-----END RSA PRIVATE KEY-----
```

- [ ] DEPLOY_SSH_KEY adicionado no GitHub

### C. Add DEPLOY_HOST Secret

1. Click: **New repository secret**
2. Name: `DEPLOY_HOST`
3. Value: `145.223.94.196`
4. Click: **Add secret**

- [ ] DEPLOY_HOST adicionado no GitHub

### D. Verify Secrets

Go to: `https://github.com/seu-usuario/findash/settings/secrets/actions`

You should see:
- ✅ DEPLOY_HOST
- ✅ DEPLOY_SSH_KEY

(Values shown as `***` for security)

- [ ] Ambos os secrets visíveis na página

---

## 🧪 SEÇÃO 3: VALIDATE WORKFLOW (5 min)

### A. Check Workflow File

```bash
# File should exist and be valid
cat .github/workflows/deploy.yml

# Should have:
# - name: Deploy to Production
# - triggers: push to main
# - jobs: test-and-build, deploy
```

- [ ] Workflow file existe e está correto

### B. Workflow Structure

O workflow deve ter 2 jobs:

**Job 1: test-and-build**
- [ ] npm run lint
- [ ] npm run typecheck
- [ ] npm test
- [ ] npm run build

**Job 2: deploy** (depends on test-and-build)
- [ ] SSH authentication
- [ ] git fetch/reset
- [ ] docker-compose operations
- [ ] Health check validation

---

## 🚀 SEÇÃO 4: TEST WORKFLOW (15 min)

### A. Manual Test via GitHub UI (Recomendado Primeiro)

1. Go to: `https://github.com/seu-usuario/findash/actions`
2. Click: **Deploy to Production** (left sidebar)
3. Click: **Run workflow**
4. Select branch: **main**
5. Click: **Run workflow**

**Monitor the execution:**
- Clique no workflow para ver progresso
- Tempo esperado: 8-12 minutos

### B. Expected Output

**Job 1: test-and-build**
```
✅ Checkout code
✅ Setup Node.js
✅ Install dependencies
✅ Run linting
✅ Run type checking
✅ Run tests (62 passed + 11 skipped)
✅ Build application
✅ JOB PASSED
```

**Job 2: deploy**
```
✅ Checkout code
✅ Deploy via SSH
   ✅ mkdir ~/.ssh
   ✅ SSH to VPS
   ✅ git fetch origin main
   ✅ git reset --hard origin/main
   ✅ docker-compose down
   ✅ docker-compose build --no-cache
   ✅ docker-compose up -d
   ✅ Health check validation (1/30)
   ✅ Deployment successful!
✅ Notify completion
✅ JOB PASSED
```

- [ ] test-and-build job passou ✅
- [ ] deploy job passou ✅
- [ ] Tempo total: 8-12 minutos

### C. If Workflow FAILED

**Check the error message:**

```
❌ Deploy via SSH: SSH authentication failed
  → Fix: Verify DEPLOY_SSH_KEY in GitHub Secrets
  → Fix: Verify public key in VPS ~/.ssh/authorized_keys

❌ Run linting: errors found
  → Fix: Run locally: npm run lint
  → Fix: Commit fixes locally

❌ docker-compose: command not found
  → Fix: Verify docker-compose installed on VPS
  → Fix: SSH and run: docker-compose --version
```

- [ ] Workflow passou ou erro identificado

### D. Verify Application is Updated

After deployment succeeds:

```bash
# SSH to VPS
ssh root@145.223.94.196

# Check that containers are running
docker-compose ps
# Should show: app, postgres, redis, nginx with status "Up"

# Check health endpoint
curl http://localhost:3000/api/health
# Should return: {"status":"ok",...}

# Check application is accessible
curl -I https://seu-dominio.com
# Should return 200 OK

exit
```

- [ ] Containers rodando ✅
- [ ] Health endpoint respondendo ✅
- [ ] Aplicação acessível ✅

---

## 🔄 SEÇÃO 5: AUTOMATIC TRIGGER TEST (5 min)

### A. Make a Small Change

```bash
# Make a tiny change
echo "# CI/CD Test - $(date)" >> README.md

# Commit and push
git add README.md
git commit -m "test: trigger CI/CD workflow"
git push origin main
```

- [ ] Commit feito e pushed para main

### B. Monitor GitHub Actions

1. Go to: `https://github.com/seu-usuario/findash/actions`
2. Você deve ver um novo workflow executando
3. Aguarde 8-12 minutos para completion
4. Verifique que todos os jobs passaram

- [ ] Workflow disparou automaticamente ✅
- [ ] Workflow completou com sucesso ✅

### C. Verify Changes in Production

```bash
# SSH to VPS
ssh root@145.223.94.196

# Check logs
docker-compose logs app | tail -20

# Verify that the code was updated
# (your changes should be there)

exit
```

- [ ] Mudanças visíveis em produção ✅

---

## 📊 FINAL VALIDATION

### Phase 3 Complete When All Checked:

**Infrastructure:**
- [ ] SSH key configurada no VPS
- [ ] GitHub Secrets: DEPLOY_SSH_KEY
- [ ] GitHub Secrets: DEPLOY_HOST
- [ ] Workflow file válido

**Automatic:**
- [ ] Manual workflow trigger passou
- [ ] Auto-trigger workflow passou
- [ ] Containers rodando em produção
- [ ] Application acessível
- [ ] Health checks passando

**Security:**
- [ ] Nenhuma chave privada em repositório
- [ ] Secrets só em GitHub (não em .env)
- [ ] SSH key is 4096-bit RSA
- [ ] Permissões corretas no VPS

**Documentation:**
- [ ] SEMANA_10_FASE_3_CI_CD_SETUP.md criado
- [ ] SEMANA_10_GITHUB_SECRETS_GUIDE.md criado
- [ ] SEMANA_10_FASE_3_CHECKLIST.md (este arquivo)

---

## 🎯 SUCCESS CRITERIA

Fase 3 está **COMPLETO** quando:

1. ✅ GitHub Secrets configurados (DEPLOY_SSH_KEY, DEPLOY_HOST)
2. ✅ GitHub Actions workflow executa manualmente com sucesso
3. ✅ GitHub Actions workflow executa automaticamente ao fazer push
4. ✅ Deployment via SSH funciona
5. ✅ Aplicação atualizável automaticamente
6. ✅ Health checks passando após cada deployment
7. ✅ Documentação preparada

---

## 📝 TROUBLESHOOTING QUICK REFERENCE

| Problema | Solução |
|----------|---------|
| SSH auth failed | Verificar DEPLOY_SSH_KEY em Secrets, verificar public key no VPS |
| Linting errors | Rodar `npm run lint` localmente, corrigir, push |
| Tests failing | Rodar `npm test` localmente, corrigir, push |
| docker-compose not found | SSH para VPS, instalar docker-compose |
| Port already in use | SSH para VPS, `docker-compose down`, esperar 30s |
| Health check timeout | SSH para VPS, `docker-compose logs app`, verificar erros |
| Secrets not visible | Verificar que foram adicionados em GitHub Settings/Secrets |

---

## ⏱️ TIMELINE

```
T+0min:   Começar Seção 1 (SSH Key Setup)
T+10min:  Começar Seção 2 (GitHub Secrets)
T+20min:  Começar Seção 3 (Validate Workflow)
T+25min:  Começar Seção 4 (Test Workflow) - AGUARDE 8-12 minutos
T+37min:  Começar Seção 5 (Auto-trigger Test) - AGUARDE 8-12 minutos
T+50min:  Terminar Seção 5
T+50min:  FASE 3 COMPLETA! 🎉
```

---

## 🎓 WHAT YOU LEARNED

- ✅ SSH key generation and management
- ✅ GitHub Secrets for CI/CD
- ✅ GitHub Actions workflow triggers
- ✅ Automated deployment via SSH
- ✅ Health check validation
- ✅ Production deployment automation

---

## 🚀 NEXT: FASE 4 (Monitoring & Finalization)

After Fase 3 is complete:
- Configure monitoring (logs, alerts)
- Setup automated backups
- Prepare runbooks
- Celebrate! 🎉

---

**Fase 3 Status:** 🔄 EM ANDAMENTO

Use this checklist to guide you through the setup. Good luck! 🚀

---

*Criado em 2026-02-20*
*Parte de: FinDash - Semana 10 Production Deployment*
