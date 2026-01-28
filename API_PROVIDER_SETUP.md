# API Provider Setup Guide

Guia de configuração das APIs suportadas pelo Skill-E.

---

## Provedores Suportados

### 1. Zhipu AI (智谱AI) - GLM-4

**Website**: https://open.bigmodel.cn (China) / https://z.ai (Internacional)

**Modelos Disponíveis**:
- `glm-4` - Modelo principal (recomendado)
- `glm-4v` - Com suporte a visão
- `glm-4-air` - Versão rápida
- `glm-3-turbo` - Modelo econômico

**Endpoints**:
- China: `https://open.bigmodel.cn/api/paas/v4`
- Internacional (Z.ai): `https://api.z.ai/api/paas`

**Como obter API Key**:
1. Acesse https://open.bigmodel.cn
2. Crie uma conta
3. Vá em "API Keys" ou "开发者中心"
4. Gere uma nova chave

**Uso no Skill-E**:
```typescript
import { createProviderSimple } from '@/lib/llm';

const provider = createProviderSimple('zhipu', 'sua-api-key-aqui');

const result = await provider.generate(prompt, {
  model: 'glm-4',
  maxTokens: 2000,
});
```

**Preços** (aproximado):
- GLM-4: ~¥0.1/1K tokens
- GLM-3-Turbo: ~¥0.01/1K tokens

---

### 2. Moonshot AI - Kimi K2

**Website**: https://platform.moonshot.cn (China) / https://www.moonshot.ai (Global)

**Modelos Disponíveis**:
- `moonshot-v1-8k` - Contexto 8K
- `moonshot-v1-32k` - Contexto 32K
- `moonshot-v1-128k` - Contexto 128K
- `kimi-k2-0711-preview` - Modelo K2 com thinking

**Endpoints**:
- Global: `https://api.moonshot.ai/v1`
- China: `https://api.moonshot.cn/v1`

**Como obter API Key**:
1. Acesse https://platform.moonshot.cn
2. Faça login (pode usar GitHub)
3. Vá em "API Key Management"
4. Crie uma nova chave

**Uso no Skill-E**:
```typescript
import { createProviderSimple } from '@/lib/llm';

const provider = createProviderSimple('moonshot', 'sua-api-key-aqui');

const result = await provider.generate(prompt, {
  model: 'moonshot-v1-8k',
  maxTokens: 2000,
});
```

**Preços** (aproximado):
- 8K context: ~¥0.012/1K tokens
- 32K context: ~¥0.024/1K tokens
- 128K context: ~¥0.06/1K tokens

**Recursos especiais**:
- Suporte a 256K contexto (em alguns modelos)
- Tool calling nativo
- Optimizado para código

---

### 3. OpenRouter

**Website**: https://openrouter.ai

**Vantagem**: Acesso a múltiplos modelos (Claude, GPT, Llama, etc) com uma única API

**Modelos Populares**:
- `anthropic/claude-3.5-sonnet`
- `openai/gpt-4o`
- `meta-llama/llama-3.1-70b`
- `google/gemini-pro`

**Endpoint**: `https://openrouter.ai/api/v1`

**Como obter API Key**:
1. Acesse https://openrouter.ai
2. Crie conta
3. Gere API key em "Keys"

**Uso no Skill-E**:
```typescript
const provider = createProviderSimple('openrouter', 'sua-api-key');

const result = await provider.generate(prompt, {
  model: 'anthropic/claude-3.5-sonnet',
  maxTokens: 2000,
});
```

**Preços**: Varia por modelo, geralmente ~20% mais caro que direto

---

### 4. OpenAI (GPT-4, GPT-4o)

**Website**: https://platform.openai.com

**Modelos**:
- `gpt-4o` - Mais recente (recomendado)
- `gpt-4o-mini` - Econômico
- `gpt-4-turbo` - Legado

**Endpoint**: `https://api.openai.com/v1`

**Como obter API Key**:
1. Acesse https://platform.openai.com
2. Crie conta e adicione cartão
3. Gere API key em "API Keys"

---

### 5. Anthropic (Claude)

