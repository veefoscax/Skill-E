# Guia Definitivo para Escrever SKILL.md para Agentes de IA

A documentação de skills para agentes de IA exige uma abordagem fundamentalmente diferente da documentação tradicional de software. Você está criando um **contrato entre sistemas determinísticos e agentes não-determinísticos** — o que requer clareza absoluta, concisão estratégica e estrutura precisa. Este relatório sintetiza pesquisas da Anthropic, OpenAI, LangChain, MCP e dezenas de repositórios bem-documentados para estabelecer as melhores práticas definitivas.

A conclusão central é clara: **menos é mais, mas esse "menos" deve ser exatamente a informação certa**. Documentação verbosa não apenas desperdiça tokens — ela degrada ativamente a performance do agente. O Berkeley Function-Calling Leaderboard demonstra que todo modelo performa pior quando apresentado a mais ferramentas. A solução está em documentação cirurgicamente precisa.

---

## Estrutura e organização que os frameworks validam

A estrutura canônica de um arquivo SKILL.md, derivada do repositório oficial da Anthropic (40.2k+ stars), segue um padrão consistente validado em produção:

```markdown
---
name: meu-skill-name
description: Descrição clara do que o skill faz E quando usá-lo.
---

# Nome do Skill

[Instruções que o agente seguirá quando este skill estiver ativo]

## Como Funciona
[2-3 frases explicando a abordagem]

## Quando Usar
- Caso de uso 1
- Caso de uso 2

## Instruções
1. Passo específico com ações
2. Passo específico com ações

## Exemplos
### Exemplo 1: Cenário
**Input:** Requisição do usuário
**Output:** Resultado esperado

## Limitações
- Limitação 1
```

**Campos obrigatórios do frontmatter YAML** são `name` (identificador único em lowercase com hífens) e `description` (descrição completa incluindo gatilhos de ativação). O campo `description` é crítico porque determina quando o agente seleciona este skill — deve incluir frases como "Use quando o usuário pedir para..." ou "Ative para tarefas de...".

A **hierarquia de diretórios** recomendada separa concerns claramente:

```
skill-name/
├── SKILL.md              # Obrigatório: Instruções e metadados
├── scripts/              # Opcional: Código executável (Python/Bash)
├── references/           # Opcional: Documentação de referência
└── assets/               # Opcional: Arquivos para output (templates)
```

A documentação oficial da Anthropic estabelece um limite crítico: **mantenha o SKILL.md abaixo de 500 linhas**. Material de referência detalhado deve ir em arquivos separados na pasta `references/`, carregados apenas quando necessário. Esta estratégia de "progressive disclosure" reduz dramaticamente o consumo de contexto.

---

## Redação clara elimina ambiguidade para o agente

A regra de ouro da Anthropic para escrever documentação de tools é pensar no modelo como "um funcionário brilhante mas completamente novo (com amnésia) que precisa de instruções explícitas". O agente não tem contexto sobre suas normas, estilos ou preferências de trabalho.

O **template universal que funciona** é surpreendentemente simples:

```
Tool to [ação atômica única]. Use when [condição específica de gatilho].
[Opcional: Uma restrição crítica se aplicável.]
```

Este padrão, validado pela Composio em produção, resultou em **~10x redução em falhas de tools** quando implementado consistentemente.

**Exemplos de descrições eficazes vs. problemáticas:**

| ❌ Ruim | ✅ Bom |
|---------|--------|
| "Esta ferramenta ajuda com buscas" | "Busca eventos no calendário por intervalo de datas. Use quando usuário perguntar sobre reuniões, compromissos ou agenda." |
| "Gerencia dados de arquivo" | "Lê conteúdo completo de um arquivo. Use para revisar código ou extrair informações. Para arquivos grandes, prefira search_file_contents." |
| "Faz coisas de email" | "Envia email com anexos opcionais. Use quando usuário solicitar envio de mensagem. Requer destinatário e assunto." |

