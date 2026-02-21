# Semana 10 - Deployment Checklist

## Pre-Deployment Verification (ANTES DE FAZER DEPLOY)

### Code Quality ✅
- [ ] Todos os testes passando: `npm test`
- [ ] Linting limpo: `npm run lint`
- [ ] Build sem erros: `npm run build`
- [ ] TypeScript typecheck: `npm run typecheck`
- [ ] Nenhum `console.log` ou `debugger` no código de produção

### Git Status
- [ ] Branch main está atualizado: `git status`
- [ ] Todos os commits feitos: `git log --oneline -5`
- [ ] Repository é público/privado conforme necessário
- [ ] Git credentials configurados

### Docker Files Created ✅
- [ ] `Dockerfile` - Multi-stage build
- [ ] `docker-compose.yml` - Orquestração de containers
- [ ] `.dockerignore` - Otimização de build
- [ ] `nginx/nginx.conf` - Configuração Nginx
- [ ] `nginx/conf.d/findash.conf` - Reverse proxy
- [ ] `sql/init.sql` - Database initialization
- [ ] `.github/workflows/deploy.yml` - CI/CD

### Environment Configuration ✅
- [ ] `.env.production.example` criado com comentários
- [ ] Variáveis de ambiente documentadas
- [ ] Secrets preparados (não commitar!)

### VPS Prerequisites
- [ ] VPS acessível: `ssh root@145.223.94.196`
- [ ] SSH key configurada
- [ ] Git instalado no VPS
- [ ] Docker instalado no VPS
- [ ] Docker Compose instalado no VPS
- [ ] PostgreSQL disponível (local ou Docker)
- [ ] Redis disponível (local ou Docker)

