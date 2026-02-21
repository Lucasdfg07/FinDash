# Semana 10 - Fase 3: CI/CD Pipeline Setup

**Status:** 🔄 EM ANDAMENTO
**Data de Início:** 2026-02-20
**Data Estimada:** 2026-02-22
**Responsável:** @devops (GitHub Actions Configuration)

---

## 📋 Objetivo da Fase 3

Configurar e validar o pipeline CI/CD automatizado para que a aplicação seja deployada automaticamente ao fazer push para a branch `main`. O workflow já foi criado em Fase 1 - agora precisamos:

1. ✅ Configurar GitHub Secrets
2. ✅ Validar que o workflow executa
3. ✅ Testar auto-deploy funcionando
4. ✅ Documentar o processo

---

## 🔐 Passo 1: Configurar GitHub Secrets

O workflow precisa de 2 secrets para funcionar:

### O que são GitHub Secrets?

GitHub Secrets são variáveis criptografadas que você define no repositório. Elas são:
- ✅ Criptografadas em repouso
- ✅ Apenas visíveis durante execução de workflows
- ✅ Nunca expostas em logs
- ✅ Ideais para SSH keys, API tokens, senhas

### Secrets Necessários

#### 1. `DEPLOY_SSH_KEY` - Private SSH Key

**O que é:** A chave privada SSH para autenticação no VPS

**Como gerar:**

```bash
# Se você JÁ tem uma chave SSH:
# Copie a chave privada existente
cat ~/.ssh/id_rsa

# Se você NÃO tem uma chave SSH:
# Gere uma nova
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_deploy -N ""

# Depois copie a chave privada:
cat ~/.ssh/id_rsa_deploy
```

**Como configurar no GitHub:**

1. Vá para seu repositório no GitHub
2. Clique em **Settings** (⚙️)
3. Vá para **Secrets and variables** → **Actions**
4. Clique em **New repository secret**
5. Nome: `DEPLOY_SSH_KEY`
6. Valor: Cole todo o conteúdo da chave privada (com BEGIN e END)
7. Clique em **Add secret**

**Exemplo de valor:**
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpQIBAAKCAQEA2x7q5vZ8k9L2pM8k4wX6yZ1aB5cD9eF3gH7jK2lM5nO8qP
1rS4tU7vW0xY3zAaBbCcD2eEf3gH4iJ1kL5mN6oP9qR2sT5uV8wX0yZ2aA3bB
...
-----END RSA PRIVATE KEY-----
```

#### 2. `DEPLOY_HOST` - VPS IP Address

**O que é:** O endereço IP do seu VPS

**Valor:** `145.223.94.196`

**Como configurar:**

1. No GitHub (mesmo lugar anterior)
2. Clique em **New repository secret**
3. Nome: `DEPLOY_HOST`
4. Valor: `145.223.94.196`
5. Clique em **Add secret**

### Verificação: SSH Key Setup no VPS

Antes de tudo, você precisa que a public SSH key esteja autorizada no VPS.

**No VPS (SSH como root):**

```bash
# 1. Entrar no VPS
ssh root@145.223.94.196

# 2. Criar diretório .ssh se não existir
mkdir -p ~/.ssh

# 3. Adicionar a PUBLIC key (gema da chave privada)
# Se você gerou com ssh-keygen -f ~/.ssh/id_rsa_deploy:
# Execute LOCALMENTE (no seu computador):
# cat ~/.ssh/id_rsa_deploy.pub

# Depois NO VPS, adicione a public key:
echo "ssh-rsa AAAA... seu-email@example.com" >> ~/.ssh/authorized_keys

# 4. Verificar permissões
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# 5. Testar conexão (sair do VPS e testar localmente)
exit

# LOCALMENTE:
ssh -i ~/.ssh/id_rsa_deploy root@145.223.94.196
# Deve conectar SEM pedir senha
```

---

## 🔍 Passo 2: Validar Workflow Criado

O workflow já foi criado em Fase 1. Vamos validar que está correto:

**Arquivo:** `.github/workflows/deploy.yml`

### Estrutura do Workflow

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]  # Triggered on push to main
  workflow_dispatch:   # Manual trigger via GitHub UI

jobs:
  test-and-build:     # Job 1: Quality gates
    runs-on: ubuntu-latest
    steps:
      - npm run lint
      - npm run typecheck
      - npm test
      - npm run build

  deploy:             # Job 2: Deploy (depends on Job 1)
    needs: test-and-build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - SSH para VPS
      - git fetch/reset latest
      - docker-compose down
      - docker-compose build
      - docker-compose up -d
      - Health check validation
```

### Triggers do Workflow

O workflow é acionado em 2 situações:

