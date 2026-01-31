Melhores Práticas para Skills em Markdown para Agentes

Para criar um Skill.md claro e eficiente, priorize sempre a concisão e relevância. Cada token compete na janela de contexto do agente, portanto “assuma que seu agente já é brilhante” e inclua apenas informações que ele não possui ￼. Em outras palavras, “menos é mais”: evite explicações desnecessárias ou genéricas que desviem o modelo do foco da tarefa ￼ ￼. Use o conceito de progressive disclosure: apenas um breve metadado (nome e descrição) é carregado inicialmente (~50–100 tokens por skill), e o resto do conteúdo só entra em cena quando a skill é acionada ￼ ￼. Assim, mesmo muitos skills podem conviver sem inflar o contexto do agente ￼ ￼.

Estrutura de um Skill.md
	•	Frontmatter YAML: Comece o arquivo com um bloco YAML contendo nome e descrição da skill ￼. Esses campos são usados para descoberta do skill. Exemplos de formato:

---  
name: nome-da-skill  
description: Breve descrição do que faz e quando usar  
---  

• O nome deve ser curto (≤64 caracteres, letras minúsculas e hífens) e descritivo – prefira forma gerúndia (ex.: processando-arquivos, analisando-planilhas) ￼. Evite termos genéricos ou ambiguidades.
• A descrição é o “pitch” do skill: explique sucintamente o que ele faz e quando usar, em terceira pessoa ￼. Por exemplo: “Extrai texto de PDFs. Use quando o usuário mencionar arquivos PDF” é bem mais informativo que “Ajuda com documentos”.

	•	Permissões e Versão (se aplicável): No frontmatter inclua outros campos úteis (ex.: allowed-tools, version). Por exemplo, especifique quais ferramentas o skill usará (como Bash, Read, Write). Isso orienta o agente sobre seu ambiente de execução.
	•	Diretórios Auxiliares: Estruture os recursos do skill em subpastas planas, sem profundidade excessiva ￼. O formato recomendado é:

nome-skill/  
├ SKILL.md            # Prompt principal e instruções  
├ scripts/            # Scripts executáveis (Python, Bash)  
├ references/         # Documentação detalhada (textos carregáveis)  
└ assets/             # Templates, imagens ou outros arquivos referenciados  

	•	Mantenha a estrutura “um nível de profundidade”, para que o agente nunca precise saltar por várias camadas de links ￼. Skills profundos demais podem confundir o modelo.
	•	Use scripts/ para operações complexas e determinísticas (por exemplo, um script Python que executa vários comandos) ￼. O SKILL.md pode então instruir: “Execute python {baseDir}/scripts/analisar.py --input dados.csv e processe o resultado.”
	•	Use references/ para documentação detalhada ou grandes blocos de texto que só precisam ser lidos sob demanda ￼. Instruções no SKILL.md devem usar o comando Read para carregar esses arquivos apenas quando preciso.
	•	Use assets/ para arquivos estáticos (templates HTML/CSS, imagens, fontes) que não precisam ser lidos, apenas referenciados por caminho. Claude (ou outro agente) verá o caminho {baseDir}/assets/diagrama.png, mas não carregará o conteúdo, evitando custos de token ￼ ￼.
	•	Portabilidade: sempre use o placeholder {baseDir} para caminhos; não codifique caminhos absolutos. Isso torna o skill portátil entre máquinas e projetos ￼.

Conteúdo e Estilo
	•	Linguagem Imperativa: Escreva instruções com verbos no imperativo (“Analise o código…”, “Execute o script…”), não em segunda pessoa (“Você deve analisar…”). Isso deixa claro o que fazer e evita rodeios ￼.
	•	Etapas e Listas Ordenadas: Para fluxos de trabalho, quebre tarefas complexas em passos numerados. Por exemplo:

## Passo 1: Configuração Inicial  
1. Solicite ao usuário o tipo de projeto.  
2. Verifique se os pré-requisitos existem (versão do Python, bibliotecas instaladas).  
3. Crie a estrutura base de diretórios.  
*Espere confirmação do usuário antes de prosseguir.*  

