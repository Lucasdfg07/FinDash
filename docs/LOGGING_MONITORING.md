# 📊 Logging & Monitoring - Findash

## Objetivo

Implementar logging estruturado e monitoramento de saúde da aplicação com:
- Logs JSON em produção
- Pretty-printed logs em desenvolvimento
- Rastreamento de performance
- Health check endpoint
- Suporte a múltiplos módulos

---

## 🔍 Arquitetura de Logging

### Níveis de Log

| Nível | Código | Uso | Exemplo |
|-------|--------|-----|---------|
| **fatal** | 60 | Erro fatal, aplicação vai crashear | Database connection lost |
| **error** | 50 | Erro não fatal | API request failed |
| **warn** | 40 | Aviso, algo anormal | Slow query (>1000ms) |
| **info** | 30 | Informações úteis | User login, API response |
| **debug** | 20 | Informações de debug | Cache hit/miss, query details |
| **trace** | 10 | Muito detalhado | Function entry/exit |

### Configuração por Ambiente

#### Desenvolvimento
```
Environment: development
Level: debug
Format: Pretty-printed (colorizado)
Output: stdout
```

#### Produção
```
Environment: production
Level: info
Format: JSON (estruturado)
Output: stdout (para ser capturado por log aggregators)
Serializers: req, res (informações HTTP sanitizadas)
```

---

## 📝 Logger Instances

### Loggers Disponíveis

```typescript
import {
  loggerAPI,           // API requests/responses
  loggerAuth,          // Autenticação
  loggerDB,            // Queries do banco
  loggerCache,         // Cache hits/misses
  loggerPerformance,   // Métricas de performance
  loggerSecurity,      // Eventos de segurança
  loggerError,         // Erros e exceções
} from '@/lib/logger';
```

### Usando Loggers

```typescript
// Info
loggerAPI.info({ method: 'GET', path: '/dashboard' }, 'API request received');

// Warn com context
loggerDB.warn({ query, duration_ms: 1500 }, 'Slow query detected');

// Error com stack trace
loggerError.error({ error: err.stack }, 'Database error');

// Debug estruturado
loggerCache.debug({ event: 'hit', key: 'user:123' }, 'Cache hit');
```

---

## ⚡ Structured Logging Functions

### API Requests

```typescript
logAPIRequest(method: string, path: string, userId?: string)
```

**Exemplo:**
```typescript
logAPIRequest('GET', '/api/transactions', 'user-123');
// Output: { method: 'GET', path: '/api/transactions', userId: 'user-123' }
```

### API Responses

```typescript
logAPIResponse(method: string, path: string, status: number, duration: number)
```

**Exemplo:**
```typescript
logAPIResponse('POST', '/api/transactions', 201, 45);
// Nível: info (2xx), warn (4xx), error (5xx)
```

### Authentication Events

```typescript
logAuthEvent(event: 'login' | 'logout' | 'failed', userId: string, reason?: string)
```

**Exemplo:**
```typescript
logAuthEvent('login', 'user-123');
logAuthEvent('failed', 'user-456', 'Invalid credentials');
```

### Database Queries

```typescript
logDBQuery(query: string, duration: number, rows?: number)
```

**Exemplo:**
```typescript
logDBQuery('SELECT * FROM transactions', 45, 1250);
// Nível: debug (< 1000ms), warn (>= 1000ms)
```

### Cache Events

```typescript
logCacheEvent(event: 'hit' | 'miss', key: string, ttl?: number)
```

**Exemplo:**
```typescript
logCacheEvent('hit', 'dashboard:user-123', 300);
```

### Performance Metrics

```typescript
logPerformanceMetric(metric: string, value: number, unit?: string)
```

**Exemplo:**
```typescript
logPerformanceMetric('API Response Time', 145, 'ms');
logPerformanceMetric('Memory Usage', 256.5, 'MB');
```

### Security Events

```typescript
logSecurityEvent(event: 'auth_failed' | 'rate_limit' | 'invalid_input' | 'cors_rejected', details: Record<string, any>)
```

**Exemplo:**
```typescript
logSecurityEvent('rate_limit', { endpoint: '/api/sync', ip: '192.168.1.1' });
logSecurityEvent('invalid_input', { field: 'email', reason: 'Invalid format' });
```

### Error Logging

```typescript
logError(error: Error, context?: Record<string, any>)
logFatalError(error: Error, context?: Record<string, any>)
```

**Exemplo:**
```typescript
try {
  await riskyOperation();
} catch (error) {
  logError(error as Error, { operation: 'sync', userId: 'user-123' });
}
```

---

## 📈 Performance Tracking

### Medir Operações Assíncronas

```typescript
async function processSync() {
  const result = await measureAsync('Inter API Sync', async () => {
    return await interAPIClient.sync(startDate, endDate);
  });
  return result;
}

// Output: { metric: 'Inter API Sync', value: 1250, unit: 'ms' }
```

### Medir Operações Síncronas

```typescript
function calculateTotals() {
  return measureSync('Calculate Totals', () => {
    // Operação síncrona
    return transactions.reduce((sum, tx) => sum + tx.amount, 0);
  });
}

// Output: { metric: 'Calculate Totals', value: 5, unit: 'ms' }
```

---

## 🏥 Health Check Endpoint

### GET /api/health

