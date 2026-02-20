# E2E Tests com Playwright

Testes end-to-end para validar fluxos completos de usuário em Findash.

## Setup

```bash
# Instalar dependências (já instalado)
npm install -D @playwright/test

# Instalar navegadores
npx playwright install
```

## Executar Testes

```bash
# Rodar todos os testes
npm run test:e2e

# UI interativa (recomendado para desenvolvimento)
npm run test:e2e:ui

# Debug mode (pausa antes de cada ação)
npm run test:e2e:debug

# Rodar testes específicos
npx playwright test auth.spec.ts

# Rodar em um navegador específico
npx playwright test --project=chromium
```

## Estrutura

```
e2e/
├── pages/              # Page Object Models
│   ├── LoginPage.ts
│   ├── SyncPage.ts
│   └── CategoriesPage.ts
├── fixtures.ts         # Setup de testes + mocks
├── auth.spec.ts        # Testes de autenticação
├── sync.spec.ts        # Testes de sincronização
├── categories.spec.ts  # Testes de categorias
├── rate-limit.spec.ts  # Testes de rate limiting
└── README.md
```

## Page Object Model

Cada página tem sua classe de Page Object:
- `LoginPage` - Login, logout, validação de sessão
- `SyncPage` - Sincronização com Inter, deduplicação
- `CategoriesPage` - CRUD de categorias

## Mocks

Os testes usam `fixtures.ts` para mockar a API do Inter:
- `/api/inter/sync` - Retorna sucesso com dados fictícios
- `/api/inter/status` - Retorna status conectado
- `/api/inter/dedup` - Retorna 3 duplicatas removidas

## Configuração

`playwright.config.ts`:
- Base URL: `http://localhost:3000`
- Browsers: Chromium, Firefox, WebKit
- Auto-start dev server: `npm run dev`
- Screenshot on failure
- HTML reports

## Dados de Teste

Os testes usam credenciais:
- Email: `test@example.com`
- Senha: `password123`

**Nota:** Você precisa criar um usuário de teste no banco antes de rodar os testes, ou ajustar as credenciais.

## CI/CD

Para rodar em CI:
```bash
npm run test:e2e
```

Os testes reutilizam servidor existente em desenvolvimento, mas em CI usam novo servidor.