A OpenAI impõe um **limite de 1024 caracteres** para descrições de funções — este limite existe por razões de performance comprovadas. Descrições mais longas diluem informação crítica e aumentam erros de seleção de tool.

Para **nomenclatura de tools**, todos os frameworks convergem em convenções similares:

- Use `snake_case` ou `camelCase` consistentemente
- Nomes entre **1-128 caracteres**
- Apenas caracteres: A-Z, a-z, 0-9, underscore, hífen, ponto
- Nomes **descritivos da ação**: `search_calendar_events`, não `cal_search`
- Use namespacing para tools relacionados: `github_repos_list`, `github_issues_create`

---

## Evitar context bloat é missão crítica

Pesquisas do Berkeley Function-Calling Leaderboard e do estudo NoLiMa demonstram que **performance degrada significativamente conforme o contexto aumenta**. Um único MCP server (como Playwright) pode consumir 11.7k tokens mesmo sem ser usado. O fenômeno "Lost in the Middle" mostra que modelos lutam para utilizar informação no meio de contextos longos.

**O que sempre incluir (essencial):**
- Nome do tool (snake_case consistente)
- Função central (uma frase sobre "o que faz")
- Gatilho de invocação ("quando usar")
- Restrições críticas (limites que afetam corretude)
- Parâmetros obrigatórios com tipos
- Um exemplo-chave (se formato não é óbvio)

**O que nunca incluir:**
- Detalhes de implementação que o agente não pode usar
- Explicações redundantes de funcionalidade óbvia
- Cada constraint ou edge case concebível
- Identificadores técnicos crípticos (UUIDs, códigos internos)
- Texto de preenchimento verboso ("Esta ferramenta foi projetada para ajudar...")

A técnica de **carregamento hierárquico** é especialmente eficaz para sistemas com muitos tools:

- **Nível 1**: Apenas descrições de servidor ("GitHub MCP: Ferramentas para gestão GitHub")
- **Nível 2**: Sumários de tools (carregados sob demanda)
- **Nível 3**: Definições completas (apenas ao invocar)

A abordagem RAG-MCP demonstrou **50%+ de redução em tokens** com melhoria de **43.13% vs 13.62%** em precisão de seleção de tool quando tools são filtrados dinamicamente por contexto de tarefa.

**Orçamento de tokens recomendado:**
- Tool simples: ~100 tokens (nome, descrição, 2-3 parâmetros)
- Tool complexo: ~200-300 tokens máximo
- Contexto total de tools por agente: menos de 15-20k tokens

---

## Instruções estruturadas com XML tags

XML tags funcionam como "marcadores de fronteira" que estruturam informação dentro de prompts. Segundo múltiplas fontes da Anthropic e OpenAI, elas proporcionam delineação clara entre componentes, organização hierárquica, ambiguidade reduzida e parsing melhorado pelo LLM.

**Tags recomendadas e seus usos:**

```xml
<tool_description>
Descrição concisa da função principal.
</tool_description>

<when_to_use>
- Usuário solicita encontrar documentos específicos
- Usuário precisa localizar arquivos por conteúdo
- Usuário referencia documentos que sabe existirem
</when_to_use>

<parameters>
- query (obrigatório): Termos de busca para nome/conteúdo de arquivos
- max_results (opcional, default=10): Máximo de resultados
</parameters>

<example>
User: "Encontre minha planilha de orçamento Q3"
Tool call: search_files(query="Q3 orçamento", max_results=5)
</example>

<edge_cases>
- Se busca retorna vazio: Sugerir termos mais amplos
- Se rate limit excedido: Retornar erro com tempo de espera
</edge_cases>
```

**Boas práticas para uso de XML:**
1. Seja consistente com nomes de tags e referencie-os quando discutir conteúdo
2. Aninhe tags hierarquicamente para informação estruturada complexa
3. Use nomes descritivos que indiquem claramente o propósito
4. Separe instruções, contexto, exemplos e formatação em tags distintas

