# 🚀 DEPLOYMENT EXECUTION - DO THIS NOW!

**Status:** 🔴 AWAITING YOUR MANUAL ACTIONS
**Timeline:** ~30 minutos para completar
**Data:** 2026-02-20

---

## ⚠️ IMPORTANTE

Você vai fazer 3 coisas manualmente:
1. Gerar SSH key (local)
2. Configurar GitHub Secrets
3. Fazer push para main (trigger deployment)

Tudo o mais está automatizado! ✅

---

## 🔐 PASSO 1: GERAR SSH KEY (5 min)

### No seu computador, abra terminal:

```bash
# Gerar chave SSH (sem passphrase)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_deploy -N ""

# Você verá:
# Generating public/private rsa key pair.
# Your identification has been saved in ~/.ssh/id_rsa_deploy
# Your public key has been saved in ~/.ssh/id_rsa_deploy.pub
```

### Copiar a CHAVE PRIVADA:

```bash
# Copie TUDO isso (com BEGIN e END)
cat ~/.ssh/id_rsa_deploy
```

**Você verá:**
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpQIBAAKCAQEA2x7q5vZ8k9L2pM8k4wX6yZ1aB5cD9eF3gH7jK2lM5nO8qP
1rS4tU7vW0xY3zAaBbCcD2eEf3gH4iJ1kL5mN6oP9qR2sT5uV8wX0yZ2aA3bB
...
-----END RSA PRIVATE KEY-----
```

✅ **Copie tudo isso para usar no Passo 2**

---

## 🔑 PASSO 2: CONFIGURAR GITHUB SECRETS (10 min)

### Ir para GitHub:

1. Vá para: `https://github.com/seu-usuario/findash`
2. Clique em **Settings** (⚙️ no topo)
3. Clique em **Secrets and variables** → **Actions** (no menu esquerdo)
4. Clique em **New repository secret**

### Secret 1: DEPLOY_SSH_KEY

```
Name: DEPLOY_SSH_KEY
Value: Cole TODA a chave privada que você copiou acima
       (-----BEGIN RSA PRIVATE KEY-----
        ...
        -----END RSA PRIVATE KEY-----)
```

✅ Clique em **Add secret**

### Secret 2: DEPLOY_HOST

```
Name: DEPLOY_HOST
Value: 145.223.94.196
```

✅ Clique em **Add secret**

### Verificar:

Você deve ver na página:
- ✅ DEPLOY_HOST
- ✅ DEPLOY_SSH_KEY

(Os valores mostram como `***` por segurança)

---

## 🧪 PASSO 3: ADICIONAR PUBLIC KEY NO VPS (5 min)

**IMPORTANTE:** Você precisa fazer isso ANTES de fazer push!

### SSH para o VPS:

```bash
# Conectar no VPS
ssh root@145.223.94.296

# No VPS, criar .ssh se não existir
mkdir -p ~/.ssh

# Copiar a public key
# Localmente, execute (no seu computador):
cat ~/.ssh/id_rsa_deploy.pub

# Você verá algo como:
# ssh-rsa AAAA... seu-email@example.com

# No VPS, adicione isso:
echo "ssh-rsa AAAA..." >> ~/.ssh/authorized_keys

# Configurar permissões
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Sair do VPS
exit
```

### Testar a conexão:

```bash
# Deve conectar SEM pedir senha
ssh -i ~/.ssh/id_rsa_deploy root@145.223.94.296

# Se funcionar, sair:
exit
```

✅ Se conectou, está correto!

---

## 📤 PASSO 4: FAZER PUSH PARA MAIN (Trigger Deployment)

### No seu computador:

```bash
# Ver status atual
git status

# Você deve ver o repositório limpo (nothing to commit)
# Se houver mudanças, fazer commit:
git add .
git commit -m "feat: semana 10 completo - pronto para deployment"

# Fazer push para main
git push origin main
```

**Você verá:**
```
Enumerating objects: X, done.
Counting objects: 100% (X/X), done.
...
To github.com:seu-usuario/findash.git
   abc123..def456  main -> main
```

✅ **PUSH COMPLETO!** Agora GitHub Actions vai disparar automaticamente!

---

## 🔍 PASSO 5: MONITORAR DEPLOYMENT (8-12 min)

### Ir para GitHub Actions:

1. Vá para: `https://github.com/seu-usuario/findash/actions`
2. Você deve ver um workflow rodando: **"Deploy to Production"**
3. Clique nele para ver o progresso em tempo real

### O que você verá:

```
Deploy to Production (em andamento)
├─ test-and-build (em andamento)
│  ├─ Checkout code ✓
│  ├─ Setup Node.js ✓
│  ├─ Install dependencies ✓
│  ├─ Run linting ⏳
│  ├─ Run type checking ⏳
│  ├─ Run tests ⏳
│  └─ Build application ⏳
│
└─ deploy (aguardando)
   ├─ Checkout code (aguardando)
   └─ Deploy via SSH (aguardando)
```

