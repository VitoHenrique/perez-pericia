# Documento de Refatoração e Novas Funcionalidades - Perez Perícia

Este documento detalha as alterações e novas funcionalidades solicitadas pelo cliente Fernando Perez para o sistema de gestão pericial. Ele serve como um guia completo para a equipe de desenvolvimento, abrangendo desde a modelagem de dados até a lógica de interface e integração com serviços externos.

---

## 1. Adição de Imagens no Cadastro de Processos (Assinatura e Envelope)

**Requisito:** Adicionar campos para upload de imagens de assinatura e envelope no cadastro de processos.

### Modelagem de Dados (Prisma)

O modelo `Processo` será expandido para incluir campos para as URLs das imagens:

```prisma
// prisma/schema.prisma

model Processo {
  // ... outros campos existentes

  imagemAssinaturaUrl String?     // URL da imagem da assinatura
  imagemEnvelopeUrl   String?     // URL da imagem do envelope

  // ...
}
```

### Lógica de Implementação

*   **Frontend:** Adicionar componentes de upload de arquivo na interface de cadastro/edição de processos. Utilizar bibliotecas de UI (como Shadcn/UI) para um design consistente.
*   **Backend (API):** Criar endpoints para o upload seguro dessas imagens para um serviço de armazenamento em nuvem (ex: AWS S3, Cloudinary). Após o upload, a URL da imagem deve ser salva no campo correspondente no modelo `Processo`.

---

## 2. Ajustes Geográficos: Vara e Comarca Separadas com Dados Pré-Salvos

**Requisito:** Separar os campos `Vara` e `Comarca`, permitindo a seleção de dados pré-salvos para municípios com fórum em SP, PR, MS e GO, e numeração de varas de 1 a 30.

### Modelagem de Dados (Prisma)

Serão criados três novos modelos para gerenciar a estrutura geográfica:

#### Modelo `Estado`

```prisma
// prisma/schema.prisma

model Estado {
  id        String      @id @default(cuid())
  nome      String      @unique // Ex: "São Paulo", "Paraná"
  sigla     String      @unique // Ex: "SP", "PR"
  comarcas  Comarca[]

  @@map("estados")
}
```

#### Modelo `Comarca` (Município com Fórum)

```prisma
// prisma/schema.prisma

model Comarca {
  id        String      @id @default(cuid())
  nome      String      // Nome do município/comarca (Ex: "São Paulo", "Curitiba")
  estadoId  String
  estado    Estado      @relation(fields: [estadoId], references: [id])
  varas     Vara[]
  processos Processo[]

  @@unique([nome, estadoId])
  @@map("comarcas")
}
```

#### Modelo `Vara`

```prisma
// prisma/schema.prisma

model Vara {
  id          String      @id @default(cuid())
  nome        String      // Ex: "1ª Vara Cível", "Vara da Fazenda Pública"
  comarcaId   String
  comarca     Comarca     @relation(fields: [comarcaId], references: [id])
  processos   Processo[]

  @@unique([nome, comarcaId])
  @@map("varas")
}
```

O modelo `Processo` será atualizado para referenciar esses novos modelos:

```prisma
// prisma/schema.prisma

model Processo {
  // ... outros campos existentes

  varaId              String
  comarcaId           String
  vara                Vara        @relation(fields: [varaId], references: [id])
  comarca             Comarca     @relation(fields: [comarcaId], references: [id])

  // ...
}
```

### Lógica de Implementação

*   **Seed Inicial de Dados:** Criar um script de `seed` para popular as tabelas `Estado`, `Comarca` e `Vara` com os dados dos 4 estados (SP, PR, MS, GO) e seus respectivos municípios com fórum e varas (numeradas de 1 a 30, conforme solicitado).
*   **Frontend:** Implementar dropdowns encadeados na interface de cadastro/edição de processos: selecionar o Estado, que filtra as Comarcas, que por sua vez filtram as Varas.

---

## 3. Adição de Novos Tipos de Perícia

**Requisito:** Adicionar os tipos `Grafotécnica`, `Papiloscópica`, `Acidente de Trânsito` e `Digital` ao campo `Tipo de Perícia`.

### Modelagem de Dados (Prisma)

Recomenda-se o uso de um `enum` para garantir a consistência e validação dos dados:

```prisma
// prisma/schema.prisma

enum TipoPericia {
  GRAFOTECNICA
  PAPILOSCOPICA
  ACIDENTE_TRANSITO
  DIGITAL
  // Adicione outros tipos conforme necessário
}

// No modelo Processo, o campo seria:
// tipoPericia TipoPericia
```

### Lógica de Implementação

*   **Frontend:** Atualizar o dropdown de `Tipo de Perícia` na interface de cadastro/edição para incluir as novas opções.

---

## 4. Geração de Relatórios Mensais e PDFs de Processos

**Requisito:** Gerar um relatório mensal de atividades de usuários e PDFs detalhados para processos individuais.

### 4.1. Relatório Mensal de Atividades de Usuários

