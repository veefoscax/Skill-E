Entendido. Vou preparar um relatório completo sobre as melhores práticas para escrever um MD de Skills para agentes, com foco em uma ferramenta que cria skills a partir de captura de tela e passo a passo guiado. O relatório será voltado para tarefas específicas, com exemplos e considerações para uso em diferentes LLMs, sem causar context bloat.
Em breve, trarei o relatório pronto para você.
Resumo Executivo: A documentação de skills para agentes de IA (SKILL.md) deve ser estruturada como um sistema de disclosure progressivo em três camadas, priorizando a economia de tokens (máximo de 500 linhas no corpo principal e 100 tokens no frontmatter), utilizando nomenclatura em gerúndio (ex: processing-invoices), e adotando o framework de Graus de Liberdade para calibrar a especificidade das instruções. Para geração automatizada a partir de capturas de tela, é imperativo converter elementos visuais em descrições semânticas textuais, eliminar dependências visuais através de exemplos copiáveis, e externalizar código complexo para o diretório scripts/. A ativação do skill depende de metadados otimizados que combinem função, contexto e condições de gatilho específicas, evitando descrições genéricas que causem poluição de contexto.
Best Practices for Writing Agent Skill Documentation (MD of Skills)
1.  Fundamentals and Architecture
1.1 Definition and Purpose
1.1.1 Role of SKILL.md as Agent Onboarding Guide
O arquivo SKILL.md funciona como um manual de onboarding técnico que transforma modelos de linguagem de propósito geral em especialistas de domínio capazes de executar tarefas específicas com consistência e precisão. Diferente de documentação tradicional destinada a leitores humanos, o SKILL.md é projetado para ingestão por máquinas, servindo como um contrato executável que define não apenas o que o agente deve fazer, mas também quando e como deve fazê-lo . Este arquivo atua como a interface primária entre o sistema de descoberta de skills do agente e as capacidades procedurais encapsuladas no diretório do skill, permitindo que o LLM carregue dinamicamente expertise específica apenas quando contextualmente relevante, eliminando a necessidade de injeção manual de contexto em cada interação .
A arquitetura do SKILL.md segue um padrão dual: o frontmatter YAML contém metadados essenciais para descoberta e ativação (nome, descrição, versão), enquanto o corpo em Markdown fornece instruções procedurais detalhadas, exemplos e referências a recursos externos . Esta separação estrutural é fundamental para o mecanismo de lazy loading, onde apenas os metadados (~100 tokens) permanecem residentes no contexto do sistema até que uma correspondência semântica específica dispare o carregamento completo das instruções (~2000-5000 tokens) . O documento deve ser concebido como um guia de onboarding que prepara o agente para resolver problemas específicos, fornecendo heurísticas de decisão, critérios de validação e protocolos de recuperação de erros que o modelo não possui em seu treinamento base .
1.1.2 Distinction Between General Knowledge and Procedural Skills
A distinção entre conhecimento geral e skills procedurais é um pilar arquitetural crítico para a eficácia da documentação. Conhecimento geral refere-se às capacidades linguísticas, fatos mundiais e padrões de raciocínio que LLMs modernos adquirem durante o pré-treinamento, enquanto skills procedurais encapsulam sequências específicas de ações, lógica de negócios proprietária, esquemas de dados organizacionais e integrações com sistemas externos que não estão disponíveis nos dados de treinamento públicos . O SKILL.md deve focar exclusivamente na documentação do delta procedimental—o que o modelo não pode inferir ou executar corretamente sem orientação explícita—evitando explicações redundantes de conceitos de programação gerais ou sintaxe básica que o LLM já domina .
Esta distinção manifesta-se na estrutura do conteúdo: enquanto uma base de conhecimento geral pode descrever arquiteturalmente como uma API REST funciona, um skill procedural deve especificar os endpoints exatos, headers de autenticação específicos da organização, formatos de payload obrigatórios e códigos de erro particulares do sistema em produção . O framework de Graus de Liberdade (Degrees of Freedom) emerge desta distinção, calibrando o nível de especificidade necessário: tarefas criativas podem operar com alto grau de liberdade baseado em heurísticas, enquanto operações frágeis (migrações de banco de dados, cálculos financeiros) exigem baixo grau de liberdade com scripts específicos e parâmetros minimamente variáveis . A documentação deve, portanto, concentrar-se em capturar a lógica de domínio específica, restrições de negócio e sequências obrigatórias que garantem conformidade e precisão em ambientes empresariais.
1.1.3 Integration with Automated Skill Creation Tools
A integração de ferramentas automatizadas de criação de skills, particularmente aquelas baseadas em captura de tela e gravação de passo a passo, introduz requisitos arquiteturais únicos para a geração de SKILL.md. Ferramentas automatizadas devem implementar pipelines de processamento de imagem que traduzam informações visuais bidimensionais em descrições textuais semânticas lineares, preservando a lógica procedural enquanto eliminam dependências visuais que LLMs não podem processar . Este processo de tradução requer a conversão de elementos de UI (botões, campos, menus) em identificadores semânticos funcionais—por exemplo, transformar "botão azul no canto inferior direito" em "botão 'Submit' localizado na seção de finalização do formulário" .
A arquitetura de geração automatizada deve estruturar o output em três camadas distintas: metadados otimizados (Tier 1) para descoberta, instruções procedurais (Tier 2) no corpo do SKILL.md, e recursos externalizados (Tier 3) em diretórios scripts/ e references/ . Ferramentas de captura devem identificar automaticamente oportunidades para externalização—quando um fluxo gravado excede 500 linhas ou contém lógica complexa de validação, o sistema deve gerar scripts Python/Bash no diretório scripts/ em vez de incorporar pseudocódigo extenso no markdown principal . Além disso, o sistema deve preservar a hierarquia temporal das ações capturadas como sequências lineares numeradas, evitando descrições baseadas em layout espacial ("preencher a coluna da esquerda") que se tornam frágeis quando a interface é redimensionada ou modificada .
1.2 File Structure and Anatomy
1.2.1 Required Components (SKILL.md, resources/, scripts/)
A estrutura mínima viável de um skill requer um diretório nomeado contendo obrigatoriamente um arquivo SKILL.md na raiz, acompanhado opcionalmente pelos subdiretórios scripts/, references/ (ou resources/), e assets/ . O arquivo SKILL.md serve como o ponto de entrada único, contendo frontmatter YAML válido delimitado por três hífens (---), seguido por conteúdo instrucional em Markdown. O diretório scripts/ armazena código executável (Python, Bash, Node.js) que o agente invoca quando operações determinísticas—como parsing de PDFs, cálculos matemáticos precisos ou chamadas de API com schemas rígidos—são necessárias, permitindo que o LLM delegue tarefas frágeis para código testado em vez de gerar soluções via inferência textual .
O diretório references/ contém documentação suplementar detalhada—especificações de API, esquemas de banco de dados, guias de estilo corporativos—que o agente carrega condicionalmente apenas quando necessário, seguindo o princípio de disclosure progressivo . Esta separação é crítica para a economia de tokens: enquanto o SKILL.md principal deve permanecer abaixo de 500 linhas , arquivos em references/ podem conter milhares de linhas de documentação técnica profunda que não consomem contexto até serem explicitamente solicitados durante a execução de sub-tarefas específicas . A estrutura deve manter referências de caminho relativas usando barras diretas (scripts/validate.py) para garantir compatibilidade cross-platform .
1.2.2 Optional Bundled Assets (references, templates, validation scripts)
Assets empacotados estendem a funcionalidade do skill além de simples instruções textuais, transformando-o em um toolkit operacional completo. Templates em assets/ fornecem formatos padronizados para outputs—como esqueletos de JSON para respostas de API, templates de documentação Markdown, ou arquivos de configuração XML—garantindo consistência estrutural independentemente do conteúdo gerado pelo LLM . Scripts de validação funcionam como camadas de garantia de qualidade, verificando automaticamente se os outputs do agente atendem a critérios específicos (sintaxe correta, conformidade com schemas, regras de negócio) antes que sejam entregues ao usuário ou commitados em sistemas de produção .
Para skills gerados a partir de capturas visuais, o diretório assets/ pode armazenar anotações de interface (screenshots com alt-text descritivo detalhado) e mapas de elementos UI que correlacionam identificadores visuais com nomes de campo programáticos . No entanto, deve-se priorizar a inclusão de comandos copiáveis em texto sobre imagens binárias sempre que possível, pois LLMs processam texto sequencialmente e não podem "ver" screenshots . A inclusão de assets binários deve ser justificada estritamente: se uma imagem for absolutamente necessária (diagramas de arquitetura complexos), ela deve ser acompanhada por descrições textuais comprehensivas que capturem a informação semântica essencial .
1.2.3 Directory Organization and Naming Conventions (Gerund Form Usage)
A convenção de nomenclatura para diretórios de skills utiliza predominantemente a forma gerundiva (gerúndio) para enfatizar a natureza ativa e processual da capacidade: processing-pdfs, analyzing-spreadsheets, managing-sap-business-partners . Esta convenção distingue skills de recursos estáticos (documents, data) e melhora a correspondência semântica durante a fase de descoberta, pois alinha-se com como usuários tipicamente descrevem necessidades ("preciso processar estas faturas") . O nome do diretório deve corresponder exatamente ao campo name no frontmatter do SKILL.md para prevenir erros de mapeamento no sistema de arquivos .
Nomes devem seguir o padrão kebab-case (minúsculas com hífens), limitados a 64 caracteres, e evitar abreviações obscuras a menos que sejam universalmente reconhecidas no domínio . Para organizações com múltiplos domínios, recomenda-se o uso de prefixos descritivos: finance-reconciliation, hr-onboarding, devops-deployment . A estrutura de diretórios deve ser plana—evitando aninhamento profundo—com todos os recursos acessíveis no máximo um nível abaixo do SKILL.md para facilitar referências de caminho e prevenir erros de resolução durante a execução .
1.3 Core Design Principles
1.3.1 Conciseness as Priority (Token Economy)
A economia de tokens é o princípio de design mais crítico, operando sob a premissa de que a janela de contexto é um recurso finito e compartilhado entre prompts do sistema, histórico de conversação, metadados de skills e execução atual . Cada token consumido por documentação verbosa reduz a capacidade disponível para raciocínio e geração de respostas. A diretriz rigorosa estabelece que o corpo do SKILL.md deve permanecer abaixo de 500 linhas , com o frontmatter limitado a aproximadamente 100 tokens . Esta restrição força uma edição agressiva onde cada sentença deve justificar sua inclusão respondendo à pergunta: "O modelo realmente precisa desta explicação para executar corretamente?" .
A concisão requer a eliminação de explicações de conceitos gerais que o LLM já domina, preferindo exemplos específicos sobre descrições abstratas extensas . Parágrafos devem ser quebrados em instruções atômicas curtas (menos de 200-300 palavras por bloco instrucional), utilizando listas numeradas para sequências e marcadores para opções . Quando skills crescem além do limite de 500 linhas, o conteúdo deve ser refatorado—movendo detalhes extensos para references/ ou dividindo o skill em sub-skills especializados—em vez de expandir o arquivo principal . Esta disciplina de tokenização garante que múltiplos skills possam ser carregados simultaneamente sem causar context bloat que degrada a performance do agente.
1.3.2 Appropriate Degrees of Freedom Framework
O framework de Graus de Liberdade calibra a especificidade das instruções com base na fragilidade e variabilidade da tarefa, categorizando skills em três níveis distintos :
Nível de Liberdade	Quando Usar	Estratégia de Documentação	Exemplos
Alto	Múltiplas abordagens válidas; decisões contextuais necessárias	Heurísticas textuais, princípios orientadores, critérios de avaliação	Redação criativa, design de interfaces, análise estratégica
Médio	Padrão preferido existe; variação aceitável	Pseudocódigo, scripts parametrizados, templates configuráveis	Transformações de dados, integrações de API, geração de relatórios
Baixo	Operações frágeis; consistência crítica; erros custosos	Scripts específicos, parâmetros mínimos, procedimentos rígidos	Migrações de banco de dados, transações financeiras, validações de segurança
Alto grau de liberdade aplica-se a tarefas criativas ou analíticas onde o LLM deve exercer julgamento contextual, fornecendo princípios e exemplos em vez de passos rígidos . Médio grau utiliza pseudocódigo ou scripts com parâmetros configuráveis para tarefas semi-estruturadas onde a sequência é importante mas os detalhes variam . Baixo grau é obrigatório para operações determinísticas onde desvios causam falhas—scripts devem ser invocados com parâmetros fixos, eliminando a latitude para interpretação do LLM . A escolha incorreta do grau de liberdade—como fornecer instruções textuais vagas para uma migração de banco de dados—introduz riscos inaceitáveis de inconsistência e erro.
1.3.3 Progressive Disclosure Strategy
A estratégia de disclosure progressivo implementa uma arquitetura de carregamento em três camadas que otimiza a utilização da janela de contexto :
2.  Tier 1 (Metadados): Sempre carregado (~100 tokens por skill), contendo apenas o frontmatter YAML (nome, descrição, gatilhos) para descoberta e matching semântico .
3.  Tier 2 (Instruções): Carregado condicionalmente (~2000-5000 tokens) quando o skill é ativado, contendo o corpo completo do SKILL.md com procedimentos detalhados .
4.  Tier 3 (Recursos): Carregado sob demanda durante a execução, incluindo scripts em scripts/, documentação extensa em references/, e templates em assets/ .
Esta arquitetura permite que bibliotecas de skills escalem para centenas de entradas sem degradação de performance, pois apenas os metadados leves permanecem residentes, enquanto conteúdo pesado é acessado apenas quando especificamente necessário . Para ferramentas de geração automatizada, isto implica em estruturar o output para que lógica complexa seja externalizada para Tier 3, mantendo o SKILL.md principal como um índice operacional que referencia recursos profundos apenas quando o contexto da conversa exige .
5.  Metadata and Frontmatter Optimization
2.1 Essential Metadata Fields
2.1.1 Skill Naming Conventions (Specificity and Action-Orientation)
O campo name no frontmatter YAML deve utilizar a forma gerundiva (present participle) para descrever ações contínuas: processing-invoices, analyzing-security-logs, generating-reports . Esta convenção distingue skills de recursos estáticos e melhora a correspondência semântica com consultas de usuários que tipicamente descrevem necessidades como verbos ("preciso processar estes PDFs"). O nome deve seguir o padrão kebab-case (minúsculas com hífens), limitado a 64 caracteres, e corresponder exatamente ao nome do diretório do skill .
Nomes devem ser específicos o suficiente para distinguir o skill de capacidades genéricas do LLM, evitando termos vagos como helper ou utils . Para domínios empresariais, prefixos descritivos previnem colisões de namespace: sap-create-sales-order é preferível a create-order . A especificidade no nome reduz a ambiguidade durante a fase de descoberta, garantindo que o skill seja considerado apenas quando o domínio técnico apropriado é identificado na consulta do usuário.
2.1.2 Description Crafting (Function + Context + Trigger Conditions)
O campo description é o mecanismo crítico de ativação, limitado a 1024 caracteres, e deve seguir a estrutura tripartite: Função + Contexto + Condições de Gatilho . Uma descrição eficaz comunica imediatamente o que o skill faz, quando deve ser usado, e quais palavras-chave ou cenários disparam sua ativação. Por exemplo: "Extracts text and tables from PDF documents using pdfplumber. Use when users mention PDF processing, form filling, or document parsing. Handles text extraction, table parsing, and metadata retrieval" .
Descrições devem evitar linguagem genérica como "Helps with documents" ou "Useful for data tasks" , que resultam em ativações falsas positivas. Em vez disso, devem incluir termos técnicos específicos do domínio (nomes de APIs, formatos de arquivo, códigos de transação) que servem como âncoras semânticas para o algoritmo de matching . Para skills gerados de capturas de tela, a descrição deve incorporar o nome do sistema específico (SAP, ServiceNow, Salesforce) e o processo de negócio exato demonstrado na gravação, garantindo que o skill só ative quando o contexto apropriado for detectado .
2.1.3 License and Version Control Tags
Metadados de governança incluem version (seguindo Semantic Versioning MAJOR.MINOR.PATCH) e license (identificadores SPDX como MIT, Apache-2.0) . O versionamento é essencial para gerenciar evolução de skills e dependências—um skill pode especificar min_doctl_version: "1.82.0" para garantir compatibilidade com ferramentas subjacentes . Campos adicionais como author, last_updated, e compatibility suportam auditorias de governança e gestão de ciclo de vida em ambientes empresariais .
2.2 Activation Logic and Trigger Conditions
2.2.1 Defining "When to Use This Skill" Parameters
A seção "When to Use This Skill" no corpo do SKILL.md complementa o frontmatter, fornecendo critérios detalhados de ativação através de listas específicas de cenários, intenções de usuário e estados de sistema . Esta seção deve enumerar ações concretas com verbos específicos: "Use this skill when the user needs to: extract text from PDF documents; merge multiple PDFs; fill out PDF forms programmatically" . A especificidade previne ativações indevidas que consomem tokens desnecessários.
Documentar condições negativas (quando NÃO usar) é igualmente importante: "Do not use for Word documents or Excel spreadsheets; use the document-conversion skill instead" . Para geração automatizada, a ferramenta deve analisar o pré-condições do workflow capturado—qual solicitação do usuário ou estado do sistema iniciou o procedimento—to ensure the skill activates only in applicable contexts .
2.2.2 Keyword and Context-Based Activation
Além de descrições explícitas, skills devem ser otimizados para matching semântico através da inclusão estratégica de terminologia de domínio ao longo do documento . Palavras-chave devem cobrir sinônimos e variações linguísticas comuns: um skill para migração de banco de dados deve incluir "migrate", "transfer", "schema conversion", e "database upgrade" . A ativação baseada em contexto considera o histórico da conversação e arquivos presentes no workspace, ativando skills apenas quando condições prévias específicas são atendidas .
2.2.3 Avoiding Overly Broad Trigger Conditions
Condições de gatilho excessivamente amplas—como "Helps with code" ou "Handles data"—criam colisões de skills onde múltiplas capacidades competem por ativação em consultas genéricas, degradando a precisão do sistema . O teste de especificidade útil determina que se uma descrição puder aplicar-se a mais de três outros skills na biblioteca, ela é muito ampla . Desenvolvedores devem aceitar que targeting estreito melhora a performance geral do sistema, mesmo que signifique que alguns casos limitem não disparem o skill.
2.3 Token Budget Management in Metadata
2.3.1 Keeping Frontmatter Under 100 Tokens
O frontmatter YAML deve ser mantido rigorosamente abaixo de 100 tokens (aproximadamente 75 palavras), pois estes tokens são carregados para todos os skills disponíveis durante a fase de descoberta . Isto exige a eliminação de artigos, verbos auxiliares e frases explicativas. Compare a versão ineficiente: "This is a skill that can be used to help with processing PDF documents when you need to extract text" (28 tokens) com a eficiente: "Extracts text from PDFs. Use for document parsing, text extraction" (13 tokens) .
2.3.2 Eliminating Redundant Descriptions
Redundância entre o nome e a descrição do skill desperdiça tokens valiosos. Se o nome é processing-pdfs, a descrição não deve começar com "This skill processes PDFs..."; em vez disso, deve imediatamente especificar a diferenciação: "Extracts structured data from scanned forms and digital PDFs. Use for invoice processing, survey analysis" . Metadados devem priorizar informação discriminativa—o que torna este skill único—sobre descrições genéricas de funcionalidade.
2.3.3 Hierarchical Information Prioritization
Informações no frontmatter devem seguir hierarquia de importância: nome e descrição (obrigatórios, alta prioridade), versão e licença (recomendados, média prioridade), metadados estendidos (opcionais, baixa prioridade) . Dentro da descrição, a função primária deve preceder condições de gatilho, garantindo que informações críticas para decisões de ativação apareçam primeiro, aproveitando a tendência de LLMs darem maior peso a informações no início do contexto .
6.  Body Content: Writing Effective Instructions
3.1 Instructional Style and Tone
3.1.1 Imperative and Infinitive Forms
O estilo instrucional deve empregar predominantemente o modo imperativo para ações diretas: "Extract the text", "Validate the schema", "Execute the script" . Esta forma elimina ambiguidade sobre o ator e a ação, reduzindo a carga cognitiva do modelo. O infinitivo é apropriado para descrever propósitos ou fluxos de trabalho: "To process the file: 1. Extract metadata, 2. Validate format" . Construções passivas ("The input should be validated") e modais vagos ("You might want to consider") devem ser eliminadas em favor de comandos diretos.
3.1.2 Consistent Terminology and Vocabulary
Consistência terminológica é não-negociável: se o skill referencia "API endpoints" na seção inicial, não deve alternar para "API routes" ou "service URLs" posteriormente . Um glossário de termos controlados deve ser estabelecido para domínios complexos, mapeando terminologia da interface do sistema (SAP, ServiceNow) para termos usados no skill. Para skills gerados de capturas de tela, a ferramenta deve normalizar variações de rótulos encontradas na interface (onde "Submit", "Save", e "Confirm" possam aparecer para ações similares) para um termo padrão único no documento .
3.1.3 Active Voice and Direct Address
A voz ativa ("The script validates the input") é preferível à passiva ("The input is validated by the script") pois identifica claramente o ator . O endereço direto ("You must verify the checksum") é eficaz para enfatizar restrições críticas e comportamentos obrigatórios, particularmente em seções de tratamento de erros onde ações específicas do agente são mandatórias .
3.2 Degrees of Freedom Framework
3.2.1 High Freedom: Text-Based Heuristics and Contextual Decisions
Skills de alto grau de liberdade fornecem heurísticas e frameworks de decisão para tarefas criativas ou analíticas onde múltiplas abordagens são válidas. O documento deve estabelecer critérios de avaliação e princípios orientadores: "Generate three variations of marketing copy. Evaluate each against brand voice criteria: conversational tone, technical accuracy, call-to-action clarity. Select the highest-scoring variation" . Esta abordagem aproveita as capacidades gerativas do LLM enquanto mantém padrões de qualidade através de rubricas explícitas.
3.2.2 Medium Freedom: Pseudocode and Parameterized Scripts
O grau médio utiliza pseudocódigo ou scripts parametrizados que definem estrutura algorítmica permitindo variação em detalhes: "For each user in the input list: 1) Fetch profile from /api/users/{id}, 2) Check if 'subscription' field equals 'active', 3) If active, append to output list" . Scripts externos com parâmetros configuráveis (ex: process_csv(input_file, output_format)) encapsulam padrões comuns enquanto permitem adaptação a inputs variáveis .
3.2.3 Low Freedom: Specific Scripts with Minimal Parameters (Fragile Operations)
Operações frágeis—transações financeiras, migrações de banco de dados, cálculos de segurança—exigem scripts específicos com parâmetros mínimos: "Execute script validate_transaction.py with arguments: --amount {amount} --currency {currency}. Do not proceed if script returns non-zero exit code" . A documentação reduz-se a quando invocar o script e como interpretar resultados, eliminando latitude interpretativa que poderia introduzir erros críticos.
3.3 Step-by-Step Structuring
3.3.1 Breaking Complex Tasks into Atomic Steps
Workflows complexos devem ser decompostos em passos atômicos—ações discretas e verificáveis individualmente. Cada passo deve representar uma única unidade lógica: "Step 1: Parse the input JSON to extract the user_id field. Step 2: Query the database for records matching user_id" , em vez de ações compostas como "Parse and query the database". Esta atomicidade facilita recuperação de erros e rastreamento de progresso.
3.3.2 Using Checklists for Multi-Stage Processes
Processos multi-estágio beneficiam-se de checklists formatados em Markdown (- [ ] Step description) que o agente pode utilizar para acompanhar progresso . Estrutura recomendada:
Stage 1: Preparation
•  [ ] Verify input file exists and is readable
•  [ ] Confirm output directory has write permissions
•  [ ] Check API endpoint accessibility
Esta formatção cria pontos de verificação explícitos que previnem omissão de etapas críticas em workflows longos .
3.3.3 Conditional Workflows and Decision Trees
Workflows condicionais devem usar estruturas IF-THEN-ELSE explícitas: "Check file extension. If .csv: proceed to CSV processing branch. If .json: proceed to JSON processing branch. If other: log error and terminate" . Árvores de decisão complexas devem ser externalizadas para arquivos em references/ quando excedem dois níveis de aninhamento, mantendo o fluxo principal linear e legível .
3.3.4 Short Sentence Structure (Under 200-300 Words per Instruction Block)
Blocos de instrução devem ser concisos, com sentenças curtas (15-20 palavras) e parágrafos limitados a 200-300 palavras para prevenir sobrecarga cognitiva  . Instruções densas aumentam a probabilidade de etapas serem ignoradas ou mal interpretadas. A estrutura deve priorizar listas numeradas e marcadores sobre prosa extensa.
3.4 Handling Edge Cases and Variations
3.4.1 Explicit Error State Documentation
Estados de erro devem ser documentados explicitamente com sintomas reconhecíveis, causas raiz e procedimentos de recuperação: "401 Unauthorized → Check authentication credentials and token expiration; 429 Too Many Requests → Implement exponential backoff with 2-second initial delay; 500 Server Error → Log error and retry maximum 3 times" . A documentação deve categorizar erros como transitórios (retentativas apropriadas), persistentes (notificação ao usuário) ou críticos (aborto imediato) .
3.4.2 Alternative Path Documentation
Caminhos alternativos válidos (não apenas recuperação de erros) devem ser documentados: "Approach A (Direct API): Use when processing fewer than 1000 records. Approach B (Batch Processing): Use when processing 1000+ records" . Cada alternativa deve incluir critérios de seleção claros para permitir que o agente escolha apropriadamente baseado em condições de runtime.
3.4.3 Input Validation Criteria
Critérios de validação de input devem especificar tipos de dados, formatos aceitáveis e restrições: "Input parameters: (1) user_id: string, 8-32 alphanumeric characters, (2) amount: decimal, positive, max 999999.99, (3) currency: enum ['USD', 'EUR', 'GBP']" . Exemplos de inputs válidos e inválidos devem ser fornecidos para reduzir ambiguidade sobre condições de fronteira.
4. From Visual Capture to Textual Representation
4.1 Screenshot Translation Methodologies
4.1.1 Converting Visual UI Elements to Semantic Descriptions
Ferramentas de captura automatizada devem traduzir elementos visuais em descrições semânticas funcionais em vez de descrições visuais espaciais. Um botão não deve ser descrito como "botão azul no canto inferior direito", mas como "Primary Action Button: labeled 'Submit Order', triggers order creation workflow" . A extração deve identificar: tipo de elemento (botão, campo, dropdown), rótulo/identificador textual, estado atual (habilitado/desabilitado), e ação funcional resultante.
4.1.2 Sequential Processing vs. Visual Layout Parsing
LLMs processam texto sequencialmente, não espacialmente. Portanto, workflows capturados visualmente devem ser reestruturados em sequências lineares temporais: "Step 1: Locate the 'Settings' menu item. Step 2: Click 'Settings' to expand submenu. Step 3: Select 'API Keys' from submenu" , em vez de descrições baseadas em layout ("os campos na coluna da esquerda"). Esta linearização garante que o agente compreenda dependências temporais entre ações.
4.1.3 Extracting Actionable Text from Interface Captures
A extração deve preservar textos de ação exatos—rótulos de botões, placeholders de campos, mensagens de erro—pois estas strings servem como identificadores para interação automatizada: "Input Field: Username (required, text, max 50 chars); Input Field: Password (required, masked, min 8 chars); Button: Submit (primary action)" . Textos dinâmicos que indicam estado do sistema (ex: "Processing...", "Complete", "Error: [message]") devem ser catalogados para permitir verificação de estado durante execução.
4.2 Structured Data Extraction
4.2.1 Identifying Click Targets and Input Fields
Elementos interativos devem ser mapeados com identificadores estruturados: tipo, localização contextual, e atributos funcionais. Exemplo: "Target: 'Export Data' button, located in top-right toolbar of Data Grid section, icon: download arrow" . Para campos de input: "Field: 'Search Query', type: text input, location: top of results table, placeholder: 'Search by name or ID', validation: minimum 3 characters" .
4.2.2 Documenting Navigation Paths Textually
Caminhos de navegação devem ser documentados como sequências textuais explícitas: "Navigation Path: Main Menu > Products > Inventory > Stock Levels. Alternative: Quick Access > Inventory Dashboard > Stock Levels tab" . Breadcrumbs devem ser utilizados como mecanismos de verificação: "Verify current location via breadcrumb: Home > Products > Inventory > Stock Levels" .
4.2.3 Preserving Spatial Relationships in Linear Text
Relações espaciais que carregam significado semântico devem ser preservadas através de descrições textuais hierárquicas: "The 'Advanced Options' section appears below the 'Basic Settings' form. Scroll down or click 'Show Advanced' to reveal additional configuration fields" . Agrupamentos lógicos devem ser indicados através de headers de seção: "### Section: Contact Information [Fields: Name, Email, Phone] ### Section: Address Information [Fields: Street, City, ZIP]" .
4.3 Avoiding Visual Dependencies
4.3.1 Replacing Screenshots with Copyable Command Examples
A regra cardinal é eliminar dependências visuais. Screenshots devem ser substituídos por exemplos de comandos copiáveis: "Execute: npm install --save-dev typescript @types/node" com output esperado: "Expected output: 'added 2 packages, and audited 150 packages in 3s'"  . Para ações GUI sem equivalente CLI, fornecer sequências textuais precisas: "Step 1: Click menu 'File' → Step 2: Click 'Preferences' → Step 3: Click 'Settings'" .
4.3.2 Using Alt-Text for Essential Images Only
Quando imagens são absolutamente necessárias (diagramas complexos), devem ser acompanhadas de alt-text comprehensivo descrevendo conteúdo semântico, não apenas aparência visual: "Alt-text: Dashboard displaying three metrics: CPU utilization at 78% (red threshold), Memory usage at 45% (green), Disk I/O at 120 MB/s (yellow warning)" . Imagens decorativas devem ser eliminadas inteiramente.
4.3.3 Semantic Headers and Bullet Points for Hierarchy
Hierarquia visual deve ser convertida em estrutura semântica Markdown: headers (#, ##, ###) para seções, bullets para listas paralelas, números para sequências. Esta estruturação semântica permite que LLMs parseiem a organização do documento sem depender de cues visuais  .
5. Context Management and Progressive Disclosure
5.1 Three-Tier Loading System
5.1.1 Level 1: Metadata (Always Loaded)
O Tier 1 consiste exclusivamente do frontmatter YAML (nome, descrição, tags), consumindo aproximadamente 50-100 tokens por skill, carregado persistentemente para permitir descoberta rápida  . Para uma biblioteca de 50 skills, isto consome ~5,000 tokens—overhead aceitável para manter consciência de capacidades disponíveis.
5.1.2 Level 2: SKILL.md Body (Conditionally Loaded)
O Tier 2 ativa quando o skill é selecionado, carregando o corpo completo do SKILL.md (~2,000-5,000 tokens) contendo instruções procedurais detalhadas  . Este carregamento condicional previne poluição de contexto com instruções irrelevantes para a tarefa atual.
5.1.3 Level 3: Bundled Resources (On-Demand Loading)
O Tier 3 inclui scripts, documentação extensa em references/, e templates em assets/, carregados apenas quando explicitamente referenciados durante execução  . Esta arquitetura permite acesso a volumes ilimitados de informação profunda sem impactar o contexto inicial.
5.2 Conciseness Techniques
5.2.1 The 500-Line Maximum Rule
O arquivo SKILL.md principal deve ser mantido estritamente abaixo de 500 linhas  . Exceder este limite indica necessidade de refatoração—externalizar conteúdo para references/ ou dividir em sub-skills especializados.
5.2.2 Challenging Every Piece of Information (Token Justification)
Cada elemento deve ser submetido ao teste: "O modelo realmente precisa disto?" . Informações inferíveis do conhecimento geral do LLM devem ser eliminadas. Preferir exemplos concisos sobre explicações teóricas extensas .
5.2.3 Preferring Examples Over Explanations
Exemplos concretos comunicam requisitos mais eficientemente que descrições abstratas. Um exemplo bem construído de input/output válido frequentemente substitui múltiplos parágrafos de especificação textual  .
5.3 Resource Bundling Strategies
5.3.1 Externalizing Large Code Blocks to Scripts/
Blocos de código complexos devem residir em scripts/ em vez do SKILL.md. A instrução reduz-se a: "Execute scripts/process_data.py with input file path. Handle exit codes: 0 (success), 1 (validation error)" . Esta separação mantém o SKILL.md focado em lógica de workflow enquanto preserva acesso a implementações precisas.
5.3.2 Reference Materials and Schema Documentation
Materiais de referência volumosos (esquemas de API, documentação técnica profunda) pertencem a references/, carregados via comandos explícitos: "For field definitions, consult references/edi_837_schema.md" . Esta prática previne que documentação extensa consuma tokens durante invocações que não requerem aquele conhecimento específico.
5.3.3 Avoiding Deeply Nested References (One-Level Deep Rule)
Referências devem ser mantidas no máximo um nível de profundidade a partir do SKILL.md para prevenir cadeias complexas de carregamento que fragmentam atenção do modelo . Estruturas flat facilitam manutenção e garantem que recursos sejam carregados completamente quando necessário.
5.4 Modular Design Patterns
5.4.1 Splitting Monolithic Skills into Specialized Sub-Skills
Skills monolíticos que tentam cobrir múltiplos domínios devem ser decompostos em skills especializados focados. Em vez de web-development abrangente, separar em building-frontend-components, configuring-apis, e managing-database-schemas . Esta modularização melhora a precisão de ativação e permite composição de workflows complexos através de encadeamento de skills.
5.4.2 Cross-Referencing Between Skills
Skills podem referenciar outros skills para evitar duplicação: "For advanced configuration options, see the Configuring Advanced Permissions skill" . No entanto, referências cruzadas devem ser usadas parcimoniosamente para evitar grafos de dependência complexos que confundam o agente.
5.4.3 Table of Contents for Complex Skills
Para arquivos de referência excedendo 100 linhas, incluir tabela de conteúdos no início permite navegação eficiente: "## Table of Contents: 1) Setup, 2) Core Logic, 3) Validation" . Esta estruturação facilita localização rápida de seções relevantes sem processamento de documentos inteiros.
6. Cross-LLM Compatibility and Specificity
6.1 Universal Formatting Standards
6.1.1 Markdown Structure for Maximum Parseability
O formato Markdown padrão (ATX headers, listas, code blocks) garante parseabilidade universal across diferentes implementações de LLM . Evitar HTML embutido ou formatação proprietária que possa ser stripada ou mal interpretada por parsers específicos.
6.1.2 Q&A Format for RAG-Optimized Retrieval
Formato Pergunta-Resposta otimiza recuperação em sistemas RAG: "Q: What if the API returns 429? A: Implement exponential backoff..." . Esta estrutura alinha-se com padrões de consulta de usuários e facilita matching semântico.
6.1.3 Semantic HTML and Structured Data Markers
Para skills que geram conteúdo web, utilizar HTML5 semântico (<article>, <section>, <header>) fornece cues estruturais adicionais para agentes que processam conteúdo web .
6.2 Platform-Specific Adaptations
6.2.1 Claude Code Specifics (CLAUDE.md Integration)
Para Claude Code, skills podem referenciar arquivos CLAUDE.md para contexto de projeto: "If present, read CLAUDE.md for project-specific conventions before proceeding" . O uso da variável {baseDir} permite referências de caminho portáteis: "Read the template from {baseDir}/assets/template.html" .
6.2.2 OpenAI Agent Instructions (Function Calling Patterns)
Para agentes OpenAI, documentar explicitamente assinaturas de função esperadas: "Use the file_search function with query parameter (string) and top_n parameter (integer, default 5)" . Incluir exemplos de schemas JSON para parâmetros de ferramentas.
6.2.3 Generic LLM Fallback Strategies
Estratégias de degradação graciosa garantem funcionalidade em ambientes limitados: incluir "Modo Manual" onde o agente fornece comandos para execução manual pelo usuário quando ferramentas automáticas estão indisponíveis .
6.3 Multi-Model Optimization
6.3.1 Identifying Model-Specific Capabilities
Reconhecer capacidades específicas (Claude para análise de código, GPT-4 para raciocínio, Gemini para multimodalidade) permite otimizações condicionais: "If using Claude 3.5 Sonnet, use the computer use tool for visual verification" .
6.3.2 Graceful Degradation for Limited Context Windows
Manter conjuntos de instruções essenciais encurtados para modelos com janelas de contexto limitadas, garantindo que regras de segurança e validação apareçam nas primeiras linhas do documento  .
6.3.3 Formatting for Sequential Text Processing
Estruturar para processamento sequencial: evitar referências a "seção acima" ou "parágrafo anterior"; usar referências explícitas de seção: "As specified in the 'Input Validation' section..." .
7. Examples, Templates, and Patterns
7.1 High-Freedom Skill Template
name: creative-content-generator
description: Generates marketing copy based on brand voice. Use for blog posts, social media, email campaigns requiring tone adaptation.
Creative Content Generator
Context Gathering
Before writing, confirm:
•  Target Audience: Demographics, pain points
•  Brand Voice: Formal, casual, playful (reference brand-guidelines.md)
•  Content Goal: Awareness, conversion, education
Heuristic Framework
Tone Calibration
•  Technical Audience: Use industry jargon, data-driven arguments
•  General Consumer: Use accessible language, emotional appeals
•  Executive Audience: Use strategic framing, ROI focus
Process
1.  Analyze provided text against evaluation criteria
2.  Identify weaknesses (vague language, passive voice)
3.  Generate 2-3 alternative versions
4.  Select best version based on criteria
5.  Provide rationale for changes
Constraints
•  Maintain original factual claims
•  Preserve approximate length (±20%)
•  Match user-specified tone
7.2 Low-Freedom Skill Template
name: processing-stripe-refunds
description: Processes refund requests through Stripe API. Use ONLY when user explicitly requests refund and provides transaction ID.
Stripe Refund Processing
Prerequisites
•  Valid Stripe API key in STRIPE_SECRET_KEY
•  Transaction ID starting with 'pi_' or 'ch_'
•  Refund amount (if partial) or 'full' keyword
Procedure
1.  Validate transaction ID format: ^(pi_|ch_)[a-zA-Z0-9]+$
2.  Execute: stripe refunds create --charge={transaction_id} --amount={amount}
3.  Capture refund ID from response field 'id'
4.  Log: Append '{timestamp},{transaction_id},{refund_id},{amount}' to logs/refunds.csv
5.  Return confirmation: 'Refund processed. ID: {refund_id}'
Error Handling
•  'No such charge': Verify ID correctness, retry once
•  'Insufficient funds': Escalate to finance team
•  Non-zero exit code: Abort, do not retry
7.3 Complex Workflow Examples
7.3.1 Multi-Step Business Process Automation
Exemplo de workflow SAP complexo:
Step 1: Execute VA01 (Create Sales Order)
•  Input: Customer ID, Material codes, Quantities
•  Validation: Check credit limit via scripts/check_credit.py
Step 2: If credit check passes
•  Save order, capture order number
•  Trigger delivery creation (VL01N)
Step 3: If credit check fails
•  Hold order status
•  Notify sales representative via email template
7.3.2 Error Handling and Recovery Patterns
Padrão de recuperação em três camadas:
1.  Retry: Para erros transitórios (timeout, 429), tentar 3x com backoff exponencial
2.  Fallback: Para falhas persistentes, usar caminho alternativo documentado
3.  Escalation: Para erros críticos, abortar e notificar usuário humano
7.3.3 Integration with External Tools and MCP
Integração com Model Context Protocol (MCP):
•  Especificar ferramentas externas disponíveis via MCP no frontmatter: allowed-tools: [file_search, code_interpreter]
•  Documentar schemas de parâmetros para chamadas MCP
•  Incluir validação de resultados MCP antes de prosseguir com workflow
4.  Quality Assurance and Maintenance
8.1 Review and Validation Processes
8.1.1 Code Review Analogies for Documentation
Aplicar práticas de code review à documentação de skills: revisões por pares verificando clareza, concisão, e cobertura de casos de borda. Checklist de revisão deve incluir: verificação de limites de tokens, validação de caminhos de arquivo, teste de condições de gatilho contra consultas de exemplo.
8.1.2 Testing Skills with Edge Case Inputs
Testar skills com inputs de casos limite: strings vazias, valores nulos, caracteres especiais, e volumes extremos de dados. Verificar se o skill lida graciosamente com falhas de dependências externas (APIs indisponíveis, arquivos inexistentes).
8.1.3 Verification Criteria and Expected Outputs
Definir critérios de verificação objetivos para outputs do skill: schemas JSON específicos, formatos de arquivo obrigatórios, ou palavras-chave que devem aparecer em respostas. Utilizar scripts de validação automatizados para verificar conformidade.
8.2 Versioning and Evolution
8.2.1 Tracking Changes in Skill Definitions
Manter changelog documentando alterações em campos de frontmatter, modificações em procedimentos, e adições de novos recursos. Versionamento semântico (MAJOR.MINOR.PATCH) comunica breaking changes vs. adições de funcionalidade .
8.2.2 Deprecation Strategies for Outdated Skills
Estratégia de depreciação suave: marcar skills obsoletos com deprecated: true no frontmatter, incluir mensagens de migração para skills substitutos, e manter disponibilidade por período de transição antes da remoção completa.
8.2.3 Migration Paths for Skill Updates
Documentar caminhos de migração quando breaking changes são introduzidos: scripts de conversão de formatos de input, mapeamentos de parâmetros antigos para novos, e instruções de atualização para usuários do skill.
8.3 Performance Optimization
8.3.1 Monitoring Token Usage per Skill Invocation
Implementar monitoramento de tokens para rastrear consumo por skill: metadados (Tier 1) vs. instruções (Tier 2) vs. recursos (Tier 3). Identificar skills que consistentemente excedem orçamentos de contexto para refatoração.
8.3.2 Lazy Loading Implementation
Garantir implementação rigorosa de lazy loading: verificar que arquivos em references/ só são lidos quando explicitamente necessários, não durante a fase de planejamento inicial. Utilizar padrões de referência como See FORMS.md references/FORMS.md for advanced options .
8.3.3 Context Window Impact Assessment
Realizar avaliação de impacto em janelas de contexto: calcular o "token tax" total quando múltiplos skills são carregados simultaneamente. Otimizar através da consolidação de skills relacionados ou externalização agressiva de conteúdo para Tier 3.