A hierarquia de prioridade nas instruções deve seguir: primeiro a função principal (o que faz), depois o gatilho de uso (quando usar), seguido de parâmetros críticos, e por último restrições e edge cases. Esta ordem reflete como os modelos processam informação — o mais importante deve vir primeiro porque, como documenta o MCP, "agentes de IA podem não ler a descrição completa da ferramenta".

---

## Exemplos são imagens que valem mil palavras

A Anthropic afirma que "para um LLM, exemplos são as 'imagens' que valem mil palavras". Contudo, a quantidade e estrutura dos exemplos são críticas para eficácia sem bloat.

**Quantidade ideal de exemplos por complexidade:**

| Complexidade da Tarefa | Exemplos Necessários |
|------------------------|---------------------|
| Simples/formato óbvio | **0** (zero-shot) |
| Clarificação de formato | **1-2** |
| Padrões complexos | **3-5** |
| Domínio específico | **5-10** máximo |

Pesquisas sobre o "dilema few-shot" mostram performance ótima tipicamente com **5-20 exemplos**, com degradação além disso (efeito over-prompting). Para documentação de tools, **1-3 exemplos** embutidos nas descrições de parâmetros geralmente são suficientes.

**Estrutura de exemplo eficaz:**

```xml
<examples>
  <example>
    <user_input>Encontre reuniões com Sarah semana que vem</user_input>
    <tool_call>
      search_calendar(
        attendee="sarah@empresa.com",
        time_min="2026-02-02T00:00:00Z",
        time_max="2026-02-08T23:59:59Z"
      )
    </tool_call>
    <expected_behavior>Retorna lista de eventos correspondentes</expected_behavior>
  </example>
</examples>
```

**Princípios para exemplos eficazes:**
- Curar exemplos diversos e canônicos — não uma lista exaustiva de edge cases
- Mostrar padrões de comportamento esperado, não apenas input/output
- Incluir demonstrações de formato quando não óbvio
- Sempre acompanhar exemplos com instruções claras (Google Cloud: "Sem instruções claras, modelos podem captar padrões não intencionais")

---

## Metadados e contexto documentam capacidades reais

A documentação de capacidades e limitações deve ser explícita e estruturada. O padrão do GitHub MCP Server oferece um modelo eficaz com toolsets categorizados, permissões OAuth necessárias, e flags de modo read-only.

**Campos de metadados essenciais:**

| Campo | Propósito |
|-------|----------|
| `name` | Identificador único |
| `description` | Explicação do que faz e quando usar |
| `inputSchema` | JSON Schema definindo inputs esperados |
| `required` | Lista de parâmetros obrigatórios |

**Campos opcionais mas recomendados:**

| Campo | Propósito |
|-------|----------|
| `outputSchema` | Estrutura de retorno esperada |
| `title` | Nome amigável para display |
| `annotations.readOnlyHint` | Indica se não modifica ambiente |
| `annotations.destructiveHint` | Indica operações destrutivas |
| `annotations.idempotentHint` | Chamadas repetidas têm mesmo efeito |

**Documentação de dependências:**

```markdown
## Pré-requisitos

1. Docker instalado
2. Token de acesso pessoal do GitHub com escopos:
   - `repo` - Operações de repositório
   - `read:packages` - Acesso a imagens Docker
   - `read:org` - Acesso a times da organização

## Compatibilidade

- Versão do Protocolo: `2024-11-05`
- Versão do Servidor: `1.0.0`
- SDK mínimo: TypeScript 1.2.0+, Python 1.1.0+
```

---

## Padrões da indústria convergem em JSON Schema

Todos os frameworks principais — MCP, OpenAI, LangChain, CrewAI — convergem em **JSON Schema** como formato padrão para definições de tools. Esta é a especificação universal:

```json
{
  "name": "search_calendar_events",
  "description": "Busca eventos no calendário. Use quando usuário perguntar sobre reuniões ou agenda.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "Termos de busca (título, descrição, local, participantes)"
      },
      "time_min": {
        "type": "string",
        "description": "Início do range. RFC3339, ex: '2026-01-27T00:00:00Z'"
      },
      "time_max": {
        "type": "string",
        "description": "Fim do range. RFC3339. Default: 7 dias após time_min"
      }
    },
    "required": ["query"]
  }
}
```

