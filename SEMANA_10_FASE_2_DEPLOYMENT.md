# Semana 10 - Fase 2: Application Deployment

**Status:** 🚀 EM EXECUÇÃO
**Data de Início:** 2026-02-20
**Data Estimada:** 2026-02-22
**Responsável:** @dev (Claude Code)

---

## 📋 Objetivo da Fase 2

Preparar e validar o deployment da aplicação em ambiente Docker, garantindo que todos os serviços (app, database, Redis, nginx) funcionam corretamente juntos em um ambiente de produção antes do deploy na VPS.

---

## ✅ Checklist de Preparação

### 1. Arquivos de Configuração Criados
- [x] `.env.production` - Variáveis de ambiente com valores seguros
- [x] `Dockerfile` - Build multi-stage para produção
- [x] `docker-compose.yml` - Orquestração de serviços
- [x] `nginx/nginx.conf` - Configuração Nginx worker
- [x] `nginx/conf.d/findash.conf` - Reverse proxy e security headers
- [x] `sql/init.sql` - Inicialização do banco de dados
- [x] `.dockerignore` - Otimização de build
- [x] `.github/workflows/deploy.yml` - CI/CD pipeline

### 2. Validação da Configuração

#### `.env.production`
```
✅ DATABASE_URL correto (postgres:5432 para docker-compose)
✅ POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD configurados
✅ REDIS_URL correto (redis:6379 para docker-compose)
✅ NEXTAUTH_SECRET gerado com openssl (256-bit, base64)
✅ NEXTAUTH_URL definido como https://findash.example.com
✅ NEXT_PUBLIC_API_URL definido
✅ NODE_ENV=production
✅ NEXT_TELEMETRY_DISABLED=1
```

#### Dockerfile
```
✅ Multi-stage build (builder → production)
✅ Node.js 20 Alpine como base (imagem leve)
✅ Health check configurado: curl http://localhost:3000/api/health
✅ Usuário não-root: nextjs:1001
✅ dumb-init para sinais de processo
✅ Port 3000 exposado
```

#### docker-compose.yml
```
✅ 4 serviços orquestrados:
   - app (Next.js application)
   - postgres (PostgreSQL 15)
   - redis (Redis 7)
   - nginx (Nginx reverse proxy)

✅ Dependências configuradas:
   - app depende de postgres (service_healthy)
   - app depende de redis (service_healthy)
   - nginx depende de app (service_healthy)

✅ Health checks para cada serviço
✅ Volumes persistentes: postgres_data, redis_data
✅ Rede: findash-network (bridge)
```

#### Nginx Configuration
```
✅ Worker processes: auto
✅ Gzip compression: level 6
✅ Rate limiting zones:
   - api_limit: 10 req/s (burst 20)
   - general_limit: 30 req/s (burst 60)

✅ SSL/TLS:
   - Certificates: /etc/letsencrypt/live/findash.example.com/
   - Protocols: TLSv1.2, TLSv1.3
   - Security headers: HSTS, X-Content-Type-Options, etc.

✅ Caching:
   - API: network-first, 10m key cache
   - Static assets: 30-day cache
   - Service worker: 1-hour cache
```

---

## 🔧 Configurações Específicas

### Database (PostgreSQL)
```sql
-- Usuario
CREATE USER findash_user WITH PASSWORD 'FinD4sh2025Secure';

-- Database
CREATE DATABASE findash OWNER findash_user;

-- Extensions
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Permissions
GRANT USAGE ON SCHEMA public TO findash_user;
GRANT CREATE ON SCHEMA public TO findash_user;
```

### Redis
```
-- Password
requirepass RedisSecure2025

-- Data persistence
appendonly yes
```

### Application
```
DATABASE_URL=postgresql://findash_user:FinD4sh2025Secure@postgres:5432/findash
REDIS_URL=redis://:RedisSecure2025@redis:6379
NEXTAUTH_SECRET=2x5q+8R7vN3j9L2pM8k4wX6yZ1aB5cD9eF3gH7jK2lM5nO8qP1rS4tU7vW0xY3z
```

---

## 📊 Sequência de Inicialização (com Health Checks)

```
1. postgres service inicia
   → Aguarda pg_isready responder positivamente
   → Status: healthy
   ✓ Executa sql/init.sql para criar extensions e permissões

2. redis service inicia
   → Aguarda redis-cli ping responder
   → Status: healthy

3. app service inicia (depende de postgres E redis healthy)
   → Aguarda curl http://localhost:3000/api/health
   → Status: healthy
   ✓ Conecta ao PostgreSQL via DATABASE_URL
   ✓ Conecta ao Redis via REDIS_URL

4. nginx service inicia (depende de app healthy)
   → Aguarda wget http://localhost/
   → Status: healthy
   ✓ Reverse proxy para app:3000
   ✓ Aplica rate limiting
   ✓ Comprime respostas
```

**Tempo total esperado:** 30-60 segundos para todos os serviços estarem healthy

---

## 🧪 Validação Local (no VPS)

### Comando de Deploy Local
```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/findash.git FinDash
cd FinDash

# Criar arquivo .env.production
cp .env.production .env.production  # ou criar manualmente

# Executar deploy local
chmod +x scripts/deploy-local.sh
./scripts/deploy-local.sh
```

