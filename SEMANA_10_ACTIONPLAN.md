# 🚀 Semana 10 - Production Deployment - Action Plan

## Objetivo Final
Deploy da aplicação FinDash em produção no VPS **145.223.94.196** com CI/CD automático via GitHub Actions.

---

## 📋 Checklist Pre-Deployment

### ✅ Code Quality
- [x] TypeScript build: 0 errors
- [x] Tests: 62 passed, 11 skipped
- [x] Linting: 0 errors (novo code)
- [x] Service Worker: Functional
- [x] Dark Mode: Integrated
- [x] Mobile Navigation: Responsive
- [x] Accessibility: WCAG 2.1 AA ready

### ✅ Documentation
- [x] Semana 9 completa: 75%
- [x] Architecture docs: `docs/SEMANA_9_UX_ENHANCEMENTS_PWA.md`
- [x] Deployment guide: `docs/SEMANA_10_PRODUCTION_DEPLOYMENT.md`
- [x] Status tracking: `SEMANA_9_STATUS.md`, `SEMANA_9_RESUMO.md`

### ⏳ Pre-Deploy Checklist
- [ ] Read deployment guide completely
- [ ] Verify VPS credentials: 145.223.94.196 + key
- [ ] Backup current production (if any)
- [ ] Create rollback plan
- [ ] Setup monitoring before deploy

---

## 📅 Semana 10 Timeline (16 horas estimadas)

### Dia 1-2: Infrastructure Setup (6 horas)

#### Phase 1.1: SSH & System Access (1 hora)
```bash
# Actions:
1. SSH into VPS: ssh root@145.223.94.196
2. Verify OS: cat /etc/os-release (should be Ubuntu/Debian)
3. Update system: apt update && apt upgrade -y
4. Setup firewall: ufw allow 22,80,443
5. Create deploy user: adduser deploy (optional but recommended)
6. Configure SSH keys: authorized_keys setup
```

#### Phase 1.2: System Packages (2 horas)
```bash
# Install Node.js 20 LTS
1. curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
2. apt install -y nodejs
3. npm install -g npm@latest

# Install Docker
1. apt install -y docker.io docker-compose
2. usermod -aG docker deploy (if using deploy user)

# Install PostgreSQL 15 (if needed)
1. apt install -y postgresql postgresql-contrib
2. postgres --version (verify)

# Install Redis (if needed)
1. apt install -y redis-server
2. redis-cli ping (verify)

# Install Nginx
1. apt install -y nginx
2. systemctl enable nginx
3. systemctl start nginx

# Install certbot for SSL
1. apt install -y certbot python3-certbot-nginx
```

#### Phase 1.3: Database Setup (2 horas)
```bash
# PostgreSQL Configuration
1. sudo -u postgres psql
2. CREATE DATABASE findash;
3. CREATE USER findash_user WITH PASSWORD 'strong_password';
4. ALTER ROLE findash_user SET client_encoding TO 'utf8';
5. ALTER ROLE findash_user SET default_transaction_isolation TO 'read committed';
6. GRANT ALL PRIVILEGES ON DATABASE findash TO findash_user;

# TimescaleDB (for time-series data)
1. apt install -y timescaledb-2-postgresql-15
2. psql -U postgres -d findash -c "CREATE EXTENSION timescaledb;"

# Test connection
1. psql -h localhost -U findash_user -d findash
```

---

### Dia 3-4: Application Deployment (5 horas)

#### Phase 2.1: Docker Setup (2 horas)
```bash
# Build Docker image
1. cd /root/FinDash (or deployment path)
2. Create Dockerfile (use template from SEMANA_10_PRODUCTION_DEPLOYMENT.md)
3. docker build -t findash:latest .
4. docker run -it findash:latest npm test (verify)

# Create docker-compose.yml
1. Configure services: app, postgres, redis, nginx
2. Set environment variables from .env.production
3. Configure volumes for persistent data
4. docker-compose up -d (test)
```

#### Phase 2.2: Nginx Configuration (1.5 horas)
```bash
# Reverse Proxy Setup
1. Create /etc/nginx/sites-available/findash
2. Configure upstream to localhost:3000
3. Enable SSL with certbot:
   certbot certonly --nginx -d yourdomain.com
4. Update nginx config with SSL certificate paths
5. nginx -t (test config)
6. systemctl reload nginx
```

#### Phase 2.3: Environment Configuration (1.5 horas)
```bash
# Create .env.production
DATABASE_URL=postgresql://findash_user:password@localhost:5432/findash
REDIS_URL=redis://localhost:6379
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=https://yourdomain.com
API_INTER_KEY=<from config>
NEXT_PUBLIC_API_URL=https://yourdomain.com

# Create .env.local (for local testing)
# Copy above but with localhost URLs

# Setup as systemd service (optional but recommended)
1. Create /etc/systemd/system/findash.service
2. Configure ExecStart, WorkingDirectory, Environment
3. systemctl daemon-reload
4. systemctl enable findash
5. systemctl start findash
```

---

### Dia 5-6: CI/CD Pipeline (4 horas)

#### Phase 3.1: GitHub Actions Workflow (2 horas)
```yaml
# Create .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to VPS
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_SSH_KEY }}
          DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}
        run: |
          # Install ssh-agent
          mkdir -p ~/.ssh
          echo "$DEPLOY_KEY" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa

          # Deploy via SSH
          ssh -i ~/.ssh/id_rsa root@$DEPLOY_HOST << 'EOF'
          cd /root/FinDash
          git pull origin main
          npm ci --production
          npm run build
          pm2 reload ecosystem.config.js
          EOF
```