**Diferenças entre frameworks:**

- **MCP**: Usa `inputSchema` e `outputSchema`, suporta `annotations` para hints comportamentais
- **OpenAI**: Usa `parameters` em vez de `inputSchema`, oferece `strict: true` para validação rígida
- **LangChain**: Deriva schema de type hints Python e docstrings, usa Pydantic BaseModel
- **CrewAI**: Segue padrão LangChain, adiciona caching inteligente com `cache_function`

A OpenAI recomenda manter menos de **~100 tools** e **~20 argumentos por tool** para performance in-distribution. A Satalia/WPP research sugere **5-10 tools por agente** máximo para clareza ideal.

---

## Testing e validação garantem qualidade

O "teste do estagiário" da OpenAI é o benchmark fundamental: **"Um estagiário consegue usar corretamente a função dado apenas o que você deu ao modelo?"** Se a resposta é não, a documentação precisa de trabalho.

**Métricas de qualidade a monitorar:**

| Métrica | Alvo |
|---------|------|
| Taxa de seleção correta de tool | >95% |
| Taxa de parâmetros corretos | >90% |
| Falhas por documentação ambígua | <5% |
| Tokens por tool definition | <300 |

**Checklist de validação:**

Para descrições de tools:
- [ ] Lidera com informação mais importante
- [ ] Usa verbos de ação (criar, buscar, atualizar, deletar)
- [ ] Especifica quando usar E quando NÃO usar
- [ ] Inclui exemplos de formato de parâmetros
- [ ] Documenta parâmetros obrigatórios vs opcionais
- [ ] Explica valores default para params opcionais

Para exemplos:
- [ ] Inclui 2-5 exemplos diversos e canônicos
- [ ] Mostra input E output esperado
- [ ] Cobre casos normais e edge cases chave
- [ ] Usa formatação consistente (XML tags recomendado)

Para tratamento de erros:
- [ ] Retorna erros em objetos de resultado (visíveis ao LLM)
- [ ] Inclui orientação de remediação acionável
- [ ] Mostra formato correto em mensagens de erro

**Padrão de erro eficaz:**

```
❌ Ruim: "Error 400: Bad Request"

✅ Bom: "Erro: Formato de data inválido. Esperado: YYYY-MM-DD. 
        Recebido: '12/25/24'. Por favor, tente novamente com formato correto."
```

---

## Conclusão

A documentação de skills para agentes de IA opera sob princípios distintos da documentação tradicional. Os frameworks líderes convergem em **cinco princípios fundamentais** que devem guiar toda criação de SKILL.md:

**Concisão é clareza** — descrições curtas e bem-elaboradas superam verbosas consistentemente. O template "Tool to X. Use when Y." provou reduzir falhas em 10x.

**Uma preocupação por tool** — tools atômicos reduzem ambiguidade. Consolide sequências sempre chamadas juntas; separe operações distintas.

**Carregamento seletivo** — injete apenas tools relevantes para a tarefa atual. RAG-MCP demonstrou 50%+ de redução com 3x melhoria em precisão.

**Tipagem forte sobre prosa** — enums e schemas JSON superam descrições longas. Um `"enum": ["celsius", "fahrenheit"]` comunica mais que parágrafos explicativos.

**Itere com métricas** — monitore taxa de falhas, tokens consumidos, e precisão de seleção. Refinamentos pequenos nas descrições podem produzir melhorias dramáticas — Claude Sonnet 3.5 alcançou state-of-the-art em SWE-bench após ajustes precisos em descrições de tools.

A evolução contínua deste campo sugere que as práticas aqui documentadas representam o estado atual da arte, mas frameworks como MCP continuam amadurecendo. O princípio permanente é: **otimize para o agente como leitor, não para humanos revisores**.