**Website**: https://console.anthropic.com

**Modelos**:
- `claude-3-5-sonnet-20241022` - Recomendado
- `claude-3-opus-20240229` - Mais poderoso
- `claude-3-haiku-20240307` - Rápido

**Endpoint**: `https://api.anthropic.com/v1`

---

## Configuração no Skill-E

### Interface de Configuração

Adicione uma seção em Settings para configurar providers:

```typescript
// Em src/components/settings/Settings.tsx ou novo arquivo

interface ProviderConfig {
  provider: LLMProvider;
  apiKey: string;
  baseUrl?: string; // Opcional, para customização
  defaultModel: string;
}

// Lista de providers disponíveis
const AVAILABLE_PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic (Claude)', requiresKey: true },
  { id: 'openai', name: 'OpenAI (GPT)', requiresKey: true },
  { id: 'openrouter', name: 'OpenRouter', requiresKey: true },
  { id: 'zhipu', name: 'Zhipu AI (GLM-4)', requiresKey: true },
  { id: 'moonshot', name: 'Moonshot AI (Kimi)', requiresKey: true },
];
```

### Testando a Conexão

```typescript
import { validateProvider } from '@/lib/llm';

// Testar se a API key está válida
const isValid = await validateProvider('zhipu', 'sua-api-key');
console.log('Zhipu API válida:', isValid);
```

---

## Comparação de Preços

| Provider | Modelo | Preço (input) | Preço (output) | Observação |
|----------|--------|---------------|----------------|------------|
| Zhipu | GLM-4 | ~¥0.1/1K | ~¥0.1/1K | Chinês, bom custo-benefício |
| Zhipu | GLM-3-Turbo | ~¥0.01/1K | ~¥0.01/1K | Mais barato |
| Moonshot | v1-8k | ~¥0.012/1K | ~¥0.012/1K | Otimizado para código |
| Moonshot | v1-128k | ~¥0.06/1K | ~¥0.06/1K | Longo contexto |
| OpenAI | GPT-4o | $5/1M | $15/1M | ~¥0.15/1K output |
| Anthropic | Claude 3.5 | $3/1M | $15/1M | ~¥0.15/1K output |

*Nota: Preços convertidos aproximadamente. Verifique os sites oficiais para valores atuais.*

---

## Troubleshooting

### Erro: "Invalid API key"
- Verifique se a chave está completa (sem espaços)
- Para Zhipu: a chave deve começar com formato específico
- Para Moonshot: gere uma nova chave no painel

### Erro: "Connection timeout"
- Providers chineses (Zhipu, Moonshot) podem ter latência de fora da China
- Considere usar VPN se estiver fora da China
- OpenRouter é uma alternativa com melhor conectividade global

### Erro: "Model not found"
- Verifique se o nome do modelo está correto
- Alguns modelos podem estar em preview ou indisponíveis
- Use `provider.getModels()` para listar disponíveis

### Limites de Rate
- Zhipu: Varia por tier de conta
- Moonshot: Geralmente 10-50 req/min para contas free
- OpenRouter: Limites generosos, mas varia por modelo

---

## Recomendações

### Para custo baixo:
1. **Zhipu GLM-3-Turbo** - Muito barato, bom para tarefas simples
2. **OpenRouter + Llama** - Modelos open source gratuitos

### Para qualidade máxima:
1. **Claude 3.5 Sonnet** via OpenRouter ou direto
2. **GPT-4o** se orçamento permitir

### Para código:
1. **Moonshot Kimi** - Otimizado para código
2. **Claude 3.5 Sonnet** - Excelente em programação

### Para chinês:
1. **Zhipu GLM-4** - Treinado em chinês
2. **Moonshot Kimi** - Boa compreensão de chinês

---

## Links Úteis

- **Zhipu AI Docs**: https://open.bigmodel.cn/dev/api
- **Moonshot Docs**: https://platform.moonshot.cn/docs
- **OpenRouter Docs**: https://openrouter.ai/docs
- **OpenAI Docs**: https://platform.openai.com/docs
- **Anthropic Docs**: https://docs.anthropic.com