#### Phase 3.2: GitHub Secrets Setup (0.5 horas)
```bash
# In GitHub Repository Settings → Secrets → New Secret:
1. DEPLOY_SSH_KEY: (private key content)
2. DEPLOY_HOST: 145.223.94.196
3. SLACK_WEBHOOK: (optional, for notifications)
```

#### Phase 3.3: Auto-Deploy Configuration (1.5 horas)
```bash
# Option A: PM2 (Recommended)
1. npm install -g pm2
2. Create ecosystem.config.js:
   - name: 'findash'
   - script: './node_modules/.bin/next start'
   - instances: 'max'
   - env: production
3. pm2 start ecosystem.config.js
4. pm2 save && pm2 startup

# Option B: Systemd Service
1. Create /etc/systemd/system/findash.service
2. Enable and start: systemctl enable findash && systemctl start findash
3. Check status: systemctl status findash

# Setup git post-receive hook for auto-deploy
1. Create /root/FinDash/.git/hooks/post-receive
2. Add deployment script
3. chmod +x post-receive
```

---

### Dia 7: Monitoring & Finalization (1 hora)

#### Phase 4.1: Health Checks
```bash
# Basic tests
1. curl https://yourdomain.com (should return 200)
2. Check all pages load correctly
3. Test authentication flow
4. Verify dark mode works
5. Test PWA (install prompt, offline support)
6. Check mobile navigation on device

# Performance checks
1. Run Lighthouse audit
2. Check Core Web Vitals
3. Monitor first page load time
```

#### Phase 4.2: Monitoring Setup
```bash
# Uptime monitoring (e.g., Uptime Robot)
1. Create monitor for https://yourdomain.com
2. Set alert email/webhook

# Error tracking (e.g., Sentry)
1. Setup Sentry project
2. Add DSN to .env.production
3. Configure alerts

# Log aggregation (optional)
1. Setup CloudWatch or similar
2. Monitor error logs
3. Track performance metrics

# Database backups
1. Setup automated backups (daily)
2. Test restore procedure
3. Store backups in S3/cloud storage
```

#### Phase 4.3: Documentation & Handoff
```bash
# Create runbooks
1. How to restart the application
2. How to check logs
3. How to rollback deployment
4. Database backup/restore procedures
5. SSL certificate renewal

# Team notifications
1. Notify team: Production is live
2. Share monitoring dashboards
3. Share runbooks and contacts
```

---

## 🔑 Key Credentials Needed

| Item | Source | Notes |
|------|--------|-------|
| VPS SSH Key | User | 145.223.94.196 |
| VPS Root Password | User | Backup access |
| Domain Name | User | For SSL certificate |
| GitHub Repo | User | For actions/automation |
| Database Password | Generate | Store securely |
| NEXTAUTH_SECRET | Generate | `openssl rand -base64 32` |

---

## ⚠️ Critical Points

1. **Always Test Locally First**
   - Test .env.production locally before deployment
   - Test docker image builds locally
   - Test GitHub Actions workflow locally

2. **Backup Everything**
   - Database backup before deployment
   - Git tag release: `git tag v1.0.0-semana10`
   - Keep rollback procedure ready

3. **SSL Certificate**
   - Do NOT forget SSL/TLS setup
   - Use Let's Encrypt (free with certbot)
   - Set auto-renewal with cron

4. **Environment Variables**
   - NEVER commit .env files to git
   - Use GitHub Secrets for sensitive data
   - Double-check DATABASE_URL, REDIS_URL, NEXTAUTH_SECRET

5. **Database Migrations**
   - Run `npm run db:migrate` if needed
   - Verify schema is correct in production
   - Have rollback script ready

---

## 📊 Success Criteria

- [x] Code quality verified (tests, lint, build)
- [ ] VPS is accessible via SSH
- [ ] Docker image builds successfully
- [ ] PostgreSQL database is running
- [ ] Application starts without errors
- [ ] Website loads at HTTPS://yourdomain.com
- [ ] All pages render correctly
- [ ] Dark mode works
- [ ] Mobile navigation responsive
- [ ] PWA installable
- [ ] GitHub Actions workflow succeeds
- [ ] Auto-deploy works on git push
- [ ] Monitoring is active
- [ ] Backups configured

---

## 🚨 If Things Go Wrong

### Deployment Failed
1. Check logs: `docker logs findash` or `pm2 logs`
2. Verify .env.production is correct
3. Check database connectivity
4. Review GitHub Actions logs
5. Rollback to previous git tag

### Database Connection Error
1. Verify PostgreSQL is running: `systemctl status postgresql`
2. Check DATABASE_URL in .env.production
3. Test connection: `psql -h localhost -U findash_user -d findash`
4. Check firewall: `ufw status`

### SSL Certificate Issues
1. Check certificate expiry: `certbot certificates`
2. Renew if needed: `certbot renew --dry-run`
3. Check Nginx config: `nginx -t`
4. Restart Nginx: `systemctl reload nginx`

### Performance Issues
1. Check CPU/Memory: `top` or `htop`
2. Check disk space: `df -h`
3. Scale Docker containers: `docker-compose up --scale app=2`
4. Enable caching: Redis configuration
5. Check database slow queries

---

## 📞 Support Contacts

- VPS Provider: [configured by user]
- Domain Registrar: [configured by user]
- GitHub Support: https://github.com/support
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Next.js Docs: https://nextjs.org/docs

---

**Semana 10 Target:** Full production deployment with auto-deploy on master push
**Estimated Total Time:** 16 hours
**Team:** Claude Haiku 4.5 + User oversight
**Status:** Ready to proceed

Generated: 2026-02-20
