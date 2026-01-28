# Guia Completo: Boas Práticas para Escrever Skills.md (Markdown de Skills para Agentes IA)

## Índice
1. [Introdução e Conceitos Fundamentais](#introdução)
2. [Estrutura Recomendada](#estrutura)
3. [Frontmatter (Metadados)](#frontmatter)
4. [O Campo Description (Crítico para Ativação)](#description)
5. [Instruções e Corpo do Documento](#instruções)
6. [Context Engineering e Evitar Bloat](#context-engineering)
7. [Organização e Referências](#organização)
8. [Padrões Avançados](#padrões-avançados)
9. [Checklist de Otimização](#checklist)
10. [Exemplos Práticos](#exemplos)

---

## Introdução e Conceitos Fundamentais

### O que é um Skill.md?

Um **Skill.md** é um arquivo Markdown que encapsula conhecimento procedural, instruções e recursos que um agente IA pode descobrir e carregar **dinamicamente**. É como um "onboarding guide" para uma nova habilidade do agente.

**Características principais:**
- Arquivo único com metadados (frontmatter YAML) + instruções
- Pode estar acompanhado de scripts, referências e assets
- Ativação sob demanda (progressive disclosure de contexto)
- Portável entre diferentes agentes (Claude, GitHub Copilot, etc.)
- Economiza tokens através de carregamento dinâmico vs. tudo no system prompt

### Por que Skills funcionam?

**Problema tradicional**: Colocar toda a documentação no system prompt causa:
- Bloat de contexto (tokens desperdiçados)
- Confusão do modelo com instruções irrelevantes
- Perda de espaço para raciocínio real
- Redução de qualidade em tarefas complexas

**Solução com Skills**: O agente carrega apenas o que precisa, quando precisa.

---

## Estrutura Recomendada

### Estrutura de Pasta Padrão

```
my-skill/
├── SKILL.md                 # Obrigatório: metadados + instruções principais
├── scripts/                 # Opcional: código executável, exemplos de uso
│   ├── example-usage.py
│   └── template.js
├── references/              # Opcional: documentação detalhada
│   ├── advanced-features.md
│   ├── troubleshooting.md
│   └── api-reference.md
└── assets/                  # Opcional: templates, recursos auxiliares
    ├── templates/
    └── examples/
```

### Convenção de Nomes

- **Nome do skill**: kebab-case, descritivo (ex: `pdf-analysis`, `code-review-assistant`)
- **Arquivo principal**: Sempre `SKILL.md` (case-sensitive)
- **Subpastas**: Nomes simples, evitar profundidade > 2 níveis

---

## Frontmatter (Metadados)

O frontmatter é a seção YAML no topo do arquivo, delimitada por `---`. Este é **sempre carregado** pelo agente, então deve ser otimizado.

### Campos Obrigatórios

```yaml
---
name: pdf-analysis
description: Analyze PDF documents, extract text, create summaries. Use when analyzing PDF files, extracting data, or generating document summaries.
---
```

**Por que apenas estes dois?** Porque o agente usa `name` e `description` para descoberta. Qualquer coisa extra aqui é desperdício de tokens.

### Campos Opcionais (Use com Cuidado)

```yaml
---
name: pdf-analysis
description: Analyze PDF documents, extract text, create summaries. Use when analyzing PDF files, extracting data, or generating document summaries.
version: "1.0.0"
license: MIT
author: seu-nome
tags: ["pdf", "data-extraction", "summarization"]
metadata:
  compatibility: ["claude", "copilot"]
  complexity: "intermediate"
  estimated-tokens: 150
---
```

**Recomendação**: Mantenha `metadata` sob 100 tokens. Se precisa de mais informações, coloque em referências separadas.

### Boas Práticas para Frontmatter

✅ **Faça:**
```yaml
---
name: api-integration-helper
description: Guide agents through API authentication, request building, and error handling. Use when working with REST APIs, debugging API calls, or implementing OAuth flows.
---
```

❌ **Não faça:**
```yaml
---
name: api-integration-helper
description: API integration helper
license: MIT
author: John Doe
copyright: 2025
repository: https://github.com/...
created: 2025-01-27
last-updated: 2025-01-27
keywords: api, rest, http, oauth, authentication, integration, debugging, error-handling
detailed-metadata:
  complexity-level: "advanced-intermediate"
  estimated-hours-to-master: 4
  prerequisites: ["basic-http", "json-parsing"]
  related-skills: ["database-integration", "error-handling"]
---
```

---

## O Campo Description (Crítico para Ativação)

Este é o **campo mais importante** para determinar quando seu skill é usado.

### Propósito

O `description` é injetado no system prompt do agente e usado para matching de tarefas. Se estiver ruim:
- O agente não carrega o skill quando deveria
- Carrega quando não deveria
- Usa skill errado para a tarefa

### Estrutura Recomendada (3 Partes)

```yaml
description: "[O que faz]. [Quando usar]. [Exemplos/triggers]"
```

**Exemplo real:**
```yaml
description: "Generate descriptive Git commit messages by analyzing git diffs and staged changes. Use when the user asks for help writing commits, reviewing changes, or improving commit messages. Activate on: 'write commit', 'commit message', 'git commit', or 'review staged changes'."
```

### Regras para Description

1. **Ponto de vista em terceira pessoa**: "Use when..." não "I can help when..."
   - ✅ "Use when analyzing spreadsheets"
   - ❌ "I can analyze spreadsheets"

2. **Inclua palavras-chave específicas**
   - ✅ "Analyze Excel files, create pivot tables, generate charts. Use when working with .xlsx files or spreadsheet data."
   - ❌ "Spreadsheet helper"

3. **Inclua triggers reais** (as palavras que o usuário realmente diz)
   - ✅ "Use when user says 'add tests', 'write unit tests', 'create test suite'"
   - ❌ "Use for testing methodologies"

4. **Seja específico sobre contexto de ativação**
   - ✅ "Activate when analyzing Excel files, spreadsheets, tabular data, or .xlsx files"
   - ❌ "Use for data"

5. **Comprimento ideal**: 1-3 sentenças, ~50-100 tokens

### Exemplos de Descriptions Bem Feitas

**Skill: Test Pattern Writer**
```yaml
description: "Help write and execute tests following project-specific conventions. Use when the user asks to 'add tests', 'write tests', 'create test suite', or 'check test coverage'. Handles unit, integration, and e2e tests."
```

**Skill: TypeScript Utilities**
```yaml
description: "Assist with TypeScript type definitions, generics, and advanced patterns. Use when working with complex types, creating reusable type utilities, or debugging type errors in .ts files."
```

**Skill: Database Schema Migration**
```yaml
description: "Guide database schema migrations, versioning, and rollback procedures. Activate when user mentions 'migrate database', 'schema change', 'migration', or 'database upgrade'."
```

---

## Instruções e Corpo do Documento

Após o frontmatter, o corpo do SKILL.md contém as instruções que o agente segue **quando o skill é ativado**.

### Princípios Fundamentais

#### 1. **Assume Conhecimento Já Existente**

❌ Não faça:
```markdown
# Git Commit Helper

## What is Git?
Git is a version control system created by Linus Torvalds in 2005...

## What is a Commit?
A commit is a snapshot of changes...

## How to Use grep
grep is a command-line tool that searches text...
```

✅ Faça:
```markdown
# Git Commit Helper

## Commit Message Structure
Format: `type(scope): brief description`

Examples:
- `feat(auth): add OAuth login`
- `fix(api): handle null response`
```

**Regra prática**: Se o modelo de IA já sabe (e sabe muito bem), não inclua. Economize tokens para conhecimento único do seu projeto.

#### 2. **Capture Apenas Conhecimento Único**

O modelo já domina:
- ✅ Omita: Sintaxe básica de linguagens comuns
- ✅ Omita: Conceitos de engenharia bem estabelecidos
- ✅ INCLUA: Convenções do seu projeto
- ✅ INCLUA: Decisões arquiteturais específicas
- ✅ INCLUA: Pain points e gotchas conhecidas
- ✅ INCLUA: Workflows diferenciados

#### 3. **Use Referências em Vez de Duplicação**

Se um conceito já está bem documentado em outro lugar, referencie:

```markdown
# Advanced Type Patterns

For basic TypeScript syntax, see TypeScript handbook. This skill focuses on:

1. **Generic Type Constraints**: Used extensively in our codebase for type safety
   - Pattern: `<T extends SomeInterface>`
   - Our use case: Ensures all model types extend BaseModel

2. **Conditional Types**: Enables compile-time type narrowing
   - We use this in our middleware for request validation
```

#### 4. **Estrutura Recomendada para o Corpo**

```markdown
---
name: skill-name
description: ...
---

# Skill Name

## Overview
[1-2 parágrafos de alto nível sobre quando e por que usar]

## Key Workflows
1. **Workflow A**: [O que faz, quando usar]
2. **Workflow B**: [O que faz, quando usar]

## Step-by-Step Instructions
[Se aplicável: passos numerados com exemplos]

## Common Patterns & Examples
[Snippets concretos do seu projeto/domínio]

## Guardrails & Constraints
[O que NUNCA fazer, limitações, restrições de escopo]

## Troubleshooting
[Problemas comuns e soluções]

## Related Files
- `references/advanced-features.md` (para detalhes profundos)
- `scripts/example-usage.py` (código de exemplo)
```

### Comprimento Ideal

**Recomendação**: Mantenha SKILL.md sob **500 linhas**.

- Se atingir esse limite, divida em múltiplos arquivos de referência
- Referências podem ser mais longas (1000+ linhas é ok se bem organizada)
- Use índice de conteúdo (Table of Contents) para arquivos > 100 linhas

### Otimizando para Tokens

#### Técnica 1: Eliminar Redundância

❌ Má:
```markdown
## Setup Instructions

The model needs to be installed before use. To install:

1. Clone the repository: `git clone ...`
2. Navigate to directory: `cd my-repo`
3. Install dependencies: `npm install`
4. Create environment variables
5. Run migrations: `npm run migrate`
6. Start server: `npm run dev`

This setup process is important because without proper setup, the model won't work correctly.
```

✅ Boa:
```markdown
## Setup

```bash
git clone ...
cd my-repo
npm install
cp .env.example .env
npm run migrate
npm run dev
```
```

#### Técnica 2: Usar Listas em Vez de Prosa

❌ Má:
```markdown
When working with the database, you should remember that transactions are important 
for data consistency. You should use transactions when making multiple related changes. 
Always wrap database operations in try-catch blocks to handle errors properly.
```

✅ Boa:
```markdown
## Database Operations

- **Transactions**: Wrap multi-step operations for consistency
- **Error Handling**: Use try-catch for all db calls
- **Connection Pool**: Reuse connections; don't create new ones per query
```

#### Técnica 3: Referências Inteligentes

Em vez de detalhar tudo no SKILL.md:

```markdown
## Advanced Configuration

For detailed config options, see `references/config-guide.md`

Quick reference:
- `maxRetries`: Default 3, set to 0 to disable
- `timeout`: Milliseconds before request fails
- `cache`: Enable response caching (reduces API calls)
```

O agente carrega referências apenas se precisar aprofundar.

---

## Context Engineering e Evitar Bloat

### O Problema: Context Bloat em Skills

Mesmo com skills, é possível desperdiçar contexto:

❌ **Antipadrões:**
1. Incluir skill inteiro + todas as referências no sistema prompt
2. Duplicar informações entre SKILL.md e referências
3. Não usar progressive disclosure (carregar tudo de uma vez)
4. Guardar todo o histórico de conversa em contexto
5. Misturar múltiplos skills sem separação clara

### Estratégia: Progressive Disclosure

**Princípio**: O agente carrega apenas o que precisa, quando precisa.

**Implementação:**
```markdown
# SKILL.md

## Quick Reference
[Resume executivo de 50 linhas]

## Detailed Workflows
See `references/workflows.md` for step-by-step instructions

## API Reference
See `references/api-docs.md` for complete parameter list

## Examples
See `scripts/example-usage.py` for working code samples
```

O agente lê SKILL.md (~150 tokens). Se precisa de detalhes, carrega a referência específica.

### Técnica: Compactação em Longa Conversa

Se conversação está usando muitos tokens:

```markdown
## Handling Long Conversations

1. **Summarize Progress**: Before reaching 80% context limit, summarize what foi feito
2. **Archive Details**: Move completed work to files, referenece apenas
3. **Reload Context**: Load skill afresh + resumo ao invés de full history
4. **Sub-agents**: Para tarefas paralelas, use sub-agents com workspaces separados
```

### Dynamic Tool Selection

Em vez de ativar todos os tools sempre:

```markdown
## Tools Available

Load dynamically based on task:
- `file_read`: Only if file analysis needed
- `api_call`: Only if API integration needed
- `database_query`: Only for data operations
```

Sistema inteligente carrega apenas tools relevantes.

### Context Hygiene Checklist

- [ ] SKILL.md é <500 linhas?
- [ ] Metadados são <100 tokens?
- [ ] Informação óbvia foi removida?
- [ ] Referências são um nível de profundidade?
- [ ] Há Table of Contents se arquivo > 100 linhas?
- [ ] Histórico é periodicamente compactado?
- [ ] Apenas skills relevantes estão carregados?
- [ ] Outputs longos vão para arquivos, não contexto?

---

## Organização e Referências

### Estrutura de Referências (Reference Files)

Cada arquivo em `references/` deve:
1. Ter título claro
2. Ser acessível independently
3. Ter Table of Contents se > 100 linhas
4. Ser referenciado pelo SKILL.md

**Exemplo estrutura:**

```markdown
---
skill: pdf-analysis
file: references/advanced-extraction.md
---

# Advanced PDF Extraction Techniques

## Table of Contents
1. [OCR Processing](#ocr)
2. [Table Recognition](#tables)
3. [Form Field Extraction](#forms)

## OCR Processing

[Conteúdo...]

## Tables

[Conteúdo...]
```

### Convenção de Links

No SKILL.md, referencie com clareza:

```markdown
## For More Information

- Detailed workflows: See `references/workflows.md`
- API parameters: See `references/api-reference.md`
- Troubleshooting: See `references/troubleshooting.md`
- Code examples: See `scripts/example-usage.py`
```

### Assets e Templates

Se o skill necessita templates:

```
assets/
├── templates/
│   ├── request-template.json
│   ├── response-schema.ts
│   └── config-example.yaml
└── examples/
    ├── basic-usage.py
    └── advanced-workflow.js
```

Referencie no SKILL.md:
```markdown
## Templates

- `assets/templates/request-template.json`: Starting point for API calls
- `assets/examples/basic-usage.py`: Minimal working example
```

---

## Padrões Avançados

### Padrão 1: Workflows Condicionais

Para skills com múltiplos caminhos:

```markdown
## Decision Tree

**Is this a new feature or a fix?**
- New feature → See "Feature Development" workflow
- Bug fix → See "Bug Fix" workflow
- Refactoring → See "Refactoring" workflow

### Feature Development Workflow
1. Create feature branch
2. Implement changes
3. Add tests
4. Submit PR
5. Request review

### Bug Fix Workflow
1. Create bugfix branch from production
2. Implement fix
3. Add regression test
4. Hotfix release
5. Merge to develop
```

### Padrão 2: Guardrails e Scope

Sempre defina limites explicitamente:

```markdown
## Scope & Guardrails

### ✅ This Skill Covers
- Creating new database migrations
- Testing migrations locally
- Writing rollback procedures

### ❌ This Skill Does NOT Cover
- Production deployment (use deployment-guide skill)
- Data backup procedures (use backup-management skill)
- Performance optimization (use database-tuning skill)

### Never Do
- [ ] Never run migrations without backup
- [ ] Never modify existing migration files
- [ ] Never skip rollback testing
```

### Padrão 3: Checklist para Tarefas Complexas

Para workflows com múltiplas etapas:

```markdown
## Pre-Deployment Checklist

- [ ] All tests passing (`npm run test`)
- [ ] Migrations tested locally
- [ ] Environment variables set
- [ ] Database backup created
- [ ] Rollback procedure documented
- [ ] Team notified of deployment time
- [ ] Monitoring alerts configured

Use this checklist before each deployment.
```

### Padrão 4: Evitar Profundidade Excessiva

❌ Antipadrão (evite):
```
my-skill/
├── SKILL.md
└── references/
    ├── workflows/
    │   ├── basic/
    │   │   └── getting-started.md
    │   └── advanced/
    │       └── optimization.md
```

✅ Padrão melhor:
```
my-skill/
├── SKILL.md
└── references/
    ├── workflows.md
    ├── optimization.md
    └── getting-started.md
```

Agentes navegam melhor com estrutura plana (max 2 níveis).

### Padrão 5: Versionamento e Mudanças

```markdown
---
name: api-integration
description: ...
version: "2.1.0"
---

# API Integration Helper

## Recent Changes

### v2.1.0 (Jan 2025)
- Added retry logic for rate-limited endpoints
- Updated OAuth2 flow for v3 API
- Deprecated basic auth (use OAuth only)

### v2.0.0 (Dec 2024)
- Complete rewrite for API v2
- [See CHANGELOG.md for older versions]
```

---

## Checklist de Otimização

### Antes de Publicar seu Skill

#### Conteúdo
- [ ] Description é específico e inclui triggers?
- [ ] SKILL.md não duplica informações das referências?
- [ ] Informação óbvia (já sabida pelo modelo) foi removida?
- [ ] Cada diretório tem Table of Contents se > 100 linhas?
- [ ] Guardrails estão explícitos (o que NUNCA fazer)?
- [ ] Exemplos práticos inclusos?
- [ ] Pain points conhecidos documentados?

#### Estrutura
- [ ] Pasta segue convenção (kebab-case)?
- [ ] SKILL.md < 500 linhas?
- [ ] Frontmatter tem apenas name + description + opcional metadata?
- [ ] Referências são máximo 1 nível de profundidade?
- [ ] Links para referências estão claros?
- [ ] Arquivos têm nomes descritivos (não "file1.md")?

#### Context Efficiency
- [ ] Metadados < 100 tokens?
- [ ] Sem redundância entre SKILL.md e referências?
- [ ] Progressive disclosure implementado?
- [ ] Scripts e templates no lugar correto?
- [ ] Nenhuma informação duplicada?
- [ ] Histórico/changelog relegado a arquivo separado?

#### Qualidade
- [ ] Linguagem consistente (3ª pessoa)?
- [ ] Código de exemplo testado?
- [ ] Sem typos ou formatting inconsistente?
- [ ] Links internos funcionando?
- [ ] Nomes de arquivo são válidos e portáveis?
- [ ] Compatibilidade com múltiplos agentes (se aplicável)?

#### Descoberta (Discovery)
- [ ] Description é útil para identificar quando usar?
- [ ] Palavras-chave relevantes incluídas?
- [ ] Conflitos com outros skills removidos?
- [ ] Scope claramente definido?

---

## Exemplos Práticos

### Exemplo 1: Skill Simples - TypeScript Helper

**Estrutura:**
```
typescript-types/
├── SKILL.md
└── references/
    ├── patterns.md
    └── common-mistakes.md
```

**SKILL.md:**
```markdown
---
name: typescript-types
description: "Guide creating advanced TypeScript type definitions, generics, and utility types. Use when working with complex types, debugging type errors, or creating reusable type utilities for .ts files."
version: "1.0"
---

# TypeScript Type Helper

## Overview
Assist with advanced typing patterns commonly used in our codebase. Focuses on generics, utility types, and avoiding common pitfalls.

## Common Patterns

### Generic Type Guards
```typescript
function isString(value: unknown): value is string {
  return typeof value === 'string';
}
```

### Conditional Types
```typescript
type Flatten<T> = T extends Array<infer U> ? U : T;
```

## Guardrails
- Never use `any` (use `unknown` + type guard)
- Don't create overly complex generics (maintainability)
- Always test types with actual data

## References
- See `references/patterns.md` for advanced examples
- See `references/common-mistakes.md` for anti-patterns
```

---

### Exemplo 2: Skill Completo - Database Migrations

**Estrutura:**
```
db-migrations/
├── SKILL.md
├── scripts/
│   ├── migration-template.sql
│   └── rollback-example.sql
└── references/
    ├── workflows.md
    ├── troubleshooting.md
    └── best-practices.md
```

**SKILL.md:**
```markdown
---
name: db-migrations
description: "Guide database schema migrations, writing rollbacks, and handling version control. Use when user asks to 'create migration', 'migrate database', 'schema change', or 'rollback'."
version: "2.0"
---

# Database Migrations Guide

## Overview
Help write safe, reversible database migrations with proper version control and rollback procedures.

## Quick Workflow

1. **Create Migration**
   ```bash
   npm run migration:create -- add_users_table
   ```

2. **Write Up/Down**
   - UP: The change to make
   - DOWN: The rollback procedure

3. **Test Locally**
   ```bash
   npm run migration:test
   npm run migration:revert
   npm run migration:test
   ```

4. **Commit & Deploy**

## Common Patterns

### Adding Column
```sql
-- Up
ALTER TABLE users ADD COLUMN email VARCHAR(255);

-- Down
ALTER TABLE users DROP COLUMN email;
```

### Creating Index
```sql
-- Up
CREATE INDEX idx_users_email ON users(email);

-- Down
DROP INDEX idx_users_email;
```

## Guardrails ⚠️

### Never
- [ ] Don't drop columns without discussion
- [ ] Don't create non-reversible migrations
- [ ] Don't migrate without backup
- [ ] Don't skip local testing

## References
- Detailed workflows: `references/workflows.md`
- Troubleshooting issues: `references/troubleshooting.md`
- Best practices: `references/best-practices.md`
- Templates: `scripts/migration-template.sql`
```

**references/workflows.md:**
```markdown
# Database Migration Workflows

## Table of Contents
1. [Creating Tables](#creating-tables)
2. [Modifying Columns](#modifying-columns)
3. [Adding Indexes](#adding-indexes)

## Creating Tables

[Conteúdo detalhado...]

## Modifying Columns

[Conteúdo detalhado...]
```

---

### Exemplo 3: Skill com Múltiplos Workflows - Testing Framework

```markdown
---
name: jest-testing
description: "Write and maintain Jest tests following project conventions. Use when user says 'add tests', 'write unit tests', 'fix failing test', or 'improve coverage'."
---

# Jest Testing Guide

## Overview
Help write tests that follow our project's patterns and conventions.

## Decision Tree

**What type of test?**

### Unit Tests
- **Where**: `src/__tests__/unit/`
- **Focus**: Individual functions/components
- **Pattern**: `describe` + `it` blocks
- **Mocking**: Mock external dependencies

### Integration Tests
- **Where**: `src/__tests__/integration/`
- **Focus**: Multiple units working together
- **Setup**: Use test database
- **Cleanup**: Clean between tests

### E2E Tests
- **Where**: `e2e/`
- **Focus**: Full workflows
- **Tools**: Cypress/Playwright
- **See**: `references/e2e-setup.md`

## Guardrails
- Always include beforeEach/afterEach cleanup
- Mock API calls (don't make real requests)
- Keep tests < 20 lines
- Use descriptive test names

## References
- Setup guide: `references/jest-setup.md`
- Advanced mocking: `references/mocking-patterns.md`
- Common issues: `references/troubleshooting.md`
```

---

## Resumo de Princípios-Chave

| Princípio | Aplicação |
|-----------|-----------|
| **Progressive Disclosure** | SKILL.md leve; referências detalhadas carregadas sob demanda |
| **Assume Competência** | Não ensine conceitos básicos; assuma domínio do modelo |
| **Conhecimento Único** | Inclua apenas informação diferenciada do seu projeto |
| **Sem Bloat** | Mantenha SKILL.md < 500 linhas, metadados < 100 tokens |
| **Description Poderosa** | Triggers reais, palavras-chave específicas, contexto claro |
| **Guardrails Explícitos** | Diga exatamente o que NUNCA fazer |
| **Exemplos Concretos** | Snippets reais do projeto, não teóricos |
| **Referências Claras** | Links óbvios para aprofundamento, máximo 1 nível profundo |
| **Estrutura Plana** | Evite nesting profundo; max 2 níveis de diretórios |
| **Context Hygiene** | Prune regularmente, compacte histórico, carregue dinamicamente |

---

## Recursos Adicionais

### Documentação Oficial
- **Anthropic Agent Skills**: https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- **Claude API Docs (Skills)**: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices

### Comunidade e Exemplos
- **Agent Skills Marketplace**: https://www.agentskills.in/
- **Chromatic Labs (Context Engineering Series)**: https://www.chromaticlabs.co/
- **Reddit Thread**: AI agent best practices from experienced engineers

### Frameworks Relacionados
- **AGENTS.md**: Markdown de instruções específicas do repositório
- **MCP (Model Context Protocol)**: Para integração de ferramentas
- **RAG (Retrieval-Augmented Generation)**: Para conhecimento dinâmico

---

## Conclusão

Escrever skills eficazes é equilibrar **completude com concisão**. O objetivo é fornecer exatamente o conhecimento que o agente precisa, **quando precisa**, sem desperdiçar tokens ou contexto.

**Ao seguir este guia:**
1. ✅ Seus agentes serão mais precisos (melhor discovery)
2. ✅ Contexto será economizado (progressive disclosure)
3. ✅ Skills serão portáveis (seguem padrões)
4. ✅ Qualidade escala (conhecimento documentado de forma clara)

**A regra de ouro**: Se você pode remover uma linha e o skill ainda funciona, remova-a.