### Tempo esperado:

```
test-and-build: 5-7 minutos
deploy: 3-5 minutos
────────────────────────
Total: 8-12 minutos
```

### Se tudo passar:

```
✅ test-and-build PASSED
✅ deploy PASSED
✅ Application deployed successfully!
```

---

## ✅ PASSO 6: VERIFICAR DEPLOYMENT (2 min)

### Depois que o workflow passar:

```bash
# SSH para VPS
ssh root@145.223.94.296

# Verificar que containers estão rodando
docker-compose ps

# Você deve ver 4 containers "Up":
# app    ✓
# postgres ✓
# redis  ✓
# nginx  ✓

# Testar health endpoint
curl http://localhost:3000/api/health

# Você verá:
# {"status":"ok","timestamp":"...","uptime":...}

# Sair
exit
```

✅ **DEPLOYMENT SUCESSO!**

---

## 🌐 PASSO 7: ACESSAR A APLICAÇÃO (1 min)

### Via HTTPS:

```bash
# Abrir no navegador:
https://findash.example.com

# OU via IP (se não tiver domínio configurado):
https://145.223.94.296
```

**Você verá:** A aplicação FinDash rodando em produção! 🎉

---

## 📊 TROUBLESHOOTING

### ❌ Job failed: "SSH authentication failed"

**Problema:** DEPLOY_SSH_KEY incorreto ou public key não no VPS

**Solução:**
1. Verificar que DEPLOY_SSH_KEY tem BEGIN e END
2. Verificar que public key está em VPS: `ssh root@145.223.94.296; cat ~/.ssh/authorized_keys`
3. Se não estiver, adicionar: `echo "public-key" >> ~/.ssh/authorized_keys`

### ❌ Job failed: "docker-compose: command not found"

**Problema:** docker-compose não instalado no VPS

**Solução:**
1. SSH para VPS
2. Instalar docker-compose: `apt install -y docker-compose`
3. Fazer push novamente para trigger novo deployment

### ❌ Job failed: "npm run lint: errors found"

**Problema:** Código tem erros de lint

**Solução:**
1. Localmente: `npm run lint`
2. Corrigir erros
3. Fazer commit e push

### ❌ Health check timeout

**Problema:** App não iniciou corretamente

**Solução:**
1. SSH para VPS
2. Ver logs: `docker-compose logs app`
3. Checar variáveis de ambiente: `docker-compose exec app env`
4. Se necessário, fazer rollback: `git reset --hard <commit-anterior>`

---

## ✨ SUCESSO!

Depois de completar os 7 passos acima:

```
✅ GitHub Secrets configurados
✅ SSH key setup pronto
✅ Deployment automático executado
✅ Containers rodando em produção
✅ Aplicação acessível
✅ CI/CD funcionando
```

---

## 📝 PRÓXIMOS PASSOS (APÓS DEPLOY)

### Immediate (Hoje):

```bash
# Verificar logs da aplicação
ssh root@145.223.94.296
docker-compose logs app | tail -50

# Testar endpoints
curl https://findash.example.com/api/health

# Verificar database
docker-compose exec postgres psql -U findash_user -d findash -c "SELECT COUNT(*) FROM transactions;"

exit
```

### Semana 1 (Monitoramento):

- [ ] Monitorar saúde da aplicação
- [ ] Verificar logs diariamente
- [ ] Confirmar backups rodando
- [ ] Validar SSL certificate
- [ ] Teste de rollback

### Semana 2+:

- [ ] Otimização de performance
- [ ] Monitoring setup avançado
- [ ] Treinamento do team
- [ ] Documentação final

---

## 📋 CHECKLIST FINAL

```
Pré-Deployment:
  ☐ SSH key gerada
  ☐ DEPLOY_SSH_KEY no GitHub Secrets
  ☐ DEPLOY_HOST no GitHub Secrets
  ☐ Public key adicionada ao VPS
  ☐ SSH test passou (sem pedir senha)

Deployment:
  ☐ git push origin main executado
  ☐ GitHub Actions rodando
  ☐ test-and-build job passou
  ☐ deploy job passou
  ☐ Containers rodando no VPS

Pós-Deployment:
  ☐ Health endpoint respondendo
  ☐ Database conectado
  ☐ Aplicação acessível
  ☐ Logs sem errors
  ☐ SSL/TLS funcionando

Status: ✅ PRONTO PARA OPERAÇÕES
```

---

## 🎉 PARABÉNS!

Você completou:
- ✅ Semana 9: UX & PWA
- ✅ Semana 10: Production Deployment
- ✅ GitHub Secrets: Configurados
- ✅ CI/CD: Automático
- ✅ Deployment: Executado

**Sua aplicação está em produção!** 🚀

---

*Guia Prático - 2026-02-20*
*Tempo Total: ~30 minutos*
*Status: READY FOR EXECUTION*
