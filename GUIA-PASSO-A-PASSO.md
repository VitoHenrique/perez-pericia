# Guia Técnico de Implementação: Sistema de Gestão Pericial (Mini-SaaS)

Este documento é um guia passo a passo detalhado para a implementação do Mini-SaaS de Gestão Pericial. Ele foi estruturado para orientar o desenvolvimento da aplicação, garantindo uma arquitetura robusta, navegação fluida entre múltiplas páginas e um banco de dados bem modelado.

## 1. Arquitetura de Rotas e Navegação

A aplicação não deve ser uma Single Page Application (SPA) simples de uma única tela, mas sim um sistema modular com rotas bem definidas e controle de acesso (autenticação e autorização).

### 1.1. Rotas Públicas (Sem Autenticação)
*   `/` (Landing Page): Página de apresentação do sistema, destacando os benefícios para peritos, com botões de "Login" e "Teste Grátis".
*   `/login`: Tela de autenticação de usuários (E-mail e Senha). Deve incluir opção de "Esqueci minha senha".
*   `/cadastro`: Tela para novos peritos criarem suas contas no sistema.

### 1.2. Rotas Privadas (Requer Autenticação)
Todas as rotas abaixo devem ser protegidas por um middleware de autenticação (ex: JWT - JSON Web Token).

*   `/dashboard`: A página inicial após o login. Contém os KPIs, gráficos de processos e alertas de prazos.
*   `/processos`: Listagem geral de todos os processos cadastrados, com filtros (por status, vara, cliente) e barra de busca.
*   `/processos/novo`: Formulário para cadastro de um novo processo ou perícia.
*   `/processos/:id`: Visão detalhada de um processo específico (histórico, documentos anexados, prazos).
*   `/kanban`: O quadro ágil interativo para gestão visual do fluxo de trabalho (arrastar e soltar cards).
*   `/financeiro`: Módulo de controle de honorários, com visão de recebíveis, pagamentos e relatórios financeiros.
*   `/agenda`: Calendário integrado com as diligências e prazos dos processos.
*   `/configuracoes`: Perfil do usuário, alteração de senha e preferências do sistema.

### 1.3. Rotas Administrativas (Requer Perfil Admin)
*   `/admin`: Dashboard exclusivo para o administrador do sistema (Fernando Perez ou gestor do SaaS).
*   `/admin/usuarios`: Gestão de usuários cadastrados (peritos e assistentes), permitindo bloquear, ativar ou alterar permissões.
*   `/admin/planos`: Controle de assinaturas e planos do SaaS.

## 2. Modelagem de Dados (Banco de Dados)

Para que o sistema funcione perfeitamente, a estrutura do banco de dados (relacional, como PostgreSQL) deve ser bem definida. Abaixo estão as principais tabelas e seus relacionamentos:

### 2.1. Tabela `Usuarios`
Armazena os dados dos peritos e administradores.
*   `id` (UUID, Primary Key)
*   `nome` (String)
*   `email` (String, Unique)
*   `senha_hash` (String)
*   `role` (Enum: 'admin', 'perito', 'assistente')
*   `data_criacao` (Timestamp)

### 2.2. Tabela `Processos`
O coração do sistema, onde as perícias são registradas.
*   `id` (UUID, Primary Key)
*   `usuario_id` (UUID, Foreign Key -> Usuarios)
*   `numero_processo` (String)
*   `vara_comarca` (String)
*   `tipo_pericia` (String)
*   `status` (Enum: 'backlog', 'aguardando_doc', 'diligencia', 'elaboracao', 'revisao', 'concluido')
*   `data_nomeacao` (Date)
*   `prazo_entrega` (Date)
*   `descricao` (Text)

### 2.3. Tabela `Honorarios`
Controle financeiro vinculado aos processos.
*   `id` (UUID, Primary Key)
*   `processo_id` (UUID, Foreign Key -> Processos)
*   `valor_total` (Decimal)
*   `valor_recebido` (Decimal)
*   `status_pagamento` (Enum: 'pendente', 'parcial', 'pago')
*   `data_vencimento` (Date)

### 2.4. Tabela `Documentos`
Gerenciamento dos arquivos anexados (GED).
*   `id` (UUID, Primary Key)
*   `processo_id` (UUID, Foreign Key -> Processos)
*   `nome_arquivo` (String)
*   `url_arquivo` (String - Link do S3/Storage)
*   `data_upload` (Timestamp)

## 3. Passo a Passo de Implementação

Para o desenvolvimento fluido e organizado, siga estas etapas:

### Passo 1: Configuração do Ambiente e Repositório
1.  Inicializar o projeto Frontend (ex: React com Vite ou Next.js).
2.  Inicializar o projeto Backend (ex: Node.js com Express ou NestJS).
3.  Configurar o banco de dados (PostgreSQL) e o ORM (Prisma ou Sequelize).
4.  Configurar o repositório Git e as variáveis de ambiente (`.env`).

### Passo 2: Autenticação e Controle de Acesso
1.  Criar a tabela `Usuarios` no banco de dados.
2.  Desenvolver os endpoints de registro (`/api/auth/register`) e login (`/api/auth/login`).
3.  Implementar a geração e validação de tokens JWT.
4.  No Frontend, criar as telas de `/login` e `/cadastro` e configurar o roteamento protegido (Private Routes).

### Passo 3: CRUD de Processos (O Core)
1.  Criar a tabela `Processos`.
2.  Desenvolver a API RESTful para processos (GET, POST, PUT, DELETE).
3.  No Frontend, criar a tela de listagem (`/processos`) e o formulário de criação (`/processos/novo`).
4.  Implementar a tela de detalhes do processo (`/processos/:id`).

### Passo 4: Implementação do Kanban
1.  Utilizar uma biblioteca de drag-and-drop no Frontend (ex: `dnd-kit` ou `react-beautiful-dnd`).
2.  Criar a interface visual do quadro na rota `/kanban`, mapeando as colunas baseadas no campo `status` da tabela `Processos`.
3.  Configurar a ação de soltar o card para disparar uma requisição PUT na API, atualizando o `status` do processo no banco de dados.

### Passo 5: Dashboard e Indicadores
1.  Criar endpoints no Backend que retornem dados agregados (ex: contagem de processos por status, soma de honorários).
2.  No Frontend, na rota `/dashboard`, integrar bibliotecas de gráficos (ex: Recharts ou Chart.js).
3.  Implementar a lógica de cores responsivas (ex: se `prazo_entrega` < 3 dias, cor = vermelho).

### Passo 6: Módulos Adicionais (Financeiro e Documentos)
1.  Criar as tabelas `Honorarios` e `Documentos`.
2.  Integrar um serviço de storage (AWS S3 ou similar) para upload de arquivos.
3.  Desenvolver as telas de gestão financeira (`/financeiro`) e a aba de anexos dentro da tela de detalhes do processo.

### Passo 7: Área Administrativa
1.  Criar as rotas protegidas para o perfil 'admin'.
2.  Desenvolver a tela `/admin/usuarios` para gestão de acessos.

### Passo 8: Testes e Deploy
1.  Realizar testes de usabilidade e segurança (garantir que um perito não veja os processos de outro).
2.  Configurar o deploy do banco de dados (ex: Supabase, Render).
3.  Fazer o deploy do Backend e Frontend (ex: Vercel, Railway).

---
*Este guia fornece a estrutura técnica necessária para que a equipe de desenvolvimento construa um sistema escalável, seguro e perfeitamente alinhado com as necessidades da gestão pericial.*