**Resposta (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-20T10:30:45.123Z",
  "uptime": 3600,
  "checks": {
    "database": "ok",
    "cache": "ok",
    "memory": "ok"
  }
}
```

**Resposta (503 Service Unavailable):**
```json
{
  "status": "unhealthy",
  "timestamp": "2026-02-20T10:30:45.123Z",
  "uptime": 3600,
  "checks": {
    "database": "error",
    "cache": "ok",
    "memory": "warning"
  }
}
```

### Status Determination

- **healthy**: Database OK + Memory OK (<75%)
- **degraded**: Database OK + Memory WARNING (75-90%)
- **unhealthy**: Database ERROR ou Memory ERROR (>90%)

### Health Check Limiares

| Aspecto | Limite |
|---------|--------|
| **Memory** | < 75% = OK, 75-90% = WARNING, > 90% = ERROR |
| **Database** | Connection check OK = OK, fails = ERROR |
| **Cache** | Redis available = OK, not configured = OK, fails = ERROR |

---

## 📡 Integração com Log Aggregators

### Railway (Produção)

Railway captura automaticamente stdout:
```bash
# Logs são enviados para Railway Dashboard
# Format: JSON em produção
```

### Local Development

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: View logs em tempo real (pretty-printed)
npm run dev

# Format: Colorizado com timestamps e níveis
```

### Docker / Kubernetes

Se usar Docker, configure volumes para logs:
```dockerfile
ENTRYPOINT ["node", ".next/standalone/server.js"]
# stdout será capturado pelo container logging driver
```

---

## 🔧 Configuração

### Variáveis de Ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `NODE_ENV` | development | development \| production |
| `LOG_LEVEL` | debug (dev) \| info (prod) | Nível mínimo de log |
| `REDIS_URL` | undefined | URL do Redis (produção) |

### Exemplos

**Development com debug detalhado:**
```bash
NODE_ENV=development LOG_LEVEL=trace npm run dev
```

**Production com info apenas:**
```bash
NODE_ENV=production LOG_LEVEL=info npm start
```

---

## 💾 Health Status Interface

```typescript
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: 'ok' | 'error';
    cache?: 'ok' | 'error';
    memory: 'ok' | 'warning' | 'error';
  };
}
```

---

## 📚 Exemplos Reais

### Exemplo 1: Logging de Sync com Inter API

```typescript
// src/app/api/inter/sync/route.ts
import { logAPIRequest, logAPIResponse, logSecurityEvent, measureAsync } from '@/lib/logger';

export async function POST(req: Request) {
  logAPIRequest('POST', '/api/inter/sync', userId);

  try {
    const result = await measureAsync('Inter API Sync', async () => {
      return await interAPIClient.sync(startDate, endDate);
    });

    logAPIResponse('POST', '/api/inter/sync', 200, 1250);
    return NextResponse.json(result);
  } catch (error) {
    logSecurityEvent('auth_failed', { endpoint: '/api/inter/sync' });
    logAPIResponse('POST', '/api/inter/sync', 500, 0);
    throw error;
  }
}
```

### Exemplo 2: Health Check e Monitoramento

```typescript
// Usar endpoint em production para monitoramento
const response = await fetch('https://api.findash.com/api/health');
const health = await response.json();

if (health.status !== 'healthy') {
  // Alertar time ops
  sendAlert(`Findash health: ${health.status}`);
}
```

### Exemplo 3: Medir Performance de Operação Pesada

```typescript
const transactions = await measureAsync('Load Transactions', async () => {
  return await prisma.transaction.findMany({
    where: { date: { gte: startDate, lte: endDate } },
    include: { category: true },
    orderBy: { date: 'desc' }
  });
});

// Log: { metric: 'Load Transactions', value: 345, unit: 'ms' }
```

---

## 🚀 Melhores Práticas

### ✅ DO's

- Log a nível apropriado (info para eventos normais, warn para desvios)
- Incluir contexto relevante (userId, endpoint, operação)
- Usar structured logging (objetos em vez de strings concatenadas)
- Medir performance de operações críticas
- Verificar health endpoint regularmente

### ❌ DON'Ts

- Logar informações sensíveis (senhas, tokens, SSNs)
- Usar console.log em produção (usar logger)
- Logar a cada iteração de loop (causa spam)
- Ignorar logs de erro na produção
- Deixar logs de debug em código de produção

---

## 📊 Monitoramento Recomendado

### Métricas por Camada

| Camada | Métrica | Alerta |
|--------|---------|--------|
| **API** | Response time | > 1s |
| **API** | Error rate | > 1% |
| **Database** | Query time | > 500ms |
| **Database** | Connection pool | > 90% utilized |
| **Memory** | Heap usage | > 75% |
| **Cache** | Hit rate | < 50% |
| **Security** | Failed auth attempts | > 5/min |
| **Security** | Rate limit violations | > 10/min |

### Dashboard Sugerido (com Railway ou Datadog)

```
┌─────────────────────────────────────────┐
│ Findash Monitoring Dashboard            │
├─────────────────────────────────────────┤
│ Health: ✅ HEALTHY                       │
│ Uptime: 99.8% (7 dias)                  │
├─────────────────────────────────────────┤
│ Performance                              │
│  • API Response Time: 145ms avg          │
│  • DB Query Time: 45ms avg               │
│  • Cache Hit Rate: 87%                   │
├─────────────────────────────────────────┤
│ Errors (últimas 24h)                    │
│  • Total: 12 errors                      │
│  • Critical: 0                           │
│  • High: 2                               │
├─────────────────────────────────────────┤
│ Security (últimas 24h)                  │
│  • Failed Auth: 3                        │
│  • Rate Limits: 1                        │
│  • Invalid Input: 2                      │
└─────────────────────────────────────────┘
```

---

## 🔗 Recursos Relacionados

- [src/lib/logger.ts](../src/lib/logger.ts) - Implementação
- [src/app/api/health/route.ts](../src/app/api/health/route.ts) - Health endpoint
- [docs/SECURITY_TESTING.md](./SECURITY_TESTING.md) - Testes de segurança
- [docs/CI_CD_PIPELINE.md](./CI_CD_PIPELINE.md) - Pipeline CI/CD
