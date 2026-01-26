# Skill-E

> **"Ensine ao Agente Como Fazer"** — Crie Agent Skills por demonstração, não por escrita manual.

<p align="center">
  <img src="./assets/skille_bot.PNG" alt="Skill-E Bot" width="400" />
</p>

<p align="center">
  <strong>🏆 Projeto para o Kiro Hackathon 2025</strong>
</p>

---

## 🤔 Por Que Skill-E?

### O Problema com Agentes Gerais

Agentes de IA gerais são poderosos, mas têm limitações críticas:

| Problema | Consequência |
|----------|--------------|
| **Alucinação** | Inventam passos que não existem |
| **Inconsistência** | Fazem diferente a cada vez |
| **Falta de contexto** | Não conhecem SEU sistema |
| **Sem guardrails** | Podem fazer coisas perigosas |
| **Difícil de auditar** | Você não sabe o que vão fazer |

### A Solução: Skills Específicas

**Skills são robôzinhos de ensino** — você mostra como fazer, e a IA aprende EXATAMENTE aquilo.

```
❌ Agente Geral: "Encontre o cliente João no sistema"
   → Pode clicar em qualquer lugar
   → Pode acessar dados errados
   → Pode fazer ações destrutivas

✅ Skill Específica: "Encontre o cliente {nome} no sistema"
   → Passos exatos definidos
   → Campos específicos identificados
   → Guardrails de segurança
   → Human-in-the-loop quando necessário
```

### Por Que Demonstrar é Melhor que Descrever?

| Só Descrever para LLM | Demonstrar com Skill-E |
|-----------------------|------------------------|
| ❌ Você esquece detalhes | ✅ Captura tudo automaticamente |
| ❌ LLM interpreta errado | ✅ Vê exatamente o que você fez |
| ❌ Sem contexto visual | ✅ Screenshots de referência |
| ❌ Variáveis ambíguas | ✅ Detecta variáveis da sua fala |
| ❌ Sem validação | ✅ Verificação de sucesso embutida |

---

## 🛡️ Segurança: Guardrails Embutidos

Skills criadas com Skill-E têm **safeguards de segurança** por design:

### 1. Restrições de Escopo

```markdown
## ⚠️ Limites desta Skill

Esta skill DEVE:
- Operar apenas no sistema CRM
- Acessar apenas dados de clientes ativos

Esta skill NÃO DEVE:
- Deletar registros permanentemente
- Acessar dados financeiros
- Exportar mais de 100 registros por vez
```

### 2. Human-in-the-Loop

```markdown
## 🔒 Pontos de Confirmação

### Antes de Salvar
> **PAUSE**: Confirme com o usuário antes de salvar alterações.
> Mostre o que será alterado e aguarde aprovação.

### Antes de Exportar
> **PAUSE**: Confirme destino e formato com o usuário.
```

### 3. Rollback e Logs

```markdown
## 📝 Auditoria

- Registrar cada ação em log
- Salvar estado anterior antes de modificações
- Manter histórico de 30 dias
```

---

## 🔍 Pesquisa Automática de Documentação

Quando você demonstra algo que usa uma biblioteca ou API, Skill-E pode **buscar a documentação automaticamente**:

### Integração com Context7 (MCP)

```
Você demonstra: "Aqui eu uso o pandas pra filtrar..."

Skill-E detecta: pandas
       ↓
Busca no Context7: documentação do pandas
       ↓
Adiciona à skill: Referência de como usar df.query()
```

### Resultado no SKILL.md

```markdown
## Referências Técnicas

### Pandas DataFrame Filtering
> Para filtrar dados, use `df.query()` ou `df[df['coluna'] == valor]`.
> Documentação: https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.query.html

Esta skill usa os seguintes métodos:
- `df.query()` - Para filtros complexos
- `df.to_csv()` - Para exportação
```

---

## 🧠 Como Skill-E Entende Sua Demonstração

### 1. Captura Multimodal

| Canal | O que Captura | Por que Importa |
|-------|---------------|-----------------|
| **Tela** | Screenshots + OCR | Ver o que você vê |
| **Voz** | Transcrição + Contexto | Entender o PORQUÊ |
| **Ações** | Cliques + Digitação | Saber O QUE fazer |
| **Anotações** | Destaques + Notas | Ênfase manual |

### 2. Detecção Inteligente

**Variáveis** — Detecta automaticamente:
- "o nome **do cliente**" → `{customer_name}`
- Campo de texto preenchido → variável de input

**Condicionais** — Identifica decisões:
- "**se** for ativo, **então**..." → workflow condicional
- Múltiplos caminhos demonstrados → branches no skill

**Contexto** — Preserva explicações:
- "isso é importante porque..." → Nota na skill
- "geralmente fazemos assim..." → Best practice documentada

### 3. Validação com Human-in-the-Loop

Antes de gerar a skill final:

