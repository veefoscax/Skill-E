# Skill.md: Anti-Padrões vs. Padrões Recomendados (Exemplos Práticos)

## Índice
1. [Description Field](#description)
2. [Tamanho e Estrutura](#tamanho)
3. [Conteúdo e Remover Redundância](#conteúdo)
4. [Context Efficiency](#context-efficiency)
5. [Organização de Referências](#referências)
6. [Guardrails e Scope](#guardrails)
7. [Exemplos Completos Side-by-Side](#completos)

---

## Description Field

### Anti-Padrão 1: Description Vaga

❌ **Ruim:**
```yaml
description: "Skill para ajudar com testes"
```

**Problemas:**
- Muito genérico
- Sem triggers específicos
- Impossível descobrir quando usar
- Agente não consegue determinar relevância

✅ **Bom:**
```yaml
description: "Write and execute tests following project patterns. Use when user says 'add tests', 'write unit tests', 'fix failing test', 'improve coverage', or 'test this function'. Handles Jest unit tests, integration tests, and mocking patterns."
```

**Melhorias:**
- Linguagem em 3ª pessoa
- Triggers específicos (palavras reais)
- Exemplos de quando usar
- Tipos de teste mencionados

---

### Anti-Padrão 2: Description Longa Demais

❌ **Ruim:**
```yaml
description: |
  This is a comprehensive testing skill that helps developers write better tests.
  Testing is an important part of software development, and our codebase follows
  specific conventions that are important to maintain. Jest is the testing framework
  we use. There are different types of tests including unit tests, integration tests,
  and end-to-end tests. Unit tests are used to test individual functions. Integration
  tests test multiple components working together. E2E tests test the full flow.
  When writing tests, you should always use our conventions. The naming convention
  is important. You should use descriptive names. Mock external dependencies. Always
  clean up after tests. Our tests go in specific directories. The structure matters.
  You should be familiar with Jest syntax and best practices. For more info read...
```

**Problemas:**
- Gasta 500+ tokens só no description
- Informação repetitiva
- Detalhe demais para campo que só faz matching
- Agente está ouvindo "blah blah blah"

✅ **Bom:**
```yaml
description: "Write Jest tests following project conventions. Use when user says 'add tests', 'write test', 'fix failing test', or 'improve coverage'."
```

**Melhorias:**
- Conciso (<50 tokens)
- Informação de matching clara
- Detalhes vão no SKILL.md, não aqui

---

### Anti-Padrão 3: Description Sem Triggers

❌ **Ruim:**
```yaml
description: "Implement authentication and authorization flows"
```

**Problema:** Agente não sabe quando carregar. Usuário diz:
- "Help me add login"
- "Setup OAuth"
- "User authentication"

Nenhuma dessas frases aparece na description.

✅ **Bom:**
```yaml
description: "Implement OAuth, JWT, and session-based authentication. Use when user mentions 'login', 'auth', 'authentication', 'OAuth', 'JWT', 'session management', or 'permission'."
```

---

## Tamanho e Estrutura

### Anti-Padrão 1: SKILL.md Gigante

❌ **Ruim:**
```markdown
# My Comprehensive Skill

## Complete Guide to Everything

- Section 1: 150 linhas
- Section 2: 120 linhas
- Section 3: 200 linhas
- Section 4: 180 linhas
- Section 5: 160 linhas
- Appendix A: 100 linhas
- Appendix B: 90 linhas
- FAQ: 80 linhas

Total: 1080 linhas em um arquivo
```

**Problemas:**
- Agente carrega tudo de uma vez
- Desperdício de tokens
- Informação que nunca será usada ativa
- Difícil de navegar
- Sem progressive disclosure

✅ **Bom:**

**SKILL.md (280 linhas):**
```markdown
# My Skill

## Quick Start
[Resumo de 30 linhas]

## Common Tasks
[4-5 padrões principais com exemplos]

## Decision Tree
[Ajuda agente escolher próximo passo]

## References
- Detailed workflows: `references/workflows.md`
- Advanced patterns: `references/advanced.md`
- Troubleshooting: `references/troubleshooting.md`
- FAQ: `references/faq.md`
```

**Estrutura de arquivos:**
```
├── SKILL.md (280 linhas - quick reference)
└── references/
    ├── workflows.md (200 linhas)
    ├── advanced.md (150 linhas)
    ├── troubleshooting.md (100 linhas)
    └── faq.md (80 linhas)
```

**Melhorias:**
- SKILL.md é rápido de carregar
- Referências sob demanda
- Progressivamente mais detalhado
- Organização clara

---

### Anti-Padrão 2: Sem Table of Contents

❌ **Ruim:**
```markdown
# Database Guide

## Connection Pooling
[150 linhas]

## Query Optimization
[120 linhas]

## Indexes
[100 linhas]

## Transactions
[90 linhas]

## Scaling
[80 linhas]

# [Agente tem que ler tudo para achar o que precisa]
```

✅ **Bom:**
```markdown
# Database Guide

## Table of Contents
1. [Connection Pooling](#pooling)
2. [Query Optimization](#optimization)
3. [Indexes](#indexes)
4. [Transactions](#transactions)
5. [Scaling](#scaling)

## Connection Pooling
[150 linhas]

## Query Optimization
[120 linhas]

...
```

---

## Conteúdo e Remover Redundância

### Anti-Padrão 1: Ensinar Conceitos Básicos

❌ **Ruim:**
```markdown
# REST API Skill

## What is REST?
REST (Representational State Transfer) is an architectural style for designing networked applications.
It was introduced by Roy Fielding in his doctoral dissertation...

## HTTP Methods
GET is used to retrieve resources...
POST is used to create resources...
PUT is used to update resources...
DELETE is used to delete resources...

## Status Codes
200 means OK
201 means Created
404 means Not Found
500 means Internal Server Error
...
```

**Problema:** Agente já sabe disso.

✅ **Bom:**
```markdown
# REST API Skill

## Our API Conventions

### Versioning
- Path-based: `/api/v1/users` (preferred)
- Header-based: `X-API-Version: 1` (deprecated)

### Error Responses
Always use our error format:
```json
{
  "error": "resource_not_found",
  "message": "User with ID 123 not found",
  "status": 404
}
```

### Rate Limiting
- Limit: 1000 requests/hour
- Headers: `X-RateLimit-Remaining`, `X-RateLimit-Reset`
```

**Melhorias:**
- Específico do projeto
- Não ensina o óbvio
- Economiza tokens
- Agente pula conceitos conhecidos

---

### Anti-Padrão 2: Duplicar Entre SKILL.md e Referências

❌ **Ruim:**

**SKILL.md:**
```markdown
## Database Transactions

A transaction is a sequence of database operations that are executed as a single unit...
ACID properties ensure reliability... To start a transaction use BEGIN... To commit
use COMMIT... To rollback use ROLLBACK...

[200 linhas de explicação]

For more advanced patterns, see `references/transactions.md`
```

**references/transactions.md:**
```markdown
# Advanced Transaction Patterns

## Introduction to Transactions
A transaction is a sequence of database operations that are executed as a single unit...
ACID properties ensure reliability... To start a transaction use BEGIN... To commit
use COMMIT... To rollback use ROLLBACK...

[Mesmas 200 linhas]

## Advanced Patterns

[50 linhas novas]
```

**Problema:** Conteúdo duplicado causa confusão e usa mais tokens.

✅ **Bom:**

**SKILL.md:**
```markdown
## Database Transactions

Use transactions for multi-step operations requiring consistency:

```sql
BEGIN;
UPDATE users SET balance = balance - 100 WHERE id = 1;
UPDATE users SET balance = balance + 100 WHERE id = 2;
COMMIT;
```

**Pattern:** Always wrap multi-step changes in transactions
**Error handling:** Use ON ROLLBACK for error recovery

For advanced patterns like nested transactions, see `references/transactions.md`
```

**references/transactions.md:**
```markdown
# Advanced Transaction Patterns

[Começa diretamente com material novo, sem repetir SKILL.md]

## Nested Transactions

## Savepoints

## Long-Running Transactions

[Conteúdo único]
```

**Melhorias:**
- Sem duplicação
- SKILL.md é resumo rápido
- Referência vai só além
- Economia de tokens

---

### Anti-Padrão 3: Informação Demasiadamente Geral

❌ **Ruim:**
```markdown
## Error Handling

It's important to handle errors in your code. When something goes wrong, you should
catch the error and do something about it. Try-catch blocks are useful for this.
When you catch an error, you should log it so you know what went wrong. You might
want to send an error response to the user explaining what happened.
```

✅ **Bom:**
```markdown
## Error Handling

**Our pattern:**
```typescript
try {
  const user = await db.users.find(id);
} catch (err) {
  logger.error(`User lookup failed: ${err.message}`);
  throw new NotFoundError(`User ${id} not found`);
}
```

**Always:**
- Log to ErrorTracker (see env var ERROR_TRACKER_KEY)
- Return structured error (never raw exception)
- Include correlation ID for tracing
```

---

## Context Efficiency

### Anti-Padrão 1: Incluir Tudo no SKILL.md

❌ **Ruim:**
```markdown
---
name: python-optimization
description: "Help optimize Python code for performance"
---

# Python Performance Optimization

## Section 1: Profiling Tools
[explanation of cProfile, line_profiler, memory_profiler]
[50 lines of configuration]
[20 lines about visualization]

## Section 2: Common Bottlenecks
[Loop optimization]
[List comprehension vs loops]
[Generator functions]
[Dictionary lookup patterns]

## Section 3: Caching
[functools.lru_cache usage]
[Custom cache implementation]
[TTL cache patterns]

## Section 4: Database Queries
[N+1 query problem]
[Index usage]
[Connection pooling]

## Section 5: Concurrency
[Threading vs multiprocessing]
[Async/await patterns]
[asyncio best practices]

[E assim por diante...]
```

**Resultado:**
- SKILL.md = 600 linhas
- Sempre carregado inteiro
- Tokens sempre desperdiçados
- Mesmo se usuário quer "Loop optimization", agente carrega tudo

✅ **Bom:**

**SKILL.md (200 linhas):**
```markdown
---
name: python-optimization
description: "Help optimize Python code for performance. Use when user asks to 'optimize this code', 'improve performance', 'profile Python', or 'make this faster'."
---

# Python Performance Optimization

## Quick Diagnostics

1. **Is it actually slow?** Profile first
   ```bash
   python -m cProfile -s cumtime script.py
   ```

2. **Common bottlenecks:** Loops, DB queries, caching
   - See `references/bottlenecks.md` for patterns

## Common Optimizations

### Loop Optimization
❌ Slow: `for x in list: total += x`
✅ Fast: `total = sum(list)`

### List Comprehension
```python
result = [x*2 for x in data]  # Faster than loop
```

### Caching
```python
from functools import lru_cache

@lru_cache(maxsize=128)
def expensive_function(x):
    ...
```

## References
- [Profiling guide](references/profiling.md)
- [Bottleneck patterns](references/bottlenecks.md)
- [Caching strategies](references/caching.md)
- [Concurrency options](references/concurrency.md)
```

**references/bottlenecks.md (150 linhas):**
```markdown
# Common Python Bottlenecks

## N+1 Query Problem
[Explicação + exemplos]

## Index Usage
[Padrões recomendados]
```

**Resultado:**
- SKILL.md carregado = 200 tokens
- Se precisa caching, carrega `references/caching.md` = +100 tokens
- Se não precisa, não carrega
- Eficiência real

---

### Anti-Padrão 2: Histórico Completo no Contexto

❌ **Ruim:**
```markdown
## Changelog

### Version 5.2.0 (Dec 2024)
- Updated OAuth library...
- Fixed bug in password reset...
- Improved error messages...
[20 linhas]

### Version 5.1.0 (Nov 2024)
[15 linhas]

### Version 5.0.0 (Oct 2024)
[25 linhas]

[... 50 versões anteriores ...]
```

✅ **Bom:**

**SKILL.md:**
```markdown
---
name: auth-helper
description: "..."
version: "5.2.0"
---

[Conteúdo principal]
```

**references/CHANGELOG.md:**
```markdown
# Changelog

## Version 5.2.0 (Dec 2024)
[...]

## Version 5.1.0 (Nov 2024)
[...]

[Apenas versões recentes aqui, histórico completo em arquivo separado]
```

---

## Organização de Referências

### Anti-Padrão 1: Profundidade Excessiva

❌ **Ruim:**
```
my-skill/
├── SKILL.md
└── references/
    ├── workflows/
    │   ├── basic/
    │   │   ├── getting-started.md
    │   │   └── setup.md
    │   └── advanced/
    │       ├── optimization.md
    │       └── troubleshooting.md
    ├── concepts/
    │   ├── fundamentals/
    │   │   └── overview.md
    │   └── advanced/
    │       └── patterns.md
    └── examples/
        ├── basic/
        │   └── hello-world.md
        └── advanced/
            └── complex-flow.md
```

**Problema:** Agente tem dificuldade em navegar profundidade excessiva.

✅ **Bom:**
```
my-skill/
├── SKILL.md
└── references/
    ├── getting-started.md
    ├── workflows.md
    ├── optimization.md
    ├── troubleshooting.md
    ├── patterns.md
    └── examples.md
```

---

### Anti-Padrão 2: Referências sem Propósito Claro

❌ **Ruim:**
```markdown
## References

- `references/file1.md`
- `references/file2.md`
- `references/stuff.md`
- `references/more.md`
- `references/old-notes.md`
```

**Agente não sabe o que cada arquivo faz.**

✅ **Bom:**
```markdown
## References

- **Getting Started**: `references/getting-started.md` - Setup and first steps
- **Common Workflows**: `references/workflows.md` - Day-to-day usage patterns
- **Advanced Patterns**: `references/advanced.md` - Optimization and complex scenarios
- **Troubleshooting**: `references/troubleshooting.md` - Common problems and solutions
- **Code Examples**: `references/examples.md` - Runnable code samples
```

---

## Guardrails e Scope

### Anti-Padrão 1: Sem Guardrails Explícitos

❌ **Ruim:**
```markdown
# Database Skill

## Overview
This skill helps with database operations.

## Common Tasks
[Instructions...]
```

**Agente não sabe:**
- O que ele pode fazer
- O que ele absolutamente NÃO pode fazer
- Quando escalar para humanos
- Limites de responsabilidade

✅ **Bom:**
```markdown
# Database Skill

## What This Covers ✅
- Schema design and migrations
- Performance optimization
- Query writing
- Index creation
- Local testing

## What This Does NOT Cover ❌
- Production deployments (use deployment-guide skill)
- Database provisioning (use DevOps team)
- Data recovery (see backup-management skill)
- Cross-database replication

## Never Do ⚠️
- [ ] Never drop production database
- [ ] Never run migrations without backup
- [ ] Never modify running indexes (causes downtime)
- [ ] Never disable foreign keys
- [ ] Escalate if data loss is possible

## When to Escalate
- [ ] Any production change requiring downtime
- [ ] Data restoration from backup needed
- [ ] Database hardware/infrastructure changes
```

---

## Exemplos Completos Side-by-Side

### Exemplo 1: API Integration Skill

❌ **ANTIPADRÃO (Ruim):**

```markdown
---
name: api-integration
description: "API integration helper"
---

# API Integration

## What is an API?
An API (Application Programming Interface) is a way for applications to communicate
with each other over a network. The most common type is REST API which uses HTTP...

## HTTP Methods
GET - retrieves data
POST - creates data
PUT - updates data
DELETE - deletes data

## Authentication Methods
There are several ways to authenticate:
- Basic Auth: username and password sent in HTTP header
- Bearer Token: token sent in Authorization header
- OAuth: more complex flow...
[100 linhas de explicação básica]

## Status Codes
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
500 Internal Server Error

## Our APIs

### Users API
See the users service at /services/users

### Products API
See the products service at /services/products

### Orders API
See the orders service at /services/orders

Detailed docs in each service folder...

## Implementation Steps

1. Authentication: Get token
2. Request: Make HTTP call
3. Handle Response: Check status
4. Error: Handle errors

For more detailed steps...
[200 linhas de processo genérico]

## Examples

Some examples...
[Sem exemplos concretos reais]

## Troubleshooting

If it doesn't work...
[Vago]
```

**Problemas:**
- 800+ linhas em SKILL.md
- Explica conceitos básicos (HTTP, REST, autenticação)
- Exemplo vago/genérico
- Sem guardrails
- Sem estrutura clara
- Sem links práticos

✅ **PADRÃO RECOMENDADO:**

**SKILL.md:**
```markdown
---
name: api-integration
description: "Integrate with our internal APIs, handle authentication, error cases. Use when working with Users, Products, or Orders API. Activate on 'call API', 'make request', 'integrate user service'."
version: "2.0"
---

# API Integration Guide

## Quick Start

All our APIs use Bearer Token + JSON. Get token at `/auth/token`:

```bash
curl -X POST https://api.internal/auth/token \
  -u client_id:client_secret

# Response: { "token": "eyJ0..." }
```

## Our Services

| Service | Endpoint | Auth | Use For |
|---------|----------|------|---------|
| Users   | `/users` | Bearer | User management |
| Products | `/products` | Bearer | Product catalog |
| Orders  | `/orders` | Bearer | Order processing |

## Common Pattern

```javascript
const api = new APIClient({
  baseUrl: 'https://api.internal',
  token: process.env.API_TOKEN
});

// Fetch
const user = await api.get('/users/123');

// Create
const order = await api.post('/orders', { items: [...] });

// Update
await api.put('/orders/456', { status: 'shipped' });
```

## Error Handling

```javascript
try {
  const user = await api.get(`/users/${id}`);
} catch (err) {
  if (err.status === 404) {
    logger.warn(`User not found: ${id}`);
    throw new NotFoundError();
  }
  // Log and escalate
  logger.error(`API call failed:`, err);
  throw err;
}
```

See:
- **Service-specific details**: `references/services.md`
- **Authentication flows**: `references/auth.md`
- **Error codes & solutions**: `references/errors.md`
- **Complete examples**: `scripts/examples/`

## Guardrails

✅ **Do:**
- Use API client wrapper
- Handle 429 (rate limit) with exponential backoff
- Cache responses when appropriate
- Use correlation IDs for tracing

❌ **Never:**
- Hardcode tokens (use env vars)
- Make API calls in loops without batching
- Ignore rate limit headers
- Retry without backoff (creates cascading failures)

## Decision Tree

**Need to fetch data?** → See `references/services.md`

**Getting 401 error?** → See `references/auth.md` (token expired)

**Getting 429 error?** → Implement backoff strategy; see examples

**Something else?** → Check `references/errors.md`
```

**references/services.md:**
```markdown
# Service-Specific Details

## Users Service

### Endpoints
- `GET /users` - List users (paginated)
- `GET /users/{id}` - Get specific user
- `POST /users` - Create user
- `PUT /users/{id}` - Update user

### Required Fields
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "role": "admin|user"
}
```

[Mais detalhes...]

## Products Service
[Detalhes...]

## Orders Service
[Detalhes...]
```

**references/auth.md:**
```markdown
# Authentication

## Token Lifecycle

[Explicação de expiração, refresh, etc.]

## OAuth Flow
[Quando usar OAuth vs Bearer]
```

**references/errors.md:**
```markdown
# Error Codes & Solutions

## 401 Unauthorized
- Problem: Token expired or invalid
- Solution: Get new token; refresh if expired

## 429 Too Many Requests
- Problem: Rate limit exceeded
- Solution: Implement exponential backoff

[Etc...]
```

**Resultado:**
- SKILL.md: 180 linhas (quick reference)
- Referências: 350 linhas distribuído (detalhes sob demanda)
- Agente começa leve, aprofunda conforme necessário
- Sem bloat
- Sem redundância

---

### Exemplo 2: Testing Framework Skill

❌ **ANTIPADRÃO:**

```markdown
---
name: jest-testing
description: "Testing"
---

# Jest Testing Guide

## What is Jest?
Jest is a JavaScript testing framework created by Facebook...

## What are Tests?
A test is a piece of code that verifies another piece of code works correctly...

## Types of Tests
Unit tests test individual functions...
Integration tests test multiple parts...
E2E tests test full workflows...

## Test Anatomy
A test has three parts: Arrange, Act, Assert...

[200 linhas de conceitos básicos]

## Our Test Structure

Tests go in `__tests__` folder.
They should have .test.js extension.
[Vago]

## Example Test

```javascript
test('it works', () => {
  expect(true).toBe(true);
});
```

## Mocking

Mocking is when you fake something...
[Vago e incompleto]

[400+ linhas total, genérico, sem padrões reais do projeto]
```

✅ **PADRÃO RECOMENDADO:**

**SKILL.md:**
```markdown
---
name: jest-testing
description: "Write Jest tests following project conventions. Use when user says 'add tests', 'write unit test', 'fix failing test', 'improve coverage', or 'test this function'."
---

# Jest Testing Guide

## File Organization

```
src/
├── services/
│   ├── user.service.ts
│   └── __tests__/user.service.test.ts
└── utils/
    ├── helpers.ts
    └── __tests__/helpers.test.ts
```

**Rule:** Test file lives next to source, same name + `.test.ts`

## Basic Pattern

```typescript
import { getUserById } from '../user.service';

describe('getUserById', () => {
  it('should return user when found', async () => {
    const user = await getUserById(123);
    expect(user.id).toBe(123);
    expect(user.email).toBeDefined();
  });

  it('should throw NotFound when user missing', async () => {
    await expect(getUserById(999)).rejects.toThrow(NotFoundError);
  });
});
```

## Mocking Pattern

```typescript
import { db } from '@/services/database';
jest.mock('@/services/database');

describe('with mocking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call database', async () => {
    (db.query as jest.Mock).mockResolvedValue({ id: 1 });
    await getSomething();
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
  });
});
```

## Coverage Targets

- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

Check: `npm run test:coverage`

See:
- **Advanced mocking**: `references/mocking.md`
- **E2E tests**: `references/e2e.md`
- **Performance tests**: `references/performance.md`

## Guardrails

❌ **Never:**
- [ ] Don't test implementation details (mock behavior, not calls)
- [ ] Don't have flaky tests (avoid time-dependent assertions)
- [ ] Don't test third-party libraries (assume they work)
- [ ] Don't forget beforeEach cleanup

✅ **Always:**
- [ ] Test error cases (not just happy path)
- [ ] Mock external dependencies
- [ ] Use descriptive test names
- [ ] Keep tests < 20 lines (split if longer)
```

**references/mocking.md:**
```markdown
# Mocking Patterns

## Database Mocks
[Padrão específico do projeto...]

## API Mocks
[Padrão específico...]

## Date/Time Mocks
[Como mockar Date]
```

**Resultado:**
- Focado em padrões do projeto
- Sem explicações básicas
- Guardrails claros
- Eficiente

---

## Resumo: Checklist de Comparação

| Aspecto | Antipadrão | Padrão Recomendado |
|---------|-----------|-------------------|
| **Description** | Vaga ("Testing helper") | Específica com triggers ("add tests", "write unit test") |
| **SKILL.md Size** | 800+ linhas | <500 linhas |
| **Conteúdo Básico** | Ensina HTTP, REST, autenticação | Assume competência, foca projeto |
| **Referências** | Profundidade 3-4 níveis | Máximo 1-2 níveis |
| **Duplicação** | Duplica entre SKILL e referencias | Sem duplicação |
| **Histórico** | Changelog completo em SKILL.md | Changelog em arquivo separado |
| **Guardrails** | Não explícito | Checklist claro ✅/❌ |
| **Exemplos** | Genéricos ou faltantes | Concretos do projeto |
| **Scope** | Vago | Explícito (o que faz/não faz) |
| **Context Loading** | Tudo de uma vez | Progressive disclosure |
| **Tokens Gastos** | 600-800 sempre | 150-300 base + sob demanda |

---

## Conclusão

A diferença entre skill ruim e skill excelente é **economia de tokens + clareza de escopo**.

**Regra de Ouro**: Cada linha que pode ser removida SEM perder funcionalidade deve ser removida. Cada token economizado é melhor reasoning para o agente.