1. **Automatic:** Qualquer push para branch `main`
   ```bash
   git push origin main
   # → Workflow dispara automaticamente
   ```

2. **Manual:** Via GitHub UI
   - Vá para **Actions**
   - Selecione **Deploy to Production**
   - Clique em **Run workflow**
   - Selecione branch (main) e clique em **Run**

---

## ✅ Passo 3: Testar o Workflow

### Opção A: Teste Manual (Recomendado Primeiro)

**Via GitHub UI:**

1. Vá para seu repositório no GitHub
2. Clique em **Actions** (aba superior)
3. Selecione **Deploy to Production** (left sidebar)
4. Clique em **Run workflow**
5. Selecione branch: `main`
6. Clique em **Run workflow**
7. Observe a execução em tempo real

**O que você verá:**

```
Deploy to Production
├─ test-and-build
│  ├─ ⏳ Checkout code
│  ├─ ⏳ Setup Node.js
│  ├─ ⏳ Install dependencies (npm ci)
│  ├─ ⏳ Run linting (npm run lint)
│  ├─ ⏳ Run type checking (npm run typecheck)
│  ├─ ⏳ Run tests (npm test)
│  ├─ ⏳ Build application (npm run build)
│  └─ ✅ Job succeeded
│
└─ deploy
   ├─ ⏳ Checkout code
   ├─ ⏳ Deploy via SSH
   │  ├─ mkdir ~/.ssh
   │  ├─ Add SSH key
   │  ├─ SSH to VPS
   │  ├─ git fetch origin main
   │  ├─ docker-compose down
   │  ├─ docker-compose build --no-cache
   │  ├─ docker-compose up -d
   │  ├─ Health check (30 retries, 2s interval)
   │  └─ ✅ Deployment successful!
   └─ ✅ Job succeeded
```

**Tempo esperado:** 8-12 minutos
- test-and-build: 5-7 minutos
- deploy: 3-5 minutos (primeira vez mais lento por causa do build)

### Opção B: Teste Automático (via Git Push)

Depois que tudo estiver configurado e testado manualmente:

```bash
# Fazer uma mudança pequena
echo "# Teste de deployment" >> README.md

# Commit e push
git add README.md
git commit -m "test: trigger CI/CD workflow"
git push origin main

# Ir para GitHub e observar Actions rodando automaticamente
# https://github.com/seu-usuario/findash/actions
```

---

## 📊 Esperado vs Real

### Esperado na Execução

| Step | Esperado | Duração |
|------|----------|---------|
| test-and-build | ✅ PASS | 5-7 min |
| deploy | ✅ PASS | 3-5 min |
| **Total** | ✅ SUCCESS | 8-12 min |

### Se algo der errado

```
❌ test-and-build FAILED
   └─ npm run lint: ❌ Linting errors found
      → Solução: Corrigir erros de lint localmente e fazer push

❌ test-and-build FAILED
   └─ npm test: ❌ Tests failing
      → Solução: Corrigir testes localmente e fazer push

❌ deploy FAILED
   └─ SSH authentication failed
      → Solução: Verificar DEPLOY_SSH_KEY no GitHub Secrets

❌ deploy FAILED
   └─ docker-compose: permission denied
      → Solução: Verificar permissões no VPS
```

---

## 🔄 Workflow de Desenvolvimento com CI/CD

Depois que Fase 3 está completa, seu workflow é:

```
1. Você trabalha localmente
   ├─ npm run dev
   ├─ npm test (local)
   └─ git commit

2. Você faz push para main
   └─ git push origin main

3. GitHub Actions dispara automaticamente
   ├─ Job 1: test-and-build
   │  ├─ npm run lint
   │  ├─ npm run typecheck
   │  ├─ npm test
   │  └─ npm run build
   │
   └─ Job 2: deploy (se Job 1 passar)
      ├─ SSH para VPS
      ├─ git fetch/reset
      ├─ docker-compose build
      ├─ docker-compose up -d
      └─ Health check

4. Aplicação está em produção! 🚀
   └─ https://seu-dominio.com (atualized)
```

---

## 🔐 Security Best Practices

### ✅ SSH Key Management

```bash
# ✅ CORRETO: Usar chave dedicada para deploy
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_deploy -N ""

# ❌ EVITAR: Usar chave pessoal para deploy
# Nunca commit a chave privada no git
echo "id_rsa_deploy" >> ~/.gitignore
```

### ✅ GitHub Secrets Security

- ✅ Secrets são criptografados em repouso
- ✅ Secrets nunca aparecem em logs
- ✅ Secrets são read-only (não podem ser modificados via workflow)
- ✅ Remova secrets antigos quando rotacionar