```
┌─────────────────────────────────────────────────────┐
│  📋 Revise os Itens Detectados                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Variáveis Detectadas:                              │
│  ☑️ {customer_name} - "João Silva"                  │
│  ☑️ {action} - "editar"                             │
│  ⬜ {department} - sugerido mas não confirmado      │
│                                                      │
│  Pontos de Confirmação:                             │
│  ☑️ Antes de salvar alterações                      │
│  ⬜ Antes de enviar email                           │
│                                                      │
│  [Confirmar e Gerar Skill]                          │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 🔌 Integrações

### Providers de LLM (40+ Suportados!)

Skill-E reutiliza a arquitetura de providers do [SidePilot](../SidePilot/) com **40+ providers**:

| Tier | Providers | Notas |
|------|-----------|-------|
| **Core** | Anthropic, OpenAI, Google | Nativos, alta qualidade |
| **Popular** | DeepSeek, Groq, Mistral, Ollama | Rápidos, alguns gratuitos |
| **Agregadores** | **OpenRouter**, Together, Fireworks | 🆓 **OpenRouter tem free tier!** |
| **Enterprise** | Bedrock, Vertex, Azure | Para produção |
| **Local** | Ollama, LMStudio | Sem custo, offline |

> **💡 Para o Hackathon**: Usamos **OpenRouter** com modelos gratuitos como `gemma-2-9b-it:free` para demonstração!

### Ferramentas Externas

| Ferramenta | Uso |
|------------|-----|
| **Context7 (MCP)** | Buscar docs de bibliotecas |
| **Whisper** | Transcrição de alta qualidade |
| **Tesseract** | OCR local |
| **Claude Code** | Consumir skills geradas |

---

## 🎯 Casos de Uso

### 1. Automação de Tarefas Repetitivas

```
Problema: Funcionário gasta 2h/dia preenchendo relatórios
Solução: Gravar demonstração → Skill → Agente executa
```

### 2. Onboarding de Sistemas

```
Problema: Novo funcionário não sabe usar o sistema interno
Solução: Skills que ensinam passo-a-passo com screenshots
```

### 3. Controle de Computador Seguro

```
Problema: Agente precisa clicar em coisas, mas pode errar
Solução: Skill com guardrails + confirmações humanas
```

### 4. Documentação Viva

```
Problema: Documentação desatualizada
Solução: Skills são a documentação + são executáveis
```

---

## 📁 Estrutura do Projeto

```
Skill-E/
├── .kiro/
│   ├── specs/                  # Especificações Kiro
│   │   ├── S01-app-core/       # Tauri, toolbar, hotkeys
│   │   ├── S02-screen-capture/ # Screenshots, window tracking
│   │   ├── S03-audio-recording/# Whisper, transcrição
│   │   ├── S04-overlay-ui/     # Anotações, desenhos
│   │   ├── S05-processing/     # OCR, step detection
│   │   ├── S06-skill-export/   # Geração SKILL.md
│   │   ├── S07-variable-detection/ # Detecção inteligente
│   │   ├── S08-llm-providers/  # 40+ providers (do SidePilot)
│   │   └── S09-context-search/ # Context7, docs lookup
│   └── steering/
├── assets/
│   └── skille_bot.PNG          # Logo do Skill-E
├── src/                        # Frontend React
├── src-tauri/                  # Backend Rust
├── DEVLOG.md                   # Log de desenvolvimento
└── README.md                   # Este arquivo
```

---

## 🚀 Começando

```bash
# Pré-requisitos
# - Rust & Cargo
# - Node.js 18+
# - pnpm

# Instalar dependências
pnpm install

# Rodar em desenvolvimento
pnpm tauri dev

# Build para produção
pnpm tauri build
```

### Configuração de API Keys

```bash
# OpenRouter (gratuito para teste)
OPENROUTER_API_KEY=sk-or-...

# Whisper (para transcrição)
OPENAI_API_KEY=sk-...

# Claude (para geração de skills)
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 📊 Diferencial Competitivo

| Feature | Skill-E | Só LLM | Gravadores Simples |
|---------|---------|--------|-------------------|
| Captura visual | ✅ | ❌ | ✅ |
| Transcrição de voz | ✅ | ❌ | ⚠️ |
| Detecção de variáveis | ✅ | ❌ | ❌ |
| Condicionais automáticos | ✅ | ❌ | ❌ |
| Guardrails de segurança | ✅ | ❌ | ❌ |
| Human-in-the-loop | ✅ | ❌ | ❌ |
| Busca de documentação | ✅ | ❌ | ❌ |
| Formato AgentSkills | ✅ | ❌ | ❌ |
| Preview e edição | ✅ | ❌ | ⚠️ |
| **40+ LLM Providers** | ✅ | ⚠️ | ❌ |

---

## 📝 Desenvolvimento

Este projeto está sendo desenvolvido para o **Kiro Hackathon** (deadline: 31 Jan 2025).

Ver [DEVLOG.md](./DEVLOG.md) para timeline e decisões.

### Specs por Prioridade

1. **S01** - App Core (MVP)
2. **S02** - Screen Capture (MVP)
3. **S03** - Audio Recording (MVP)
4. **S08** - LLM Providers (40+ do SidePilot)
5. **S05** - Processing
6. **S06** - Skill Export
7. **S07** - Variable Detection
8. **S04** - Overlay UI
9. **S09** - Context Search

---

## 📜 Licença

MIT

---

<p align="center">
  <img src="./assets/skille_bot.PNG" alt="Skill-E" width="150" />
  <br/>
  <em>"The best way to teach an AI is to show it how."</em>
</p>
