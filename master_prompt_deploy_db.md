# Master Prompt: Migração de Banco de Dados (Prisma para Neon) e Deploy na Vercel

**Objetivo:** Configurar a aplicação para utilizar o banco de dados Neon em produção, migrar o esquema do Prisma para o Neon e garantir que o deploy na Vercel seja bem-sucedido, conectando-se corretamente ao novo banco de dados.

**Contexto:** O usuário já criou o projeto no Neon e possui a `Connection String` do banco de dados em mãos.

## 1. Configuração do Ambiente Local e `schema.prisma`

O agente de desenvolvimento DEVE garantir que o projeto esteja configurado para usar a `DATABASE_URL` de forma dinâmica.

1.  **Verificar `schema.prisma`:** Abrir o arquivo `prisma/schema.prisma` e confirmar que a `datasource db` está configurada para usar a variável de ambiente:
    ```prisma
    datasource db {
      provider = "postgresql"
      url      = env("DATABASE_URL")
    }
    ```
2.  **Configurar `.env.local` (Apenas para Testes Locais):** Para testes locais e para rodar comandos do Prisma localmente, o agente DEVE criar ou atualizar o arquivo `.env.local` na raiz do projeto com a `Connection String` do Neon.
    ```dotenv
    DATABASE_URL="SUA_CONNECTION_STRING_DO_NEON_AQUI"
    ```
    **ATENÇÃO:** Esta linha é apenas para o ambiente de desenvolvimento local. Ela **NÃO** deve ser versionada no Git. Certifique-se de que `.env.local` esteja no `.gitignore`.

## 2. Migração do Esquema do Prisma para o Neon

O agente DEVE aplicar o esquema do banco de dados definido no Prisma para o banco de dados Neon.

1.  **Instalar Dependências (se necessário):** Confirmar que `prisma` e `@prisma/client` estão instalados:
    ```bash
    npm install prisma @prisma/client
    # ou
    yarn add prisma @prisma/client
    ```
2.  **Executar Migração:** Utilizar o comando `prisma migrate deploy` para aplicar as migrações existentes ao banco de dados Neon. Este comando usará a `DATABASE_URL` definida no `.env.local` (ou no ambiente do terminal).
    ```bash
    npx prisma migrate deploy
    ```
    *   **Se for a primeira migração para o Neon:** Se ainda não houver migrações criadas, o agente DEVE primeiro criar uma migração localmente (`npx prisma migrate dev --name initial_setup`) e depois executar o `deploy`.
    *   **Verificação:** Após a execução, o agente DEVE verificar no painel do Neon se as tabelas foram criadas corretamente.

## 3. Configuração do Deploy na Vercel

O agente DEVE configurar o projeto na Vercel para que ele se conecte ao banco de dados Neon em produção.

1.  **Repositório GitHub:** Garantir que o código mais recente esteja no repositório GitHub e que o arquivo `.env.local` **NÃO** esteja incluído.
2.  **Importar Projeto na Vercel:** Se o projeto ainda não estiver importado, o agente DEVE importá-lo do GitHub para a Vercel.
3.  **Configurar Variáveis de Ambiente na Vercel:** Este é o passo mais crítico para a conexão em produção.
    *   No painel da Vercel, navegar até as **Configurações do Projeto** -> **Environment Variables**.
    *   Adicionar uma nova variável de ambiente:
        *   **Name:** `DATABASE_URL`
        *   **Value:** Colar a `Connection String` **COMPLETA e CORRETA** do Neon (a mesma usada no `.env.local`).
        *   **Environments:** Selecionar `Production`, `Preview` e `Development` para garantir que todos os ambientes de deploy usem o Neon.
4.  **Disparar Novo Deploy:** Após adicionar a variável de ambiente, o agente DEVE disparar um novo deploy na Vercel (manualmente ou fazendo um pequeno `git push` para a branch principal) para que a nova variável seja reconhecida.
5.  **Verificação Pós-Deploy:** Acessar a URL de produção da Vercel e verificar se a aplicação está funcionando corretamente e se está se conectando ao banco de dados Neon sem erros.

## 4. Migração de Dados Existentes (Se Aplicável)

Se houver dados importantes no banco de dados local que precisam ser transferidos para o Neon, o agente DEVE seguir as instruções do "Guia Completo: Deploy da Aplicação e Migração do Banco de Dados" (seção 2.3) para exportar e importar os dados. Caso contrário, o banco de dados Neon começará vazio.
