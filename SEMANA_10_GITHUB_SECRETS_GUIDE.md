# GitHub Secrets Configuration Guide - Fase 3

**Objetivo:** Configurar as credenciais necessárias para o CI/CD pipeline funcionar

**Tempo estimado:** 10 minutos

---

## ⚠️ IMPORTANTE

Os secrets que você vai configurar aqui são **SENSÍVEIS** e devem ser tratados com cuidado:
- ✅ Nunca compartilhe com ninguém
- ✅ Use uma chave SSH dedicada para deploy (não sua chave pessoal)
- ✅ Depois de adicionar ao GitHub, você NÃO pode visualizar novamente
- ✅ Se comprometer, remova e gere uma nova

---

## 🔑 Passo 1: Gerar SSH Key para Deploy

### Opção A: Você JÁ tem uma chave SSH que quer usar

Se você já tem `~/.ssh/id_rsa` ou similar e quer usar para deploy:

```bash
# Ver a chave privada (MANTENHA SEGURA)
cat ~/.ssh/id_rsa
# Copie TODO o conteúdo (com BEGIN e END)
```

**⚠️ AVISO:** Usar chave pessoal para produção é risco de segurança. Recomendamos criar uma chave dedicada.

### Opção B: Gerar uma Nova Chave SSH Dedicada (Recomendado)

```bash
# Gerar chave (sem passphrase para CI/CD)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_findash_deploy -N ""

# Você verá:
# Generating public/private rsa key pair.
# Your identification has been saved in /Users/seu-user/.ssh/id_rsa_findash_deploy
# Your public key has been saved in /Users/seu-user/.ssh/id_rsa_findash_deploy.pub
# ...
```

Depois:

```bash
# Ver a CHAVE PRIVADA (para GitHub Secrets)
cat ~/.ssh/id_rsa_findash_deploy

# Copie TODO o conteúdo
```

**Exemplo de saída:**
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpQIBAAKCAQEA2x7q5vZ8k9L2pM8k4wX6yZ1aB5cD9eF3gH7jK2lM5nO8qP
1rS4tU7vW0xY3zAaBbCcD2eEf3gH4iJ1kL5mN6oP9qR2sT5uV8wX0yZ2aA3bB
...
-----END RSA PRIVATE KEY-----
```

**Copie TUDO** (começando com `-----BEGIN` e terminando com `-----END`)

---

## 📌 Passo 2: Adicionar Public Key ao VPS

Antes de configurar GitHub Secrets, você precisa que a **public key** esteja autorizada no VPS.

### Se você gerou uma chave nova:

```bash
# Ver a PUBLIC key
cat ~/.ssh/id_rsa_findash_deploy.pub

# Exemplo de saída:
# ssh-rsa AAAA... seu-email@example.com
```

### Adicionar ao VPS:

```bash
# SSH para VPS
ssh root@145.223.94.196

# No VPS, criar .ssh se não existir
mkdir -p ~/.ssh

# Adicionar a public key (Cole a linha que você copiou)
echo "ssh-rsa AAAA... seu-email@example.com" >> ~/.ssh/authorized_keys

# Verificar permissões
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Ver o conteúdo (verificar que foi adicionado)
cat ~/.ssh/authorized_keys

# Sair do VPS
exit
```

### Testar a conexão (sem GitHub):

```bash
# LOCALMENTE, testar que consegue conectar
ssh -i ~/.ssh/id_rsa_findash_deploy root@145.223.94.196

# Se conectar SEM pedir senha, está correto! ✅
# Se pedir senha, a public key não foi adicionada corretamente
```

---

## 🔐 Passo 3: Configurar GitHub Secrets

### Acessar GitHub Secrets

1. Vá para seu repositório: `https://github.com/seu-usuario/findash`
2. Clique em **Settings** (⚙️ no topo)
3. No menu esquerdo, clique em **Secrets and variables** → **Actions**
4. Você verá: **Repository secrets**

### Secret 1: DEPLOY_SSH_KEY

**Criar novo secret:**

1. Clique no botão verde: **New repository secret**
2. Nome: `DEPLOY_SSH_KEY`
3. Secret: Cole aqui TODO o conteúdo da chave privada:
   ```
   -----BEGIN RSA PRIVATE KEY-----
   MIIEpQIBAAKCAQEA2x7q5vZ8k9L2pM8k4wX6yZ1aB5cD9eF3gH7jK2lM5nO8qP
   1rS4tU7vW0xY3zAaBbCcD2eEf3gH4iJ1kL5mN6oP9qR2sT5uV8wX0yZ2aA3bB
   ... (todo o conteúdo)
   -----END RSA PRIVATE KEY-----
   ```
4. Clique em **Add secret**

✅ Secret criado com sucesso!

### Secret 2: DEPLOY_HOST

**Criar novo secret:**

1. Clique no botão verde: **New repository secret**
2. Nome: `DEPLOY_HOST`
3. Secret: `145.223.94.196`
4. Clique em **Add secret**

✅ Secret criado com sucesso!

### Verificar Secrets Criados

Você deve ver 2 secrets na lista:
- ✅ DEPLOY_HOST
- ✅ DEPLOY_SSH_KEY

(Os valores não aparecem, apenas asteriscos `***`)

---

## ✅ Verificação Final

### Confirmar Tudo Está Configurado