### ✅ Workflow Security

```yaml
# ✅ BOM: SSH key não aparece em logs
- name: Deploy via SSH
  env:
    DEPLOY_KEY: ${{ secrets.DEPLOY_SSH_KEY }}
  run: |
    echo "$DEPLOY_KEY" > ~/.ssh/id_rsa
    chmod 600 ~/.ssh/id_rsa

# ❌ RUIM: SSH key em plaintext (NUNCA FAÇA)
# echo "-----BEGIN RSA..." >> file.txt
```

---

## 📈 Monitoramento da Execução

### Onde Ver Logs do Workflow

1. **GitHub UI:**
   - Vá para **Actions** no seu repositório
   - Clique no workflow em execução
   - Clique no job (test-and-build ou deploy)
   - Clique no step para ver logs

2. **Command Line (se tiver GitHub CLI):**
   ```bash
   # Ver último workflow
   gh run list --repo seu-usuario/findash

   # Ver logs do último workflow
   gh run view <run-id> --log

   # Ver logs em tempo real
   gh run watch <run-id>
   ```

### O que Observar nos Logs

```
✅ BOM
  - "npm run lint: 0 errors"
  - "npm test: 62 passed"
  - "npm run build: ✓ ready"
  - "✅ Deployment successful!"

❌ RUIM
  - "error: lint failed"
  - "error: test failed"
  - "error: SSH authentication failed"
  - "error: docker-compose: port 3000 already in use"
```

---

## 🛠️ Troubleshooting Comum

### Problema 1: "SSH authentication failed"

**Causa:** DEPLOY_SSH_KEY não configurado ou incorreto

**Solução:**
```bash
# Verificar que a chave está em GitHub Secrets
# Settings → Secrets → DEPLOY_SSH_KEY

# Verificar que public key está no VPS
ssh root@145.223.94.196
cat ~/.ssh/authorized_keys  # Deve conter sua public key

# Se não estiver, adicione:
echo "seu-public-key" >> ~/.ssh/authorized_keys
```

### Problema 2: "docker-compose: port 3000 already in use"

**Causa:** Container anterior não parou completamente

**Solução:**
```bash
# SSH para VPS
ssh root@145.223.94.196

# Parar containers
docker-compose down

# Remover containers/volumes se necessário
docker-compose down -v

# Tentar deploy novamente
```

### Problema 3: "Build failed: npm run build error"

**Causa:** TypeScript ou build error no código

**Solução:**
```bash
# Localmente, execute o build
npm run build

# Se falhar, corrigir localmente
# Commit das correções
git commit -m "fix: build error"
git push origin main
```

### Problema 4: "Health check failed after 30 retries"

**Causa:** Aplicação não iniciou corretamente

**Solução:**
```bash
# SSH para VPS
ssh root@145.223.94.196

# Ver logs da aplicação
docker-compose logs app

# Verificar variáveis de ambiente
docker-compose exec app env | grep DATABASE

# Se DATABASE_URL estiver vazia, verificar .env.production
# e fazer re-deploy
```

---

## ✅ Checklist de Conclusão - Fase 3

### Configuração
- [ ] SSH key gerada e adicionar ao VPS
- [ ] DEPLOY_SSH_KEY configurado no GitHub Secrets
- [ ] DEPLOY_HOST (145.223.94.196) configurado no GitHub Secrets
- [ ] .github/workflows/deploy.yml validado

### Validação
- [ ] Workflow executa manualmente (GitHub Actions)
- [ ] test-and-build job passa com sucesso
- [ ] deploy job passa com sucesso
- [ ] Aplicação acessível após deployment

### Testes
- [ ] Fazer push para main
- [ ] Observar GitHub Actions rodando
- [ ] Confirmar deployment automático
- [ ] Acessar https://seu-dominio.com
- [ ] Verificar que mudanças estão em produção

### Documentação
- [ ] README atualizado com CI/CD info
- [ ] Team informado do novo workflow
- [ ] Runbook preparado para troubleshooting

---

## 📝 Próximos Passos: Fase 4

**Fase 4: Monitoring & Finalization** (Cronograma: 2026-02-22)

Após Fase 3 estar funcionando:

1. ✅ Validar health checks em produção
2. ✅ Configurar monitoring (logs, alertas)
3. ✅ Preparar backup strategy
4. ✅ Finalizar documentação
5. ✅ Celebrar! 🎉

---

**Fase 3 Status:** 🔄 EM CONFIGURAÇÃO

Próxima ação: Configure GitHub Secrets e teste manualmente o workflow!

---

*Criado em 2026-02-20*
*Parte de: FinDash - Semana 10 Production Deployment*