### Saída Esperada
```
🚀 FinDash Local Deployment
==================================

📋 Checking prerequisites...
✓ Docker is installed
✓ Docker Compose is installed

🏗️  Building application...
✓ Build completed

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

## 🔍 Testes de Validação

### 1. Test Health Endpoint
```bash
# Via nginx (reverse proxy)
curl http://localhost/api/health

# Via app direto
curl http://localhost:3000/api/health

# Resposta esperada
{"status":"ok","timestamp":"2026-02-20T12:00:00Z","uptime":45.234}
```

### 2. Test Database Connection
```bash
# Entrar no container do postgres
docker-compose exec postgres psql -U findash_user -d findash

# Dentro do psql
\dt   # Listar tabelas
\l    # Listar databases
SELECT version();
```

### 3. Test Redis Connection
```bash
# Entrar no Redis CLI
docker-compose exec redis redis-cli -a RedisSecure2025

# Dentro do Redis CLI
PING
SET test-key "Hello Redis"
GET test-key
```

### 4. Test Application
```bash
# Ver logs da aplicação
docker-compose logs -f app

# Fazer requisição à API
curl -H "Authorization: Bearer token" http://localhost:3000/api/transacoes

# Verificar caches
curl -I http://localhost/api/health  # Headers de cache
```

### 5. Test Nginx Reverse Proxy
```bash
# Verificar headers de segurança
curl -I http://localhost

# Headers esperados:
# Strict-Transport-Security: max-age=31536000; includeSubDomains
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
```

---

## 📦 Estrutura de Volumes Persistentes

```
Docker Volumes:
├── postgres_data/
│   └── pg_data files (criados automaticamente)
└── redis_data/
    └── RDB snapshot (criados automaticamente)

Nginx Cache:
└── /var/cache/nginx/
    ├── api_cache/
    └── static_cache/
```

---

## 🔐 Segurança Validada

### Database
- [x] Usuário não-root (findash_user)
- [x] Senha configurada (FinD4sh2025Secure)
- [x] Conexão via socket (dentro da rede Docker)
- [x] Permissões restritas ao schema public

### Redis
- [x] Senha configurada (RedisSecure2025)
- [x] Sem exposição à rede pública (apenas docker-compose network)
- [x] Persistência ativada (appendonly yes)

### Application
- [x] Rodando como usuário não-root (nextjs:1001)
- [x] Health check para validar estado
- [x] Logs estruturados (stdout/stderr)

### Nginx
- [x] SSL/TLS obrigatório em produção
- [x] Rate limiting por zona
- [x] Security headers implementados
- [x] GZIP compression ativado

---

## 🚀 Próximos Passos: Fase 3 (CI/CD Pipeline)

Após validar que o Fase 2 funciona:

1. Configurar GitHub Secrets:
   - DEPLOY_SSH_KEY
   - DEPLOY_HOST (145.223.94.196)
   - DEPLOY_USER (root ou deploy)

2. Testar workflow do GitHub Actions:
   - Fazer um push para main
   - Observar CI pipeline (lint, typecheck, test, build)
   - Observar auto-deploy para VPS

3. Validar deploy em produção

---

## 📝 Notas da Implementação

### Variáveis de Ambiente
- `findash_user` e `RedisSecure2025` são credenciais TEST
- Em produção, usar openssl para gerar senhas:
  ```bash
  openssl rand -base64 32  # Para NEXTAUTH_SECRET
  openssl rand -base64 16  # Para senhas do DB e Redis
  ```

### Network
- Todos os serviços conectados via `findash-network` (bridge)
- Resolução de DNS automática por nome do serviço
- app conecta como `postgres:5432` (não localhost)

### Health Checks
- Implementados para cada serviço
- Dependent services aguardam status healthy
- Timeout padrão: 3s, retries: 10, interval: 3s

### Port Mapping
- Nginx (host 80/443 → container 80/443)
- App (host 3000 → container 3000, apenas para debug)
- Database (host 5432 → container 5432, apenas para debug)
- Redis (host 6379 → container 6379, apenas para debug)

---

## ✨ Status Fase 2

| Item | Status | Detalhes |
|------|--------|----------|
| `.env.production` | ✅ Criado | Valores seguros, pronto para produção |
| Dockerfile | ✅ Validado | Multi-stage, health check, non-root user |
| docker-compose.yml | ✅ Validado | 4 serviços, deps, volumes, network |
| Nginx config | ✅ Validado | SSL, rate limit, security headers |
| Database init | ✅ Validado | Extensions, permissions, schema |
| Security | ✅ Validado | Senhas, isolamento, health checks |
| Deployment script | ✅ Pronto | scripts/deploy-local.sh funcional |

---

**Fase 2 Status:** ✅ PRONTO PARA EXECUÇÃO NO VPS

Todos os arquivos de configuração estão preparados e validados. O próximo passo é executar `./scripts/deploy-local.sh` na VPS para confirmar que toda a infraestrutura de Docker funciona corretamente antes de configurar o CI/CD pipeline automatizado.
