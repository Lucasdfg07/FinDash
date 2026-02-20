# 📊 Análise de Cobertura de Testes

**Data:** 2026-02-20
**Coverage Report:** `coverage/index.html`

## 📈 Resumo Geral

```
Statements:  64.17% (8/12 funções testadas)
Branches:    51.16% (caminhos de decisão)
Functions:   41.66% (funções com testes)
Lines:       63.63% (linhas executadas)
```

### Status por Módulo

| Módulo | Cobertura | Status | Prioridade |
|--------|-----------|--------|-----------|
| **schemas.ts** | ✅ 100% | Completo | — |
| **rate-limit.ts** | 🟡 67% | Parcial | 🟠 Média |
| **cors.ts** | 🟡 54% | Parcial | 🟠 Média |

---

## ✅ Modules com 100% Cobertura

### src/lib/schemas.ts
```
Statements: 100%
Branches:   100%
Functions:  100%
Lines:      100%
```

**Por quê funciona bem:**
- 20 testes cobrindo todos os cenários
- Validação de tipos, ranges, enums, strings
- Casos normais + casos de erro
- Dados válidos + inválidos testados

**Casos cobertos:**
- ✅ interSyncSchema (datas válidas/inválidas)
- ✅ transactionSchema (tipos, amounts, datas)
- ✅ categorySchema (cores, tipos, tamanhos)
- ✅ fixedCostSchema (amounts positivos, recorrências)
- ✅ dashboardQuerySchema (datas opcionais)

---

## 🟡 Modules com <100% Cobertura

### src/lib/rate-limit.ts
```
Statements: 66.66%
Branches:   52.63%
Functions:  33.33%
Lines:      66.66%
```

**Linhas não cobertas:** 51, 61, 92-119, 147-148

**Causa:** Testes não cobrem:
- 🔴 Memory store cleanup/expiration (linha 51)
- 🔴 Redis fallback logic (linha 61)
- 🔴 Error handling em store operations (92-119)
- 🔴 Função cleanupOldLimits (147-148)

**Como melhorar:**
```typescript
// Adicionar testes para:
it('deve expirar entries antigas no memory store', () => {
  // Mocking de time.advanceBy(3600000)
});

it('deve fazer fallback para Redis em caso de error', () => {
  // Mock Redis client failure
});

it('deve logar erros de store operations', () => {
  // Capture console.error
});

it('deve limpar limites antigos periodicamente', () => {
  // Mock cleanup function
});
```

### src/lib/cors.ts
```
Statements: 53.84%
Branches:   50%
Functions:  50%
Lines:      52%
```

**Linhas não cobertas:** 41, 51-93

**Causa:** Testes não cobrem:
- 🔴 Função `addCORSHeaders` completamente
- 🔴 Função `logCORSRejection` não testada
- 🔴 Caso de origem null em addCORSHeaders

**Como melhorar:**
```typescript
// Adicionar testes para:
it('deve adicionar headers CORS a resposta', () => {
  const response = new NextResponse('test');
  const result = addCORSHeaders(response, 'http://localhost:3000');

  expect(result.headers.get('Access-Control-Allow-Origin'))
    .toBe('http://localhost:3000');
});

it('deve logar rejeição de origem', () => {
  const spy = vi.spyOn(console, 'warn');
  logCORSRejection(request, 'http://malicious.com');

  expect(spy).toHaveBeenCalledWith(expect.stringContaining('CORS'));
});

it('deve não adicionar headers se origem não permitida', () => {
  const response = new NextResponse('test');
  const result = addCORSHeaders(response, 'http://malicious.com');

  expect(result.headers.get('Access-Control-Allow-Origin')).toBeNull();
});
```

---

## 🎯 Métricas por Tipo de Teste

### Unit Tests (Jest/Vitest)
- ✅ 33 testes passando
- ✅ Tempo: 36ms
- ✅ Coverage: 64.17% overall
- ✅ Validação de schemas: 100%

### E2E Tests (Playwright)
- ✅ 18 testes estruturados (não rodam em vitest)
- ✅ Rodam com: `npm run test:e2e`
- ✅ Coverage: Complementa unit tests
- ✅ Validação de fluxos: auth, sync, categories, rate-limit

### Cobertura Combinada (Unit + E2E)
- **Testes de Autenticação:** ✅ E2E (4 testes)
- **Testes de Rate Limiting:** ✅ Unit (5) + E2E (4)
- **Testes de Validação:** ✅ Unit (20 testes)
- **Testes de CORS:** ✅ Unit (8 testes)
- **Testes de Sincronização:** ✅ E2E (5 testes)
- **Testes de Categorias:** ✅ E2E (5 testes)

---

## 📋 Plano de Melhoria (Próximas Tasks)

### Curto Prazo (Week 2.4)
```
[ ] Adicionar 5+ testes a rate-limit.ts → 90%+ coverage
[ ] Adicionar 5+ testes a cors.ts → 90%+ coverage
[ ] Target: 85%+ overall coverage
```

### Médio Prazo (Week 3)
```
[ ] Testar modules de API (inter-sync.ts, inter-api.ts)
[ ] Testar componentes React (E2E ou snapshot tests)
[ ] Target: 80%+ coverage em tudo
```

### Longo Prazo
```
[ ] Cobertura de edge cases
[ ] Performance tests
[ ] Security-specific tests
[ ] Target: 90%+ coverage
```

---

## 🚀 Como Gerar Coverage

```bash
# Gerar coverage e abrir em HTML
npm run test:coverage

# Abrir relatório
# coverage/index.html (abrir no navegador)
```

---

## ✅ CI/CD Integration

Adicionar a package.json:
```json
{
  "scripts": {
    "test:coverage:check": "vitest --coverage --run && node scripts/check-coverage-threshold.js"
  }
}
```

### Coverage Thresholds Sugeridos
```javascript
// coverage.config.js
module.exports = {
  global: {
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80
  }
}
```

---

## 📊 Coverage Trend

| Data | Overall | Statements | Branches | Functions | Lines |
|------|---------|------------|----------|-----------|-------|
| 2026-02-20 | 64.17% | 64.17% | 51.16% | 41.66% | 63.63% |
| 2026-02-21 | ⬆️ 70% (meta) | ⬆️ 70% | ⬆️ 65% | ⬆️ 65% | ⬆️ 70% |
| 2026-02-22 | ⬆️ 85% (meta) | ⬆️ 85% | ⬆️ 80% | ⬆️ 80% | ⬆️ 85% |

---

## 🎯 Conclusão

**Atual:**
- ✅ Schemas totalmente cobertos (100%)
- 🟡 Rate limiting parcialmente coberto (67%)
- 🟡 CORS parcialmente coberto (54%)
- **Total: 64.17% - Aceitável para MVP**

**Próximo:**
- Aumentar cobertura de rate-limit.ts para 90%
- Aumentar cobertura de cors.ts para 90%
- Atingir 85%+ overall

**Bloqueadores:** Nenhum - coverage está em nível aceitável para prosseguir
