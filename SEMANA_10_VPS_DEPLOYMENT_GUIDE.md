# VPS Deployment Guide - FinDash Semana 10

**VPS IP:** 145.223.94.196
**Deployment Path:** /root/FinDash
**Domain:** findash.example.com
**Deploy User:** root

---

## 📋 Pre-Deployment Checklist

### VPS Prerequisites
- [ ] VPS acessível via SSH: `ssh root@145.223.94.196`
- [ ] SSH key configurada no cliente
- [ ] Git instalado no VPS
- [ ] Docker instalado no VPS (`docker --version`)
- [ ] Docker Compose instalado (`docker-compose --version`)
- [ ] PostgreSQL não instalado localmente (usar Docker)
- [ ] Redis não instalado localmente (usar Docker)
- [ ] Nginx não instalado localmente (usar Docker)
- [ ] Espaço em disco suficiente (mínimo 10GB)
- [ ] Firewall configurado (portas 22, 80, 443 abertas)

### Local Repository
- [ ] Todos os commits fazidos no repositório local
- [ ] Branch main atualizado
- [ ] `.env.production` criado com valores válidos
- [ ] Nenhum arquivo `.env` ou secrets commitados
- [ ] Arquivo `.gitignore` inclui `.env*` e `.git/`

---

## 🚀 Passo 1: SSH para VPS

```bash
# SSH para VPS
ssh root@145.223.94.196

# Verificar OS (deve ser Ubuntu 20.04+ ou Debian 11+)
cat /etc/os-release

# Atualizar sistema
apt update && apt upgrade -y

# Instalar dependências básicas
apt install -y curl wget git htop
```

**Saída esperada:**
```
Ubuntu 20.04.6 LTS
Reading package lists... Done
Setting up curl (7.68.0-1ubuntu1) ... Done
```

---

## 🐳 Passo 2: Instalar Docker & Docker Compose

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo bash get-docker.sh
sudo usermod -aG docker root

# Instalar Docker Compose (se não incluído)
curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verificar instalação
docker --version
docker-compose --version
```

**Saída esperada:**
```
Docker version 24.0.6
Docker Compose version v2.24.0
```

---

## 📂 Passo 3: Clonar Repositório

```bash
# Navegar para /root
cd /root

# Clonar repositório
git clone https://github.com/seu-usuario/findash.git FinDash

# Ou pull se já existe (semana 9 deployment)
cd FinDash
git pull origin main

# Verificar que o arquivo de deploy está presente
ls -la scripts/deploy-local.sh
chmod +x scripts/deploy-local.sh
```

**Estrutura esperada:**
```
/root/FinDash/
├── src/
├── public/
├── docker-compose.yml
├── Dockerfile
├── .env.production
├── nginx/
│   ├── nginx.conf
│   └── conf.d/findash.conf
├── sql/
│   └── init.sql
├── scripts/
│   └── deploy-local.sh
└── .github/workflows/
    └── deploy.yml
```

---

## 🔐 Passo 4: Configurar Variáveis de Ambiente

```bash
# Criar .env.production com valores reais
cd /root/FinDash
cp .env.production.example .env.production

# Editar com valores reais
nano .env.production
```

**Valores a atualizar:**

```bash
# Gerar NEXTAUTH_SECRET seguro (copiar saída)
openssl rand -base64 32
# Colar output na linha: NEXTAUTH_SECRET=<output>

# Gerar senhas para database e Redis (copiar outputs)
openssl rand -base64 16
# Colar em: POSTGRES_PASSWORD= e REDIS_PASSWORD=

# Atualizar domain (substituir findash.example.com pelo seu domínio)
NEXTAUTH_URL=https://seu-dominio.com
NEXT_PUBLIC_API_URL=https://seu-dominio.com