Esse estilo “wizard” facilita a orientação passo a passo ￼. Use 1., 2., etc., dentro de cada seção para sequenciar sub-tarefas ￼. Informe ao modelo quando esperar confirmação do usuário antes de avançar, se for o caso.

	•	Brevidade e Relevância: Limite o tamanho do SKILL.md principal. Idealmente fique abaixo de algumas centenas de linhas (guia geral: <300 linhas) ￼. Foque apenas em informações essenciais para todas as tarefas que o skill atende. Se algo só importa em casos específicos, coloque em referências separadas. Geralmente quanto menor, melhor ￼ ￼.
	•	Evite Sobrecarga de Opções: Dê ao agente um caminho preferencial em vez de várias alternativas paralelas. Por exemplo, prefira “Use pdfplumber para extrair texto de PDFs” do que listar todas as bibliotecas possíveis ￼. Se houver alternativas, apresente uma padrão (e apenas em nota mencione exceções, ex.: “Para PDFs escaneados use pytesseract…”). Muitas opções podem confundir o agente ￼.
	•	Grau de Liberdade Apropriado: Ajuste o nível de detalhes conforme a sensibilidade da tarefa ￼. Para operações delicadas (e.g. migrações de banco de dados), dê comandos exatos e scripts bem definidos (“baixa liberdade”). Para tarefas mais flexíveis (e.g. geração de relatório), pode-se fornecer templates e parâmetros configuráveis (“liberdade média”) ￼. Lembre-se: quanto mais críticas as consequências de um passo em falso, mais diretivas rígidas você deve fornecer.
	•	Revisão e Iteração: Revise o skill para remover redundâncias. Por exemplo, retire explicações óbvias que o modelo já conhece (evite “O que é uma taxa de conversão?” se o agente já manipula termos do negócio) ￼. Itere com feedback real: peça a um agente auxiliar (por exemplo, outro modelo Claude ou GPT) para criar ou testar o skill em cenários reais e ajuste conforme necessário ￼ ￼.

Organização de Arquivos e Progressive Disclosure
	•	Pontos de Referência (Breadcrumbs): O arquivo SKILL.md principal deve dar “breadcrumb” para materiais mais detalhados ￼. Pense nele como a porta de entrada: fornece o contexto inicial e aponta para seções avançadas caso sejam necessárias. Por exemplo, pode incluir seções “### Recursos Adicionais” com links para outros arquivos Markdown em references/. O recomendado é manter o SKILL.md enxuto, referenciando tudo o que for extenso em arquivos separados ￼ ￼.
	•	Carregamento On-Demand: Aproveite que, no modelo de progressive disclosure, o agente só lê referências quando solicitado. Instrua o agente a usar ferramentas de leitura (e.g. Read) para carregar documentos ou guias complementares guardados em references/. Isso evita inserir textos muito longos no contexto inicial ￼. Por exemplo, em vez de colar uma seção completa sobre padrões de código, coloque essa documentação em references/padroes_codigo.md e peça para ler quando necessário.
	•	AGENTS.md e Monorepos: Em estruturas multi-projeto, você pode ter vários arquivos de documentação (e.g. um AGENTS.md raiz e outros em subdiretórios). Cada nível deve conter apenas o que é aplicável àquele escopo. O princípio é o mesmo: cada arquivo é pequeno e direciona para detalhes em locais apropriados ￼. Mantenha as orientações gerais no topo e coloque políticas específicas (como convenções de TypeScript, testes, etc.) em arquivos dedicados.
	•	Evite Lixo de Contexto: Não transforme o SKILL.md em um depósito de notas ou “todo-vale”. Use-o para instruções significativas, não para regras de estilo de código ou lembretes triviais. Por exemplo, não inclua normas de formatação de código como parte do skill – deixe essas em linters ou documentos separados ￼.

Exemplos de Formatação

Como ilustração, um SKILL.md simples pode parecer assim:

---
name: gerando-relatorio
description: Gera relatórios de vendas a partir de dados; use quando o usuário pedir "relatório" ou "vendas".
---

# Geração de Relatórios

## Passo 1: Preparar Dados
1. Leia o arquivo de dados de vendas em CSV.
2. Filtre registros de teste ou fora do período informado.
3. Gere estatísticas resumidas (média, total, etc).
*Após cada passo, aguarde confirmação do usuário para continuar.*

## Passo 2: Criar Gráficos
1. Gere um gráfico de barras mostrando vendas por região.
2. Gere um gráfico de linhas mostrando vendas ao longo do tempo.
3. Salve os gráficos nos formatos solicitados.

## Resultado
Escreva um relatório em Markdown incluindo os gráficos gerados e destaque os principais insights (ex: picos de vendas).

Neste exemplo hipotético, usamos um frontmatter conciso e instruções passo a passo claras, com listas numeradas e linguagem direta. Repare que cada seção principal (## Passo X) ordena as ações e indica pontos de decisão ao usuário.

Iteração e Feedback

Depois de escrito, teste o skill com o agente: peça ao modelo para executar tarefas específicas usando a skill e observe seu comportamento. Se o agente falhar ou ignorar alguma instrução, refine o texto. Por exemplo, o guia oficial sugere alternar entre dois papéis: use um modelo (Claude A) para escrever/refinar o skill e outro (Claude B) para testá-lo em cenários reais ￼ ￼. Reúna feedback de colegas ou por meio de uso real: ajuste a clareza do nome/descrição, reorganize etapas ou refaça explicações que não ficaram claras. Revise constantemente: se algo no skill nunca for usado pelo agente, considere removê-lo para não inflar o contexto.

⸻

Em resumo, concentre-se em skills enxutos e focados: nomes e descrições claros, instruções imperativas e divididas em passos, documentação detalhada somente em arquivos secundários, e uso criterioso de cada token ￼ ￼. Seguir esses princípios garantirá que qualquer LLM consiga descobrir e executar suas tasks sem se perder em informações irrelevantes – evitando o famoso context bloat e mantendo o agente produtivo e eficiente.