*   **Fonte de Dados:** Modelo `ActivityLog` (já existente) e `User`.
*   **Conteúdo:** Data/Hora, Usuário, Tipo de Ação (Criado, Editado, Removido, Movido, etc.), Entidade Afetada, ID da Entidade, Detalhes.
*   **Lógica de Geração:**
    *   **Endpoint de API:** `/api/reports/monthly-activity` (aceita `ano` e `mes`).
    *   **Consulta:** Prisma para `ActivityLog` filtrando por período e incluindo `User`.
    *   **Formato de Saída:** CSV (para análise) e/ou PDF (para formalização).

### 4.2. Geração de PDF de Processo

*   **Trigger:** Botão "Gerar PDF" na página de detalhes do processo.
*   **Conteúdo:** Todos os dados do processo (número, datas, valores, resumo, imagens, vara, comarca, estado, etc.).
*   **Lógica de Geração:**
    *   **Endpoint de API:** `/api/processos/[id]/pdf`.
    *   **Consulta:** Prisma para buscar `Processo` e seus relacionamentos.
    *   **Biblioteca:** `html-pdf` ou `pdf-puppeteer` (Node.js) para converter um template HTML/CSS em PDF.
    *   **Template:** HTML/CSS formatado no estilo "Coursue" para exibir os dados do processo.
    *   **Retorno:** Arquivo PDF para download.

---

## 5. Estudo de Integração de IA de Pesquisa no Portal eSAJ/TJMS

**Requisito:** Estudar a viabilidade de adicionar IA de pesquisa no portal eSAJ do TJMS (`https://esaj.tjms.jus.br/cdje/index.do`).

### Desafios e Abordagem

*   **Desafio:** Ausência de API pública e possíveis restrições de acesso (conexão falhou no teste).
*   **Abordagem:** Combinação de automação web (web scraping) e Processamento de Linguagem Natural (PLN) via IA.

### Componentes da Solução

#### 5.1. Backend: Automação Web e Extração de Dados

*   **Biblioteca:** **Puppeteer (Node.js)** para simular interação humana (navegação, preenchimento de formulários, cliques) no portal eSAJ/TJMS.
*   **Fluxo:** Navegar até a URL, preencher campos de busca (número do processo, nome da parte, período), submeter e extrair o conteúdo relevante dos resultados.
*   **Tratamento:** Resiliência a mudanças no site e, potencialmente, integração com serviços de resolução de Captchas (se necessário).

#### 5.2. Backend: Processamento de IA (PLN)

*   **Modelo de Linguagem (LLM):** Utilizar um LLM (ex: Gemini, OpenAI) para processar o texto bruto extraído.
*   **Funcionalidades:** Resumir documentos, extrair entidades (datas, nomes, valores, prazos), classificar movimentações.

#### 5.3. Frontend: Interface de Pesquisa

*   **UI:** Campo de busca intuitivo, filtros avançados e exibição clara dos resultados processados pela IA, com links para os documentos originais.

### Considerações de Implementação

*   **Legalidade:** Verificar termos de uso do TJMS para web scraping.
*   **Manutenção:** Necessidade de manutenção contínua devido a possíveis mudanças na estrutura do portal.
*   **Performance e Custo:** Otimizar scripts e considerar custos de Captcha/LLM.

---

## Próximos Passos e Prompts para o Agente

Com base neste documento, o agente de desenvolvimento deverá:

1.  **Aplicar Migrações do Prisma:** Gerar e aplicar as migrações para os novos modelos `Estado`, `Comarca`, `Vara` e os campos de imagem no `Processo`, além do `enum TipoPericia`.
2.  **Desenvolver Lógica de Upload de Imagens:** Implementar a funcionalidade de upload de `imagemAssinaturaUrl` e `imagemEnvelopeUrl` para um serviço de armazenamento em nuvem.
3.  **Implementar Seed de Dados Geográficos:** Criar e executar um script de `seed` para popular as tabelas `Estado`, `Comarca` e `Vara` com os dados dos 4 estados (SP, PR, MS, GO) e suas respectivas informações.
4.  **Atualizar UI de Cadastro de Processos:** Refatorar a interface de cadastro/edição de processos para incluir os campos de upload de imagem e os dropdowns encadeados para seleção de Estado, Comarca e Vara.
5.  **Desenvolver Geração de Relatórios:** Criar o endpoint e a lógica para o relatório mensal de atividades de usuários (CSV/PDF).
6.  **Desenvolver Geração de PDFs de Processos:** Implementar o endpoint e a lógica para gerar PDFs detalhados de processos individuais.
7.  **Estudar e Prototipar Integração eSAJ/TJMS:** Iniciar o estudo e prototipagem da automação web com Puppeteer e a integração com LLM para a pesquisa inteligente no portal eSAJ/TJMS.

Todas as implementações devem seguir rigorosamente o **Guia de Estilo Mestre "Coursue"** e as **Diretrizes de Temas (Dark/Light Mode)** previamente definidas, garantindo uma experiência de usuário consistente e de alta qualidade.