# Atualizar API key (se usando Inter API)
API_INTER_KEY=<sua_chave_real>
```

**Comandos para gerar valores seguros:**
```bash
# Todas as três
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
echo "POSTGRES_PASSWORD=$(openssl rand -base64 16)"
echo "REDIS_PASSWORD=$(openssl rand -base64 16)"
```

---

## 🧪 Passo 5: Validar Configuração Docker

```bash
# Verificar sintaxe do docker-compose.yml
docker-compose config

# Saída esperada: YAML válido sem erros
```

---

## 🚀 Passo 6: Deploy com Script Local

```bash
# Executar deploy script
./scripts/deploy-local.sh

# O script vai:
# 1. Fazer npm run build (Next.js)
# 2. Fazer docker-compose build
# 3. Parar containers existentes
# 4. Iniciar containers (postgres, redis, app, nginx)
# 5. Aguardar health checks
# 6. Exibir URLs e comandos úteis
```

**Tempo esperado:** 3-5 minutos na primeira execução

**Saída esperada:**
```
🚀 FinDash Local Deployment
==================================

📋 Checking prerequisites...
✓ Docker is installed
✓ Docker Compose is installed

🏗️  Building application...
✓ Build completed (5.2s)

🐳 Building Docker image...
✓ Docker image built

🛑 Stopping existing containers...
✓ Containers stopped

🚀 Starting services...
✓ Services started

⏳ Waiting for services to be healthy...
Checking database... ✓
Checking Redis... ✓
Checking application... ✓

==================================
✅ Deployment completed successfully!
==================================

🔗 Application URLs:
   - HTTP:  http://localhost
   - HTTPS: https://localhost (with self-signed cert)

📊 Services:
   - Next.js App: http://localhost:3000
   - PostgreSQL:  localhost:5432
   - Redis:       localhost:6379
   - Nginx:       localhost:80/443

🔍 Useful commands:
   - View logs:   docker-compose logs -f app
   - Bash shell:  docker-compose exec app sh
   - psql:        docker-compose exec postgres psql -U findash_user -d findash
   - Redis CLI:   docker-compose exec redis redis-cli
   - Stop:        docker-compose down
```

---

## ✅ Passo 7: Validar Serviços

```bash
# 1. Verificar containers rodando
docker ps

# Saída esperada: 4 containers (app, postgres, redis, nginx)

# 2. Verificar health endpoint
curl http://localhost/api/health

# Saída esperada:
# {"status":"ok","timestamp":"...","uptime":123.45}

# 3. Ver logs da aplicação
docker-compose logs app

# 4. Conectar ao banco de dados
docker-compose exec postgres psql -U findash_user -d findash

# Dentro do psql:
# \dt          # Listar tabelas
# \q           # Sair

# 5. Conectar ao Redis
docker-compose exec redis redis-cli -a RedisPassword

# Dentro do Redis:
# PING
# SET test "value"
# GET test
```

---

## 🌐 Passo 8: Configurar Domain & SSL

### Opção A: Let's Encrypt (Recomendado)

```bash
# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Gerar certificado (substitua seu-dominio.com)
certbot certonly --standalone -d seu-dominio.com -d www.seu-dominio.com

# Certificado será salvo em: /etc/letsencrypt/live/seu-dominio.com/

# Editar nginx config com paths reais
nano nginx/conf.d/findash.conf

# Atualizar estas linhas:
# ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
# ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;

# Recarregar nginx
docker-compose exec nginx nginx -s reload
```

### Opção B: Self-Signed Certificate (Testing Only)

```bash
# Gerar certificado auto-assinado
openssl req -x509 -newkey rsa:4096 -keyout /root/FinDash/nginx/key.pem -out /root/FinDash/nginx/cert.pem -days 365 -nodes

# Atualizar nginx config:
# ssl_certificate /root/FinDash/nginx/cert.pem;
# ssl_certificate_key /root/FinDash/nginx/key.pem;

# Recarregar nginx
docker-compose exec nginx nginx -s reload
```

---

## 🔄 Passo 9: Monitorar Logs

```bash
# Logs da aplicação em tempo real
docker-compose logs -f app

