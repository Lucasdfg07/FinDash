# 🔄 CI/CD Pipeline - Findash

## Visão Geral

Pipeline de integração contínua automatiza:
1. **Code Quality** - Lint, Type Check, Unit Tests, Coverage
2. **Build** - Next.js build verification
3. **E2E Tests** - Playwright automation tests
4. **Security** - Audit, Secret scanning
5. **Auto Merge** - Merge PRs automaticamente quando tudo passar
6. **Deploy** - Deploy automático para Railway em main

## Workflows Implementados

### 1️⃣ **CI Pipeline** (`.github/workflows/ci.yml`)

Roda em: `push` e `pull_request` para main/develop

#### Jobs Paralelos:

##### 📋 **Quality Job**
```
✅ Lint (ESLint)
✅ Type Check (TypeScript)
✅ Unit Tests (Vitest)
✅ Coverage Report (V8)
✅ Upload to Codecov
```

**Duração:** ~2-3 minutos
**Artifacts:** Coverage reports

---

##### 🏗️ **Build Job**
```
✅ Instalar dependências
✅ npm run build
✅ Upload .next/ artifacts
```

**Duração:** ~1-2 minutos
**Requires:** Quality job passou

---

##### 🎭 **E2E Job**
```
✅ Instalar Playwright
✅ Start dev server
✅ npm run test:e2e
✅ Upload Playwright reports
```

**Duração:** ~3-5 minutos
**Requires:** Build job passou

---

##### 🔒 **Security Job**
```
✅ npm audit (moderate+ vulnerabilities)
✅ Secret scanning (INTER_CERT_PEM, INTER_KEY_PEM)
```

**Duração:** ~1 minuto
**Parallel:** Roda independentemente

---

##### 📝 **PR Summary Job**
```
✅ Comenta no PR com status de todos os checks
✅ Links para logs completos
```

**Quando:** Apenas em pull requests

---

### 2️⃣ **Auto Merge** (`.github/workflows/auto-merge.yml`)

Quando todos os checks passam:
- Se PR tem label `ready-to-merge`
- Faz squash merge automaticamente
- Usa GitHub Actions bot como author

---

### 3️⃣ **Deploy** (`.github/workflows/deploy.yml`)

Quando:
- Push para main
- CI Pipeline completa com sucesso

Actions:
1. Deploy para Railway via RAILWAY_TOKEN
2. Verifica deployment
3. Notifica Slack (se configurado)

---

## Configuração Necessária

### Secrets do GitHub (`.github/settings/secrets/actions`)

```
RAILWAY_TOKEN          # Railway deployment token
SLACK_WEBHOOK_URL      # (Optional) Slack notifications
CODECOV_TOKEN          # (Optional) Codecov integration
```

### Branch Protection Rules

Para `main`:

```
✅ Require status checks to pass:
   - quality (CI Pipeline)
   - build (CI Pipeline)
   - e2e (CI Pipeline)
   - security (CI Pipeline)

✅ Require branches to be up to date before merging
✅ Require code reviews (1 approval)
✅ Require status checks to pass before merging
✅ Require conversation resolution before merging
```

---

## Como Funciona na Prática

### Cenário 1: Develop faz Push

```
dev:main@localhost$ git push origin feature-x

         ↓

GitHub Actions Triggered:
  ├─ [quality] → Lint, Type, Tests, Coverage
  ├─ [security] → Audit, Secret scan
  └─ [quality passed?] → YES
                  ├─ [build] → npm run build
                  └─ [build passed?] → YES
                         └─ [e2e] → Playwright tests

Result:
  ✅ All checks passed → PR mergeable
  ❌ Any check failed → PR blocked
```

---

### Cenário 2: PR com "ready-to-merge" Label

```
dev creates PR with label "ready-to-merge"

         ↓

All checks pass:
  ├─ Lint ✅
  ├─ Type Check ✅
  ├─ Tests ✅
  ├─ Coverage ✅
  ├─ Build ✅
  └─ E2E ✅

         ↓

Auto Merge Triggered:
  → Squash merge to main
  → Close PR
  → Delete branch
```

---

### Cenário 3: Merge para Main (Deploy)

```
PR merged to main

         ↓

Deploy Workflow Triggered:
  ├─ Wait for CI Pipeline success
  ├─ Deploy to Railway
  ├─ Verify deployment
  └─ Notify Slack

         ↓

Result:
  ✅ Production deployment complete
  📱 Slack notification sent
  🌐 App available at https://findash-production.up.railway.app
```

---

## Rodar CI Localmente

```bash
# Rodar todo o pipeline CI local
npm run ci

# Ou individualmente:
npm run lint              # ESLint
npm test                  # Vitest
npm run test:coverage    # Coverage report
npm run build            # Next.js build
npm run test:e2e         # Playwright tests
```

---

## Troubleshooting

### ❌ Lint Falha

```bash
# Ver erros
npm run lint

# Tentar auto-fix
npm run lint -- --fix
```

### ❌ Type Check Falha

```bash
# Ver erros TypeScript
npx tsc --noEmit
```

### ❌ Tests Falham

```bash
# Rodar tests com debug
npm test -- --reporter=verbose
npm test -- src/lib/schemas.test.ts # um arquivo
```

### ❌ Build Falha

```bash
# Debug build
npm run build -- --debug
```

### ❌ E2E Tests Falham

```bash
# Rodar com UI
npm run test:e2e:ui

# Debug interativo
npm run test:e2e:debug

# Um arquivo específico
npx playwright test e2e/auth.spec.ts
```

---

## Status Checks Requeridos

| Check | Tipo | Timeout | Fail? |
|-------|------|---------|-------|
| Lint | Script | 5min | ❌ Bloqueia merge |
| Type Check | Script | 5min | ❌ Bloqueia merge |
| Unit Tests | Script | 5min | ❌ Bloqueia merge |
| Build | Script | 10min | ❌ Bloqueia merge |
| E2E Tests | Script | 15min | ⚠️ Aviso (permite merge) |
| Security | Script | 5min | ⚠️ Aviso (permite merge) |

---

## Performance Targets

| Job | Target | Atual |
|-----|--------|-------|
| Quality | < 3min | ~2-3min |
| Build | < 2min | ~1-2min |
| E2E | < 5min | ~3-5min |
| Total | < 10min | ~6-10min |

---

## GitHub Actions Costs

**Findash (privado):** 2,000 minutos/mês free

Com 3 runs/dia × 10min = ~30min/dia:
- 30min × 30 dias = 900min/mês ✅ Dentro do limite

---

## Próximos Passos

- [ ] Configurar Railway deployment token
- [ ] Configurar branch protection rules
- [ ] (Optional) Configurar Slack notifications
- [ ] (Optional) Integrar Codecov para coverage tracking
- [ ] Monitor CI runs em GitHub Actions dashboard

---

## URLs Úteis

- GitHub Actions: `https://github.com/USER/findash/actions`
- Workflow Runs: `https://github.com/USER/findash/actions/workflows/ci.yml`
- Railway Dashboard: `https://railway.app/dashboard`
- Codecov: `https://app.codecov.io`