### Domain & SSL
- [ ] Domain name registrado
- [ ] Domain pointing to VPS IP
- [ ] SSL certificate preparado (Let's Encrypt)
- [ ] Nginx config atualizado com domain

### GitHub Configuration
- [ ] GitHub repository criado
- [ ] Repository é público (para GitHub Actions)
- [ ] Secrets configurados:
  - [ ] `DEPLOY_SSH_KEY` - Private SSH key
  - [ ] `DEPLOY_HOST` - VPS IP (145.223.94.196)
  - [ ] `DEPLOY_USER` - SSH user (root or deploy)
  - [ ] `SLACK_WEBHOOK` - (Optional, for notifications)

---

## Phase 1: VPS Infrastructure Setup (6 horas)

### SSH & System Access (1 hora)
```bash
# Step 1: SSH into VPS
ssh root@145.223.94.196

# Step 2: Verify system
cat /etc/os-release

# Step 3: Update system
apt update && apt upgrade -y

# Step 4: Configure firewall
ufw allow 22,80,443/tcp
ufw enable

# Step 5: Create non-root user (optional)
adduser deploy
usermod -aG sudo deploy
```
- [ ] SSH access verified
- [ ] System updated
- [ ] Firewall configured

### System Packages (2 horas)
```bash
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# Docker & Docker Compose
apt install -y docker.io docker-compose
systemctl enable docker
usermod -aG docker deploy

# PostgreSQL 15
apt install -y postgresql postgresql-contrib postgresql-15-timescaledb
systemctl enable postgresql

# Redis
apt install -y redis-server
systemctl enable redis-server

# Nginx
apt install -y nginx
systemctl enable nginx

# Certbot for SSL
apt install -y certbot python3-certbot-nginx
```
- [ ] Node.js 20 installed: `node --version`
- [ ] Docker installed: `docker --version`
- [ ] Docker Compose installed: `docker-compose --version`
- [ ] PostgreSQL installed: `psql --version`
- [ ] Redis installed: `redis-cli --version`
- [ ] Nginx installed: `nginx -v`
- [ ] Certbot installed: `certbot --version`

### Database Setup (2 horas)
```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database
CREATE DATABASE findash;
CREATE USER findash_user WITH PASSWORD 'your_secure_password';
ALTER ROLE findash_user SET client_encoding TO 'utf8';
ALTER ROLE findash_user SET default_transaction_isolation TO 'read committed';
GRANT ALL PRIVILEGES ON DATABASE findash TO findash_user;

# Enable TimescaleDB
\c findash
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

# Exit psql
\q

# Test connection
psql -h localhost -U findash_user -d findash
```
- [ ] Database findash created
- [ ] User findash_user created
- [ ] TimescaleDB extension enabled
- [ ] Connection test successful: `psql -h localhost -U findash_user -d findash`

---

## Phase 2: Application Deployment (5 horas)

### Project Setup
```bash
# Clone repository
cd /root
git clone https://github.com/YOUR_USER/findash.git FinDash
cd FinDash

# Create production environment file
cp .env.production.example .env.production
# EDIT .env.production with actual values
nano .env.production
```
- [ ] Repository cloned
- [ ] `.env.production` created with real values

### Docker Build & Test
```bash
# Build Docker image
docker-compose build --no-cache

# Start containers
docker-compose up -d

# Verify containers are running
docker-compose ps

# Check application health
curl http://localhost:3000/api/health

# View logs
docker-compose logs -f app
```
- [ ] Docker image built successfully
- [ ] Containers started: `docker-compose ps`
- [ ] App health check passes
- [ ] No critical errors in logs

### Nginx Configuration
```bash
# Test Nginx config
nginx -t

# Copy config to Nginx
sudo cp nginx/conf.d/findash.conf /etc/nginx/sites-available/findash
sudo ln -s /etc/nginx/sites-available/findash /etc/nginx/sites-enabled/

# Enable site
sudo systemctl reload nginx
```
- [ ] Nginx config is valid
- [ ] Site enabled in Nginx
- [ ] Nginx reloaded successfully

### SSL Certificate (Let's Encrypt)
```bash
# Generate SSL certificate
certbot certonly --nginx -d your-domain.com

# Update Nginx config with cert paths
# Edit /etc/nginx/sites-available/findash:
#   ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
#   ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

# Reload Nginx
sudo systemctl reload nginx

# Test HTTPS
curl https://your-domain.com
```
- [ ] SSL certificate generated
- [ ] Nginx config updated
- [ ] HTTPS working
- [ ] HTTP redirects to HTTPS

---

## Phase 3: CI/CD Pipeline (4 horas)

### GitHub Actions Setup
```bash
# Create .github/workflows/deploy.yml (already created)
# Add secrets to GitHub repository:
# - DEPLOY_SSH_KEY (private key content)
# - DEPLOY_HOST (145.223.94.196)
# - DEPLOY_USER (root or deploy)
```
- [ ] Workflow file created: `.github/workflows/deploy.yml`
- [ ] GitHub secrets configured
- [ ] Test push to main triggers workflow

### Auto-Deployment Verification
```bash
# Push to main to trigger deployment
git add .
git commit -m "feat: semana 10 production deployment setup"
git push origin main

# Monitor GitHub Actions
# Open: https://github.com/YOUR_USER/findash/actions

# Verify deployment
curl https://your-domain.com
```
- [ ] GitHub Actions workflow triggers on push
- [ ] Tests pass in CI/CD
- [ ] Docker image builds successfully
- [ ] Deployment script executes
- [ ] Application is accessible at domain

---

## Phase 4: Monitoring & Finalization (1 hora)

### Health Checks
```bash
# Application health
curl https://your-domain.com/api/health

# Database connectivity
docker-compose exec postgres pg_isready -U findash_user

# Redis connectivity
docker-compose exec redis redis-cli ping

# Nginx status
systemctl status nginx

# View logs
docker-compose logs --tail=50 app
```
- [ ] Application responding
- [ ] Database connected
- [ ] Redis connected
- [ ] Nginx healthy
- [ ] No error logs

### Monitoring Setup
```bash
# Setup log rotation
sudo tee /etc/logrotate.d/findash > /dev/null << EOF
/root/FinDash/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 nobody nobody
    sharedscripts
}
EOF

# Setup automated backups
0 2 * * * /root/FinDash/scripts/backup.sh
```
- [ ] Log rotation configured
- [ ] Backup script created
- [ ] Backup scheduled in cron
- [ ] Monitoring alerts configured

### Documentation & Handoff
```bash
# Create deployment documentation
# Create runbook with:
# - How to restart services
# - How to check logs
# - How to perform backups
# - How to rollback
```
- [ ] Deployment documentation created
- [ ] Runbook prepared
- [ ] Team notified
- [ ] Monitoring dashboard shared

---

## Post-Deployment Verification

### Week 1 Monitoring
- [ ] Monitor error logs for issues
- [ ] Check performance metrics
- [ ] Verify backups are running
- [ ] Monitor uptime/availability
- [ ] Review user feedback

### Performance Optimization (if needed)
- [ ] Run Lighthouse audit
- [ ] Check Core Web Vitals
- [ ] Optimize slow endpoints
- [ ] Add caching where needed

### Security Hardening
- [ ] Update SSL certificate configuration
- [ ] Enable HSTS header
- [ ] Configure rate limiting
- [ ] Review security logs
- [ ] Run security scan

---

## Troubleshooting Guide

### If Deployment Fails

**Container won't start:**
```bash
# Check logs
docker-compose logs app

# Common issues:
# - .env.production missing/invalid
# - Database not initialized
# - Port already in use
```

**Database connection error:**
```bash
# Test PostgreSQL
docker-compose exec postgres psql -U findash_user -d findash

# Check DATABASE_URL in .env.production
```

**Nginx 502 Bad Gateway:**
```bash
# Check if app container is running
docker-compose ps

# Check app logs
docker-compose logs app

# Test app directly
curl http://localhost:3000
```

**SSL certificate issues:**
```bash
# Check certificate expiry
certbot certificates

# Renew if needed
certbot renew --dry-run
```

---

## Success Criteria

✅ All items checked
✅ Application accessible at domain
✅ HTTPS working
✅ Database initialized
✅ Auto-deployment on push working
✅ Monitoring alerts configured
✅ Backups scheduled
✅ Documentation complete
✅ Team trained

---

## Rollback Procedure

If something goes wrong:

```bash
# SSH to VPS
ssh root@145.223.94.196
cd /root/FinDash

# Checkout previous tag
git fetch origin
git checkout v1.0.0-semana9  # or latest stable tag

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Verify
curl https://your-domain.com/api/health
```

---

**Deployment Target:** 145.223.94.196:/root/FinDash
**Timeline:** 7 dias
**Status:** Ready to proceed