# Logs do nginx
docker-compose logs -f nginx

# Logs do postgres
docker-compose logs -f postgres

# Logs do redis
docker-compose logs -f redis

# Todos os logs
docker-compose logs -f
```

---

## 🛑 Passo 10: Comandos Úteis de Manutenção

```bash
# Parar todos os serviços
docker-compose down

# Reiniciar serviços
docker-compose restart

# Reiniciar apenas um serviço
docker-compose restart app

# Remover volumes (cuidado: deleta dados!)
docker-compose down -v

# Limpar imagens não usadas
docker image prune -a

# Ver uso de disco
docker system df

# Ver consumo de recursos
docker stats

# Backup do banco de dados
docker-compose exec postgres pg_dump -U findash_user findash > backup.sql

# Restaurar backup
docker-compose exec -T postgres psql -U findash_user findash < backup.sql
```

---

## 🚨 Troubleshooting

### Container não inicia
```bash
# Ver logs de erro
docker-compose logs app

# Verificar se porta já está em uso
netstat -tuln | grep 3000

# Kill processo usando a porta
fuser -k 3000/tcp
```

### Database connection error
```bash
# Testar conexão postgres
docker-compose exec postgres psql -U findash_user -d findash

# Verificar variáveis de ambiente
docker-compose exec app env | grep DATABASE
```

### Redis connection error
```bash
# Testar conexão redis
docker-compose exec redis redis-cli -a RedisPassword ping

# Verificar variáveis de ambiente
docker-compose exec app env | grep REDIS
```

### Nginx não está proxying
```bash
# Verificar sintaxe nginx
docker-compose exec nginx nginx -t

# Recarregar config
docker-compose exec nginx nginx -s reload

# Ver logs nginx
docker-compose logs nginx
```

### Port 80/443 em uso
```bash
# Encontrar processo usando a porta
lsof -i :80
lsof -i :443

# Kill processo
kill -9 <PID>
```

---

## 📊 Verificação Final

Após deployment, você deve conseguir:

- [x] Acessar `https://seu-dominio.com` e ver a aplicação
- [x] Fazer login com suas credenciais
- [x] Navegar para Transações, Analytics, Custos
- [x] Ver dados sendo carregados do banco
- [x] Sync em tempo real funcionando
- [x] Dark mode funcionando
- [x] PWA funcionando (offline support)
- [x] Mobile responsive funcionando
- [x] Acessar `https://seu-dominio.com/api/health` e ver status

---

## 🔐 Security Checklist

- [ ] Firewall: apenas 22, 80, 443 abertos
- [ ] SSH: trocar porta padrão se desejado
- [ ] SSH: desabilitar password auth, usar key only
- [ ] SSL: certificado válido (Let's Encrypt)
- [ ] HSTS: habilitado em nginx
- [ ] Senhas: geradas com openssl rand -base64
- [ ] Secrets: não commitados no git
- [ ] Database: acesso restrito à rede docker
- [ ] Redis: senha configurada

---

## 📈 Performance Tuning

### Nginx
```bash
# Aumentar worker connections (se muitos usuários)
# Editar nginx.conf:
# worker_connections 4096;  # padrão 1024

# Recarregar
docker-compose exec nginx nginx -s reload
```

### Database
```bash
# Ver queries lentas
docker-compose exec postgres psql -U findash_user -d findash
postgres=> SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
```

### Redis
```bash
# Ver uso de memória
docker-compose exec redis redis-cli -a RedisPassword info memory

# Ver estatísticas
docker-compose exec redis redis-cli -a RedisPassword info stats
```

---

## 📝 Próximas Fases

Após Fase 2 (Application Deployment):

- **Fase 3:** CI/CD Pipeline (GitHub Actions)
- **Fase 4:** Monitoring & Finalization (Sentry, monitoring)

---

**Criado em:** 2026-02-20
**Próxima revisão:** Após Fase 2 completada
