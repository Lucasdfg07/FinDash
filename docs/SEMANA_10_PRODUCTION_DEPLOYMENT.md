# 🚀 Semana 10: Production Deployment & CI/CD Automation

**Status:** Planning | **Date:** 2026-02-20 | **Target:** Live Production + Auto-Deploy

---

## Executive Summary

Findash goes to production with:

1. **VPS Deployment** - Manual SSH deploy on 145.223.94.196:/root/FinDash
2. **CI/CD Pipeline** - GitHub Actions auto-deploy on push to master
3. **Production Database** - PostgreSQL + TimescaleDB
4. **Monitoring** - Error tracking, uptime monitoring, performance metrics
5. **Backups** - Daily automated backups with point-in-time recovery

**Infrastructure:**
```
GitHub Repo (main branch)
    ↓
GitHub Actions CI/CD Pipeline
    ↓
    ├─ Lint & Test
    ├─ Build Docker image
    └─ Deploy to VPS
    ↓
VPS (145.223.94.196)
    ├─ Docker container (Next.js)
    ├─ PostgreSQL 15 + TimescaleDB
    ├─ Redis (cache)
    └─ Nginx (reverse proxy)
```

---

## 1. VPS Environment Setup

### Server Specifications
- **OS:** Linux (Ubuntu 22.04 LTS)
- **IP:** 145.223.94.196
- **SSH User:** root
- **Project Path:** /root/FinDash

### Initial Setup Tasks

#### Task 1.1: SSH Access & Security
**Commands:**
```bash
# Enable UFW firewall
ufw enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Add public key to authorized_keys
mkdir -p ~/.ssh
echo "YOUR_SSH_KEY" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Disable password login
nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
# Set: PubkeyAuthentication yes

systemctl restart ssh
```

**Duration:** 30 minutes

---

#### Task 1.2: System Packages & Runtime
**Install:**
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs npm

# Install Docker
apt install -y docker.io docker-compose

# Install PostgreSQL 15
apt install -y postgresql postgresql-contrib

# Install Redis
apt install -y redis-server

# Install Nginx
apt install -y nginx

# Install Certbot (SSL)
apt install -y certbot python3-certbot-nginx

# Install monitoring tools
apt install -y htop iotop netdata
```

**Duration:** 1 hour

---

#### Task 1.3: Nginx Reverse Proxy Config
**File:** `/etc/nginx/sites-available/findash`

```nginx
upstream findash_backend {
    server localhost:3000;
}

server {
    listen 80;
    server_name findash.com www.findash.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name findash.com www.findash.com;

    # SSL certificates (let's encrypt)
    ssl_certificate /etc/letsencrypt/live/findash.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/findash.com/privkey.pem;

    # SSL best practices
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/javascript application/json;
    gzip_min_length 1000;

    location / {
        proxy_pass http://findash_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Duration:** 30 minutes

---

### Success Metrics
- ✓ SSH access without password
- ✓ All services running (Node, Docker, PostgreSQL, Redis, Nginx)
- ✓ Nginx reverse proxy working
- ✓ Firewall rules in place

---

## 2. Database in Production

### PostgreSQL Setup

#### Task 2.1: PostgreSQL Configuration
```bash
# Create database user
sudo -u postgres createuser findash_user --password

# Create database
sudo -u postgres createdb -O findash_user findash_prod

# Enable extensions
sudo -u postgres psql findash_prod -c "CREATE EXTENSION timescaledb;"

# Backup configuration
pg_dump findash_prod > /backups/findash_initial.sql
```

**Duration:** 30 minutes

---

#### Task 2.2: Production .env Configuration
**File:** `/root/FinDash/.env.production`

```env
# Database
DATABASE_URL="postgresql://findash_user:PASSWORD@localhost:5432/findash_prod"

# Redis
REDIS_URL="redis://localhost:6379"

# NextAuth
NEXTAUTH_URL="https://findash.com"
NEXTAUTH_SECRET="generate-secure-random-string"

# Bank API (Inter)
INTER_API_KEY="..."
INTER_API_SECRET="..."

# Other configs...
NODE_ENV=production
```

**Duration:** 15 minutes

---

#### Task 2.3: Migrations & Seed
```bash
cd /root/FinDash

# Run Prisma migrations
npx prisma migrate deploy

# Seed production data (if needed)
npx prisma db seed
```

**Duration:** 15 minutes

---

### Success Metrics
- ✓ Database accessible from Node app
- ✓ TimescaleDB extension enabled
- ✓ Migrations applied successfully
- ✓ Connection pooling configured

---

## 3. Docker Deployment

### Dockerfile

**File:** `/root/FinDash/Dockerfile`

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build Next.js
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built app from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 3000

CMD ["npm", "start"]
```

**Duration:** 30 minutes

---

### Docker Compose

**File:** `/root/FinDash/docker-compose.yml`

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://findash_user:${DB_PASSWORD}@postgres:5432/findash_prod
      - REDIS_URL=redis://redis:6379
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    networks:
      - findash-network

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=findash_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=findash_prod
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped
    networks:
      - findash-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped
    networks:
      - findash-network

volumes:
  postgres-data:
  redis-data:

networks:
  findash-network:
    driver: bridge
```

**Duration:** 30 minutes

---

### Success Metrics
- ✓ Docker image builds successfully
- ✓ Container starts and health check passes
- ✓ All services (app, db, cache) communicate
- ✓ Logs viewable via `docker logs`

---

## 4. CI/CD Pipeline with GitHub Actions

### Workflow File

**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  workflow_dispatch:  # Manual trigger

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run tests
        run: npm test -- --run

      - name: Build application
        run: npm run build

      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: root
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          port: 22
          script: |
            cd /root/FinDash
            git pull origin main
            npm ci
            npm run build
            docker-compose down
            docker-compose up -d --build
            docker-compose exec -T app npx prisma migrate deploy
            echo "✅ Deployment completed"

      - name: Health check
        run: |
          sleep 10
          curl -f https://findash.com/api/health || exit 1

      - name: Notify Slack (success)
        if: success()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "✅ FinDash deployment successful"
            }

      - name: Notify Slack (failure)
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "❌ FinDash deployment failed"
            }