- [ ] SSH key gerada
- [ ] Public key adicionada ao VPS
- [ ] Teste de conexão SSH passou
- [ ] DEPLOY_SSH_KEY no GitHub Secrets
- [ ] DEPLOY_HOST no GitHub Secrets
- [ ] Nenhuma chave privada commitada no git

---

## 🧪 Passo 4: Testar o Workflow

### Teste Manual via GitHub Actions

1. Vá para seu repositório no GitHub
2. Clique em **Actions** (aba superior)
3. Selecione **Deploy to Production** (no lado esquerdo)
4. Clique em **Run workflow**
5. Selecione branch: `main`
6. Clique em **Run workflow**

**Você verá:**
```
Deploy to Production (em execução)
├─ test-and-build
│  ├─ Checkout code ⏳
│  ├─ Setup Node.js ⏳
│  ├─ Install dependencies ⏳
│  ├─ Run linting ⏳
│  ├─ Run type checking ⏳
│  ├─ Run tests ⏳
│  ├─ Build application ⏳
│  └─ ✅ Completed
│
└─ deploy
   ├─ Checkout code ⏳
   ├─ Deploy via SSH ⏳
   └─ Notify completion ⏳
```

**Clique no job "Deploy to Production"** para ver mais detalhes

**Tempo esperado:** 8-12 minutos

### O Que Pode Dar Errado

#### ❌ Job fails: "SSH authentication failed"

```
❌ Deploy via SSH
   ! Host key verification failed.
   ! Permission denied (publickey).
```

**Solução:**
- Verificar que public key está no VPS: `ssh root@145.223.94.196; cat ~/.ssh/authorized_keys`
- Verificar que DEPLOY_SSH_KEY foi copiada corretamente (com BEGIN e END)
- Gerar chave nova se necessário

#### ❌ Job fails: "docker-compose: command not found"

**Solução:**
- Verificar que docker-compose está instalado no VPS
- SSH para VPS e testar: `docker-compose --version`

#### ❌ Job fails: "npm run lint: errors found"

**Solução:**
- Erro de linting no código
- Corrigir localmente: `npm run lint`
- Fazer push das correções

---

## 📝 Exemplo: Primeiro Deploy Bem-Sucedido

### Você verá algo como:

```
Deploy to Production
└─ 11:45:32 UTC - Successfully completed

Jobs:
├─ test-and-build ✅ PASSED (7m 23s)
│  └─ All steps completed
│
└─ deploy ✅ PASSED (4m 12s)
   └─ 🚀 Starting deployment...
      cd /root/FinDash
      git fetch origin main
      git reset --hard origin/main

      docker-compose down
      docker-compose build --no-cache
      docker-compose up -d

      ⏳ Waiting for health check...
      ✅ Deployment successful!

      Summary:
      - PostgreSQL: healthy ✅
      - Redis: healthy ✅
      - App: healthy ✅
      - Nginx: healthy ✅

🎉 Workflow completed successfully!
```

### Depois você pode:

1. Acessar a aplicação: `https://seu-dominio.com`
2. Ver que as mudanças estão lá
3. Verificar logs no VPS: `docker-compose logs app`

---

## 🚀 Próximas Vezes (Automático)

Depois de tudo funcionando, a cada push para `main`:

```bash
# Seu workflow no computador
git add .
git commit -m "feat: adicionar nova feature"
git push origin main

# GitHub Actions dispara AUTOMATICAMENTE ⚡
# 1. Testa código
# 2. Se passar, deploy para VPS
# 3. Aplicação em produção em ~10 minutos

# Você recebe notification quando termina
# (via email, GitHub UI, ou webhook se configurar)
```

---

## 📋 Checklist Final - Fase 3

- [ ] SSH key criada (pública e privada)
- [ ] Public key adicionada ao VPS (.ssh/authorized_keys)
- [ ] SSH test passou (conecta sem pedir senha)
- [ ] DEPLOY_SSH_KEY adicionado em GitHub Secrets
- [ ] DEPLOY_HOST adicionado em GitHub Secrets
- [ ] GitHub Actions workflow testado manualmente
- [ ] Workflow passou com sucesso (test-and-build + deploy)
- [ ] Aplicação está acessível após deployment
- [ ] Próximos pushes vão triggar CI/CD automaticamente

---

## 🎓 Lições de Segurança

1. **SSH Keys:**
   - ✅ Use chaves dedicadas para cada propósito
   - ✅ 4096-bit RSA é padrão seguro
   - ✅ Sem passphrase para CI/CD (ou use ssh-agent)
   - ❌ Nunca commit chaves privadas

2. **GitHub Secrets:**
   - ✅ Use para SSH keys, API tokens, senhas
   - ✅ Secrets são criptografados em repouso
   - ✅ Secrets nunca aparecem em logs
   - ❌ Não use para configurações públicas

3. **VPS Access:**
   - ✅ SSH key authentication (melhor que password)
   - ✅ Firewall: apenas 22, 80, 443
   - ✅ Fail2ban para proteger contra brute-force
   - ❌ Nunca use password SSH em produção

---

**Próximo Passo:** Teste manualmente o workflow e depois continue com Fase 4 (Monitoring)!

---

*Criado em 2026-02-20*
*Parte de: FinDash - Semana 10 Production Deployment*