```

**Duration:** 1 hour

---

### GitHub Secrets Setup

Required secrets in GitHub repository settings:

```
DEPLOY_HOST = 145.223.94.196
DEPLOY_SSH_KEY = (private key content)
SLACK_WEBHOOK = (optional: Slack webhook for notifications)
```

**Duration:** 15 minutes

---

### Success Metrics
- ✓ Pipeline runs on push to main
- ✓ All checks pass (lint, test, build)
- ✓ Docker deployment succeeds
- ✓ Health check passes
- ✓ Notifications sent

---

## 5. Monitoring & Alerting

### Task 5.1: Uptime Monitoring

**Services:**
- [Uptime Robot](https://uptimerobot.com/) - Monitor /api/health endpoint
- Check every 5 minutes
- Alert on downtime > 5 minutes

**Duration:** 15 minutes

---

### Task 5.2: Error Tracking

**Setup Sentry:**

```bash
npm install @sentry/nextjs
```

**Config:** `sentry.config.js`

```javascript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

**Duration:** 1 hour

---

### Task 5.3: Performance Monitoring

**Setup:**
- Google Analytics 4
- Sentry Performance monitoring
- Custom analytics dashboard in /admin/analytics

**Duration:** 1.5 hours

---

### Task 5.4: Logging

**Log aggregation with Loki/Grafana:**

```bash
# Via Docker Compose
# Install loki container
# Setup grafana dashboard
```

**Duration:** 2 hours

---

### Success Metrics
- ✓ Uptime monitoring active
- ✓ Error tracking via Sentry
- ✓ Performance metrics visible
- ✓ Alerts configured

---

## 6. Backup Strategy

### Automated Backups

```bash
# Daily backup script: /root/FinDash/scripts/backup.sh

#!/bin/bash

BACKUP_DIR="/backups/findash"
DATE=$(date +%Y%m%d_%H%M%S)

# PostgreSQL backup
pg_dump findash_prod | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Application files backup
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /root/FinDash

# Upload to S3 (or external storage)
aws s3 cp $BACKUP_DIR/db_$DATE.sql.gz s3://findash-backups/

# Keep only last 30 days
find $BACKUP_DIR -mtime +30 -delete
```

**Cron job:** `0 2 * * * /root/FinDash/scripts/backup.sh`

**Duration:** 1 hour

---

### Success Metrics
- ✓ Daily backups created
- ✓ Backups stored externally
- ✓ Restoration tested
- ✓ Recovery time < 1 hour

---

## 7. SSL/TLS Certificates

### Let's Encrypt Setup

```bash
# Initial certificate
certbot certonly --nginx -d findash.com -d www.findash.com

# Auto-renewal via cron
certbot renew --quiet

# Cron job: 0 0 * * * certbot renew --quiet
```

**Duration:** 30 minutes

---

## 8. Implementation Timeline

```
Monday:
├─ Task 1.1-1.3: VPS Setup (2h)
├─ Task 2.1-2.3: Database Setup (1h)
└─ Testing (1h)

Tuesday:
├─ Task 3: Docker Setup (1.5h)
├─ Task 4: CI/CD Pipeline (1.5h)
└─ Testing & GitHub Secrets (1h)

Wednesday:
├─ Task 5.1-5.4: Monitoring (5h)
├─ Task 6: Backups (1h)
├─ Task 7: SSL Certificates (0.5h)
└─ Final integration testing (2h)

TOTAL: 16 hours (Plus on-call support)
```

---

## 9. Pre-Production Checklist

- [ ] SSH access tested
- [ ] All system packages installed
- [ ] Nginx reverse proxy working
- [ ] PostgreSQL + TimescaleDB running
- [ ] Redis running
- [ ] Docker builds successfully
- [ ] Environment variables configured
- [ ] Database migrations pass
- [ ] CI/CD pipeline configured
- [ ] All GitHub secrets added
- [ ] Health check endpoint responding
- [ ] HTTPS/SSL certificate working
- [ ] Uptime monitoring active
- [ ] Sentry error tracking active
- [ ] Backup strategy tested
- [ ] Load tested with 100+ concurrent users

---

## 10. Success Criteria

✅ **Deployment**
- Application live at findash.com
- All APIs responsive
- Database persists data
- HTTPS working

✅ **Automation**
- Auto-deploy on push to main
- CI/CD pipeline passes all checks
- Deployments complete in < 5 minutes

✅ **Monitoring**
- Uptime monitoring active
- Error tracking functional
- Performance metrics visible
- Alerts configured

✅ **Reliability**
- 99.9% uptime target
- Automated daily backups
- Disaster recovery plan tested
- Load tested to 1000 concurrent users

---

## Post-Launch Support

- **Week 1:** On-call monitoring (24/7)
- **Week 2-4:** Daily health checks + optimization
- **Week 4+:** Scheduled maintenance windows

---

## Next Steps

1. → @devops implements tasks 1-10
2. → Launch to production
3. → Monitor and optimize
4. → Celebrate! 🎉

---

*Semana 10: Production-ready infrastructure with CI/CD automation*
